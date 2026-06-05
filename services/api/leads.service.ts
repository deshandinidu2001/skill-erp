import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import type { EntityStatus, FilterParams } from "@/types";
import { auditLog, countRows, generateCode, idSchema, resolveId } from "@/services/api/common";
import { mapEstimation, mapLead, mapQuotation } from "@/services/api/mappers";

const createLeadSchema = z.object({
  customer_id: z.number().int().positive(),
  project_location: z.string().min(1),
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
    .select("*, customers(*), app_users!assigned_marketing_owner_id(full_name,id)")
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status as Database["public"]["Enums"]["lead_status"]);
  if (filters?.ownerId) query = query.eq("assigned_marketing_owner_id", filters.ownerId);
  if (filters?.projectType) query = query.eq("project_type", filters.projectType as Database["public"]["Enums"]["project_type"]);
  if (filters?.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters?.dateTo) query = query.lte("created_at", filters.dateTo);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapLead(row));
}

export async function getLeadById(id: string) {
  const supabase = createAdminClient();
  const parsed = idSchema.parse(id);
  const numericId = await resolveId("leads", parsed, "lead_code");
  if (!numericId) return undefined;
  const { data, error } = await supabase
    .from("leads")
    .select("*, customers(*), app_users!assigned_marketing_owner_id(full_name,id)")
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
    .select("*, customers(*), app_users!assigned_marketing_owner_id(full_name,id)")
    .eq("id", numericId)
    .single();
  if (error) throw new Error(error.message);

  const [{ data: estimations }, { data: quotations }, { data: communications }, { data: attachments }, { data: logs }] =
    await Promise.all([
      supabase.from("estimations").select("*, leads(*, customers(*)), app_users!assigned_qs_engineer(full_name,id)").eq("lead_id", numericId),
      supabase.from("quotations").select("*, leads(*, customers(*)), app_users!created_by(full_name,id)").eq("lead_id", numericId),
      supabase.from("lead_communications").select("*, app_users!discussed_by(full_name)").eq("lead_id", numericId),
      supabase.from("file_attachments").select("*").eq("entity_type", "lead").eq("entity_id", numericId),
      supabase.from("lead_status_logs").select("*, app_users!changed_by(full_name)").eq("lead_id", numericId).order("changed_at", { ascending: false }),
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
      summary: row.summary,
      discussedAt: String(row.discussed_at).slice(0, 10),
      nextActionDate: row.next_action_date ?? undefined,
      nextActionOwner: row.next_action_owner ? String(row.next_action_owner) : undefined,
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
        timestamp: String(log.changed_at),
        summary: `${log.old_status ?? "created"} to ${log.new_status}`,
      })),
    ],
  };
}

export async function createLead(payload: unknown, userId: string) {
  const supabase = createAdminClient();
  const input = createLeadSchema.parse(payload);
  const lead_code = generateCode("LEAD", await countRows("leads"));
  const { data, error } = await supabase
    .from("leads")
    .insert({ ...input, lead_code, created_by: userId })
    .select()
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("lead_status_logs").insert({ lead_id: data.id, new_status: "new", changed_by: userId });
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
  if (parsed.status === "rejected" && parsed.remarks) patch.rejection_reason = parsed.remarks;
  const { data, error } = await supabase.from("leads").update(patch).eq("id", leadId).select().single();
  if (error) throw new Error(error.message);
  await supabase.from("lead_status_logs").insert({
    lead_id: leadId,
    old_status: current.status,
    new_status: parsed.status,
    remarks: parsed.remarks,
    changed_by: userId,
  });
  await auditLog({ userId, action: "update", module: "leads", recordId: leadId, oldValues: current, newValues: patch });
  return mapLead(data);
}

export async function sendLeadToQs(id: string, userId?: string) {
  return updateLeadStatus(id, "qs_estimation_pending", userId);
}
