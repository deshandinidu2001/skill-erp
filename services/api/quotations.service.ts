import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { auditLog, idSchema, resolveId } from "@/services/api/common";
import { mapQuotation } from "@/services/api/mappers";
import type { FilterParams } from "@/types";

const quotationSchema = z.object({
  lead_id: z.number().int().positive(),
  estimation_id: z.number().int().positive().optional(),
  boq_id: z.number().int().positive().optional(),
  issue_date: z.string().min(1),
  valid_until: z.string().min(1),
  subtotal: z.number().nonnegative().default(0),
  discount_value: z.number().nonnegative().default(0),
  tax_value: z.number().nonnegative().default(0),
  grand_total: z.number().nonnegative(),
  payment_terms_text: z.string().optional(),
  notes_and_exclusions: z.string().optional(),
});

const transition: Record<string, string[]> = {
  draft: ["under_review", "submitted", "client_sent", "archived"],
  under_review: ["submitted", "revision_requested", "archived"],
  submitted: ["client_sent", "revision_requested", "archived"],
  client_sent: ["approved", "rejected", "revision_requested", "expired"],
  revision_requested: ["draft", "under_review"],
  approved: ["archived"],
  rejected: ["archived"],
};

export async function getQuotations(filters?: FilterParams) {
  const supabase = createAdminClient();
  let query = supabase
    .from("quotations")
    .select("*, leads(*, customers(*)), app_users!created_by(full_name,id)")
    .order("created_at", { ascending: false });
  if (filters?.status) query = query.eq("status", filters.status as never);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapQuotation(row));
}

export async function getQuotationById(id: string) {
  const supabase = createAdminClient();
  const numericId = await resolveId("quotations", idSchema.parse(id), "quotation_no");
  if (!numericId) return undefined;
  const { data, error } = await supabase
    .from("quotations")
    .select("*, leads(*, customers(*)), app_users!created_by(full_name,id)")
    .eq("id", numericId)
    .single();
  if (error) throw new Error(error.message);
  const mapped = mapQuotation(data);
  mapped.clientResponses = [];
  return mapped;
}

export async function createQuotation(payload: unknown, userId: string) {
  const supabase = createAdminClient();
  const input = quotationSchema.parse(payload);
  if (new Date(input.valid_until) < new Date(input.issue_date)) throw new Error("Valid until cannot be before issue date.");
  const { count } = await supabase.from("quotations").select("*", { count: "exact", head: true }).eq("lead_id", input.lead_id);
  const code = `QUO-${String((count ?? 0) + 3001).padStart(4, "0")}`;
  const { data, error } = await supabase
    .from("quotations")
    .insert({
      lead_id: input.lead_id,
      estimation_id: input.estimation_id,
      quotation_no: code,
      title: code,
      valid_until: input.valid_until,
      subtotal: input.subtotal,
      discount: input.discount_value,
      tax_total: input.tax_value,
      grand_total: input.grand_total,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  await auditLog({ userId, action: "create", module: "quotations", recordId: data.id, newValues: data });
  return mapQuotation(data);
}

export async function markQuotationStatus(id: string, status: string, reason?: string, userId?: string) {
  const supabase = createAdminClient();
  const numericId = await resolveId("quotations", idSchema.parse(id), "quotation_no");
  if (!numericId) throw new Error("Quotation not found.");
  const { data: current, error: currentError } = await supabase.from("quotations").select("status, lead_id").eq("id", numericId).single();
  if (currentError) throw new Error(currentError.message);
  const dbStatus = status === "sent_to_client" ? "client_sent" : status;
  if (!transition[String(current.status)]?.includes(dbStatus)) throw new Error(`Invalid transition: ${current.status} to ${dbStatus}`);
  const patch: Record<string, unknown> = { status: dbStatus };
  const { data, error } = await supabase.from("quotations").update(patch).eq("id", numericId).select().single();
  if (error) throw new Error(error.message);
  if (["approved", "rejected", "revision_requested"].includes(dbStatus)) {
    await supabase.from("client_responses").insert({
      project_id: data.project_id,
      response_type: dbStatus,
      message: reason ?? `Quotation ${dbStatus}`,
    });
  }
  await auditLog({ userId, action: "update", module: "quotations", recordId: numericId, oldValues: current, newValues: patch });
  return mapQuotation(data);
}

export async function duplicateQuotationVersion(id: string, userId?: string) {
  const supabase = createAdminClient();
  const numericId = await resolveId("quotations", idSchema.parse(id), "quotation_no");
  if (!numericId) throw new Error("Quotation not found.");
  const { data: source, error } = await supabase.from("quotations").select("*").eq("id", numericId).single();
  if (error) throw new Error(error.message);
  await supabase.from("quotations").update({ status: "archived" }).eq("lead_id", source.lead_id).neq("id", numericId);
  return createQuotation(
    {
      lead_id: source.lead_id,
      estimation_id: source.estimation_id ?? undefined,
      issue_date: new Date().toISOString().slice(0, 10),
      valid_until: source.valid_until,
      subtotal: Number(source.subtotal ?? 0),
      discount_value: Number(source.discount ?? 0),
      tax_value: Number(source.tax_total ?? 0),
      grand_total: Number(source.grand_total ?? 0),
    },
    userId ?? String(source.created_by ?? ""),
  );
}
