import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import type { EntityStatus, FilterParams } from "@/types";
import { auditLog, countRows, generateCode, idSchema, resolveId } from "@/services/api/common";
import { mapEstimation, mapLead, mapQuotation } from "@/services/api/mappers";

const createLeadSchema = z.object({
  customer_id: z.number().int().positive().optional(),
  customer_name: z.string().trim().optional(),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  alternate_phone: z.string().trim().optional(),
  company_name: z.string().trim().optional(),
  project_location: z.string().optional(),
  project_type: z.enum(["drawing_only", "2d_3d", "construction_only", "full_project"]),
  requirement_description: z.string().min(1),
  drawing_requirements: z.string().optional(),
  construction_requirements: z.string().optional(),
  additional_notes: z.string().optional(),
  lead_source: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  assigned_marketing_owner_id: z.string().uuid().optional(),
  preferred_start_date: z.string().optional(),
  estimated_budget_range: z.string().optional(),
  urgency: z.string().optional(),
  tags: z.string().optional(),
});

const statusSchema = z.object({
  status: z.enum(["new", "under_review", "qs_estimation_pending", "quotation_submitted", "client_discussion", "approved", "rejected", "closed"]),
  remarks: z.string().optional(),
});

const ALLOWED: Record<string, string[]> = {
  new: ["under_review", "qs_estimation_pending", "rejected"],
  under_review: ["qs_estimation_pending", "rejected"],
  qs_estimation_pending: ["quotation_submitted", "rejected"],
  quotation_submitted: ["client_discussion", "approved", "rejected"],
  client_discussion: ["approved", "rejected", "revision_requested"],
  approved: ["closed"],
  rejected: ["closed"],
};

export async function getLeads(filters?: FilterParams & { ownerId?: string; projectType?: string; dateFrom?: string; dateTo?: string }) {
  const supabase = createAdminClient();
  let query = supabase
    .from("leads")
    .select("*, customers(*), app_users!assigned_to(full_name,id)")
    .order("created_at", { ascending: false });
  if (filters?.status) query = query.eq("status", filters.status as never);
  if (filters?.ownerId) query = query.eq("assigned_to", filters.ownerId);
  if (filters?.projectType) query = query.eq("project_type", filters.projectType as never);
  if (filters?.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters?.dateTo) query = query.lte("created_at", filters.dateTo);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapLead(row));
}

export async function getLeadById(id: string) {
  const supabase = createAdminClient();
  const numericId = await resolveId("leads", idSchema.parse(id), "lead_code");
  if (!numericId) return undefined;
  const { data, error } = await supabase
    .from("leads")
    .select("*, customers(*), app_users!assigned_to(full_name,id)")
    .eq("id", numericId)
    .single();
  if (error) throw new Error(error.message);
  return mapLead(data);
}

export async function getLeadDetail(id: string) {
  const supabase = createAdminClient();
  const numericId = await resolveId("leads", idSchema.parse(id), "lead_code");
  if (!numericId) return undefined;
  const { data, error } = await supabase
    .from("leads")
    .select("*, customers(*), app_users!assigned_to(full_name,id)")
    .eq("id", numericId)
    .single();
  if (error) throw new Error(error.message);

  const [{ data: estimations }, { data: quotations }, { data: communications }, { data: attachments }, { data: logs }] =
    await Promise.all([
      supabase.from("estimations").select("*, leads(*, customers(*)), app_users!prepared_by(full_name,id)").eq("lead_id", numericId),
      supabase.from("quotations").select("*, leads(*, customers(*)), app_users!created_by(full_name,id)").eq("lead_id", numericId),
      supabase.from("lead_communications").select("*, app_users!created_by(full_name)").eq("lead_id", numericId),
      supabase.from("file_attachments").select("*").eq("entity_type", "lead").eq("entity_id", numericId),
      supabase.from("lead_status_logs").select("*, app_users!changed_by(full_name)").eq("lead_id", numericId).order("created_at", { ascending: false }),
    ]);

  const lead = mapLead(data);
  return {
    lead,
    estimations: (estimations ?? []).map((row) => mapEstimation(row)),
    quotations: (quotations ?? []).map((row) => mapQuotation(row)),
    communications: (communications ?? []).map((row) => ({
      id: String(row.id),
      leadId: String(row.lead_id),
      type: row.type,
      summary: row.notes,
      discussedAt: String(row.created_at).slice(0, 10),
      nextActionDate: undefined,
      nextActionOwner: undefined,
      owner: row.app_users?.full_name ?? "",
    })),
    notes: [],
    attachments: (attachments ?? []).map((row) => ({
      id: String(row.id),
      parentId: String(row.entity_id),
      name: row.original_name,
      type: row.mime_type,
      uploader: String(row.uploaded_by ?? ""),
      date: String(row.created_at).slice(0, 10),
    })),
    timeline: [
      { actor: lead.owner || "System", action: "created lead", timestamp: `${lead.createdAt}T09:00:00`, summary: lead.title },
      ...(logs ?? []).map((log) => ({
        actor: log.app_users?.full_name ?? "System",
        action: "updated status",
        timestamp: String(log.created_at),
        summary: `${log.from_status ?? "created"} to ${log.to_status}`,
      })),
    ],
  };
}

