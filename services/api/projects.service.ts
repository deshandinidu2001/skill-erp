import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { auditLog, countRows, generateCode, idSchema, resolveId } from "@/services/api/common";
import { mapClientPayment, mapInventory, mapProject, mapProjectExpense, mapPurchaseOrder, mapStockRequest } from "@/services/api/mappers";
import { journalForExpense } from "@/services/api/journal.service";
import type { EntityStatus, FilterParams, ProjectExpense } from "@/types";

const projectSchema = z.object({
  project_name: z.string().min(1),
  client_id: z.number().int().positive(),
  lead_id: z.number().int().positive().optional(),
  boq_id: z.number().int().positive().optional(),
  quotation_id: z.number().int().positive().optional(),
  site_id: z.number().int().positive().optional(),
  budget_amount: z.number().nonnegative().default(0),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  assigned_project_manager_id: z.string().uuid().optional(),
  assigned_technical_officer_id: z.string().uuid().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

const expenseSchema = z.object({
  category: z.enum(["material", "labour", "transport", "misc"]),
  date: z.string().min(1),
  vendorOrPayee: z.string().optional(),
  amount: z.number().positive(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

const transitions: Record<string, string[]> = {
  draft: ["created", "cancelled"],
  created: ["assigned", "cancelled"],
  assigned: ["in_progress", "on_hold", "cancelled"],
  in_progress: ["on_hold", "completed", "cancelled"],
  on_hold: ["in_progress", "cancelled"],
  completed: ["closed"],
};

export async function getProjects(filters?: FilterParams) {
  const supabase = createAdminClient();
  let query = supabase
    .from("projects")
    .select("*, customers!client_id(*), sites(*), quotations(*), app_users!assigned_project_manager_id(full_name,id)")
    .order("created_at", { ascending: false });
  if (filters?.status) query = query.eq("status", filters.status as never);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapProject(row));
}

export async function getProjectById(id: string) {
  const supabase = createAdminClient();
  const numericId = await resolveId("projects", idSchema.parse(id), "project_code");
  if (!numericId) return undefined;
  const { data, error } = await supabase
    .from("projects")
    .select("*, customers!client_id(*), sites(*), quotations(*), app_users!assigned_project_manager_id(full_name,id)")
    .eq("id", numericId)
    .single();
  if (error) throw new Error(error.message);
  return mapProject(data);
}

export async function getProjectDetail(id: string) {
  const supabase = createAdminClient();
  const numericId = await resolveId("projects", idSchema.parse(id), "project_code");
  if (!numericId) return undefined;
  const project = await getProjectById(String(numericId));
  if (!project) return undefined;
  const [{ data: expenses }, { data: payments }, { data: requests }, { data: pos }, { data: inventory }, { data: docs }, { data: logs }] =
    await Promise.all([
      supabase.from("project_expenses").select("*, expense_categories(*)").eq("project_id", numericId),
      supabase.from("client_payments").select("*, customers(*)").eq("project_id", numericId),
      supabase.from("stock_requests").select("*, projects(*), sites(*), app_users!requested_by(full_name,id), stock_request_items(*, materials(*), units_of_measure(*))").eq("project_id", numericId),
      supabase.from("purchase_orders").select("*, suppliers(*), projects(*), sites(*), stock_requests(*), purchase_order_items(*, materials(*), units_of_measure(*))").eq("project_id", numericId),
      supabase.from("site_inventory").select("*, sites(*), materials(*, units_of_measure(*))"),
      supabase.from("file_attachments").select("*").eq("entity_type", "project").eq("entity_id", numericId),
      supabase.from("project_status_logs").select("*").eq("project_id", numericId),
    ]);
  return {
    project,
    quotation: undefined,
    team: [],
    progressUpdates: [],
    expenses: (expenses ?? []).map((row) => mapProjectExpense(row)),
    payments: (payments ?? []).map((row) => mapClientPayment(row)),
    stockRequests: (requests ?? []).map((row) => mapStockRequest(row)),
    purchaseOrders: (pos ?? []).map((row) => mapPurchaseOrder(row)),
    vehicles: [],
    documents: (docs ?? []).map((row) => ({ id: String(row.id), parentId: String(row.entity_id), name: row.original_name, type: row.mime_type, uploader: String(row.uploaded_by ?? ""), date: String(row.created_at).slice(0, 10) })),
    pettyCash: [],
    journalEntries: [],
    inventory: (inventory ?? []).map((row) => mapInventory(row)),
    timeline: [
      { actor: "System", action: "created project", timestamp: `${project.startDate}T08:00:00`, summary: project.name },
      ...(logs ?? []).map((log) => ({ actor: "System", action: "changed status", timestamp: String(log.updated_at), summary: `${log.old_status ?? "created"} to ${log.new_status}` })),
    ],
  };
}

export async function createProject(payload: unknown, userId: string) {
  const input = projectSchema.parse(payload);
  if (input.end_date && input.start_date && new Date(input.end_date) < new Date(input.start_date)) throw new Error("End date cannot be before start date.");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...input, project_code: generateCode("PRJ", await countRows("projects")), created_by: userId, status: "created" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  await auditLog({ userId, action: "create", module: "projects", recordId: data.id, newValues: data });
  return mapProject(data);
}

export async function changeProjectStatus(projectId: string, toStatus: EntityStatus, reason?: string, userId?: string) {
  const supabase = createAdminClient();
  const numericId = await resolveId("projects", idSchema.parse(projectId), "project_code");
  if (!numericId) throw new Error("Project not found.");
  const { data: project, error: projectError } = await supabase.from("projects").select("status").eq("id", numericId).single();
  if (projectError) throw new Error(projectError.message);
  if (!transitions[String(project.status)]?.includes(toStatus)) throw new Error(`Invalid transition: ${project.status} to ${toStatus}`);
  if (toStatus === "closed") {
    const { count } = await supabase.from("project_expenses").select("*", { count: "exact", head: true }).eq("project_id", numericId).eq("approval_status", "pending");
    if ((count ?? 0) > 0) throw new Error("Cannot close project with pending expenses.");
  }
  const patch: Record<string, unknown> = { status: toStatus };
  if (toStatus === "cancelled") patch.cancellation_reason = reason;
  const { data, error } = await supabase.from("projects").update(patch).eq("id", numericId).select().single();
  if (error) throw new Error(error.message);
  await supabase.from("project_status_logs").insert({ project_id: numericId, old_status: project.status, new_status: toStatus as never, remarks: reason, updated_by: userId });
  await auditLog({ userId, action: "update", module: "projects", recordId: numericId, oldValues: project, newValues: patch });
  return mapProject(data);
}

export async function addProjectExpense(projectId: string, expense: Pick<ProjectExpense, "category" | "date" | "vendorOrPayee" | "amount" | "paymentMethod" | "notes">, userId?: string) {
  const input = expenseSchema.parse(expense);
  const numericId = await resolveId("projects", idSchema.parse(projectId), "project_code");
  if (!numericId) throw new Error("Project not found.");
  const supabase = createAdminClient();
  const categoryName = input.category === "misc" ? "Miscellaneous" : input.category[0].toUpperCase() + input.category.slice(1);
  const { data: category } = await supabase.from("expense_categories").select("id, account_code").ilike("name", categoryName).maybeSingle();
  const { data, error } = await supabase
    .from("project_expenses")
    .insert({
      project_id: numericId,
      category_id: category?.id,
      expense_date: input.date,
      vendor_or_payee: input.vendorOrPayee,
      amount: input.amount,
      payment_method: input.paymentMethod,
      description: input.notes,
      created_by: userId,
    })
    .select("*, expense_categories(*)")
    .single();
  if (error) throw new Error(error.message);
  await auditLog({ userId, action: "create", module: "project_expenses", recordId: data.id, newValues: data });
  await journalForExpense({ id: data.id, amount: Number(data.amount), category_code: category?.account_code ?? "EXP-005", project_id: numericId, expense_date: input.date }, userId ?? "");
  return mapProjectExpense(data);
}

export async function createFromQuotation(quotationId: string, userId?: string) {
  const supabase = createAdminClient();
  const numericId = await resolveId("quotations", idSchema.parse(quotationId), "quotation_code");
  if (!numericId) throw new Error("Quotation not found.");
  const { data: quotation, error } = await supabase.from("quotations").select("*, leads(customer_id, project_location, requirement_description)").eq("id", numericId).single();
  if (error) throw new Error(error.message);
  return createProject(
    {
      project_name: `${quotation.quotation_code} - Approved works`,
      client_id: quotation.leads.customer_id,
      lead_id: quotation.lead_id,
      boq_id: quotation.boq_id ?? undefined,
      quotation_id: quotation.id,
      budget_amount: Number(quotation.grand_total ?? 0),
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    },
    userId ?? String(quotation.created_by ?? ""),
  );
}

export async function assignTeamMember() {
  throw new Error("Team assignment requires employee and project IDs from the real database.");
}

export async function issuePettyCash() {
  throw new Error("Use petty-cash.service.ts to issue petty cash.");
}