export async function createLead(payload: unknown, userId: string) {
  const supabase = createAdminClient();
  const input = createLeadSchema.parse(payload);
  let customerId = input.customer_id;
  if (!customerId) {
    const customerName = input.customer_name?.trim() || input.company_name?.trim();
    if (!customerName) throw new Error("Customer name is required.");
    const { data: existingByName, error: existingByNameError } = await supabase
      .from("customers")
      .select("id")
      .ilike("name", customerName)
      .maybeSingle();
    if (existingByNameError) throw new Error(existingByNameError.message);
    const { data: existingCustomer, error: existingCustomerError } = existingByName
      ? { data: existingByName, error: null }
      : await supabase
          .from("customers")
          .select("id")
          .ilike("display_name", customerName)
          .maybeSingle();
    if (existingCustomerError) throw new Error(existingCustomerError.message);
    if (existingCustomer) {
      customerId = existingCustomer.id;
      const { error: customerUpdateError } = await supabase
        .from("customers")
        .update({
          company_name: input.company_name || undefined,
          email: input.email || undefined,
          phone: input.phone || undefined,
          primary_phone: input.phone || undefined,
          secondary_phone: input.alternate_phone || undefined,
          address: input.project_location || undefined,
        })
        .eq("id", customerId);
      if (customerUpdateError) throw new Error(customerUpdateError.message);
    } else {
      const customer_code = generateCode("CUS", await countRows("customers"));
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .insert({
          customer_code,
          name: customerName,
          display_name: customerName,
          company_name: input.company_name || undefined,
          email: input.email || undefined,
          phone: input.phone || undefined,
          primary_phone: input.phone || undefined,
          secondary_phone: input.alternate_phone || undefined,
          address: input.project_location || undefined,
        })
        .select("id")
        .single();
      if (customerError) throw new Error(customerError.message);
      customerId = customer.id;
    }
  }
  const lead_code = generateCode("LEAD", await countRows("leads"));
  const { data, error } = await supabase
    .from("leads")
    .insert({
      lead_code,
      customer_id: customerId,
      title: input.requirement_description,
      client_name: input.customer_name || input.company_name,
      email: input.email || undefined,
      phone: input.phone || undefined,
      project_type: input.project_type,
      priority: input.priority,
      assigned_to: input.assigned_marketing_owner_id ?? userId,
      assigned_marketing_owner_id: input.assigned_marketing_owner_id ?? userId,
      project_location: input.project_location || undefined,
      lead_source: input.lead_source || undefined,
      estimated_budget_range: input.estimated_budget_range || undefined,
      preferred_start_date: (input.preferred_start_date && input.preferred_start_date.trim()) ? input.preferred_start_date.trim() : null,
      requirement_description: input.requirement_description,
      drawing_requirements: input.drawing_requirements || undefined,
      construction_requirements: input.construction_requirements || undefined,
      additional_notes: input.additional_notes || undefined,
      notes: [
        input.project_location ? `Project location: ${input.project_location}` : "",
        input.lead_source ? `Lead source: ${input.lead_source}` : "",
        input.estimated_budget_range ? `Budget range: ${input.estimated_budget_range}` : "",
        input.preferred_start_date ? `Preferred start: ${input.preferred_start_date}` : "",
        input.urgency ? `Urgency: ${input.urgency}` : "",
        input.tags ? `Tags: ${input.tags}` : "",
        input.drawing_requirements,
        input.construction_requirements,
        input.additional_notes,
      ].filter(Boolean).join("\n\n") || undefined,
    })
    .select("*, customers(*), app_users!assigned_to(full_name,id)")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("lead_status_logs").insert({ lead_id: data.id, to_status: "new", changed_by: userId });
  await auditLog({ userId, action: "create", module: "leads", recordId: data.id, newValues: data });
  return mapLead(data);
}

export async function updateLeadStatus(id: string, status: EntityStatus, reasonOrUserId?: string, maybeReason?: string) {
  const supabase = createAdminClient();
  const leadId = await resolveId("leads", idSchema.parse(id), "lead_code");
  if (!leadId) throw new Error("Lead not found.");
  const parsed = statusSchema.parse({ status, remarks: maybeReason ?? reasonOrUserId });
  const userId = maybeReason ? reasonOrUserId : undefined;
  const { data: current, error: currentError } = await supabase.from("leads").select("status").eq("id", leadId).single();
  if (currentError) throw new Error(currentError.message);
  if (!ALLOWED[String(current.status)]?.includes(parsed.status)) {
    throw new Error(`Invalid transition: ${current.status} to ${parsed.status}`);
  }
  const patch: Record<string, unknown> = { status: parsed.status };
  if (parsed.status === "rejected" && parsed.remarks) patch.notes = parsed.remarks;
  const { data, error } = await supabase.from("leads").update(patch).eq("id", leadId).select().single();
  if (error) throw new Error(error.message);
  await supabase.from("lead_status_logs").insert({
    lead_id: leadId,
    from_status: current.status,
    to_status: parsed.status,
    note: parsed.remarks,
    changed_by: userId,
  });
  await auditLog({ userId, action: "update", module: "leads", recordId: leadId, oldValues: current, newValues: patch });
  return mapLead(data);
}

export async function sendLeadToQs(id: string, userId?: string) {
  return updateLeadStatus(id, "qs_estimation_pending", userId);
}
