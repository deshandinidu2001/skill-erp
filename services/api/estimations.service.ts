import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { auditLog, countRows, generateCode, idSchema, resolveId } from "@/services/api/common";
import { mapEstimation } from "@/services/api/mappers";
import type { FilterParams } from "@/types";

const estimationSchema = z.object({
  lead_id: z.number().int().positive(),
  assigned_qs_engineer: z.string().uuid().optional(),
  material_cost_total: z.number().nonnegative().default(0),
  labour_cost_total: z.number().nonnegative().default(0),
  equipment_cost_total: z.number().nonnegative().default(0),
  overhead_cost_total: z.number().nonnegative().default(0),
  profit_margin_pct: z.number().nonnegative().default(0),
  notes: z.string().optional(),
});

const transition: Record<string, string[]> = {
  draft: ["in_progress"],
  in_progress: ["ready_for_quotation", "revision_requested"],
  revision_requested: ["in_progress"],
  ready_for_quotation: ["quotation_submitted", "approved_baseline"],
  quotation_submitted: ["approved_baseline", "revision_requested"],
};

export async function getEstimations(filters?: FilterParams) {
  const supabase = createAdminClient();
  let query = supabase
    .from("estimations")
    .select("*, leads(*, customers(*)), app_users!assigned_qs_engineer(full_name,id)")
    .order("updated_at", { ascending: false });
  if (filters?.status) query = query.eq("status", filters.status as never);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapEstimation(row));
}

export async function getEstimationById(id: string) {
  const supabase = createAdminClient();
  const numericId = await resolveId("estimations", idSchema.parse(id), "estimation_code");
  if (!numericId) return undefined;
  const { data, error } = await supabase
    .from("estimations")
    .select("*, leads(*, customers(*)), app_users!assigned_qs_engineer(full_name,id), estimation_lines(*)")
    .eq("id", numericId)
    .single();
  if (error) throw new Error(error.message);
  const mapped = mapEstimation(data);
  mapped.lines = (data.estimation_lines ?? []).map((line: Record<string, unknown>) => ({
    id: String(line.id),
    category: String(line.category ?? ""),
    description: String(line.item_description ?? ""),
    qty: Number(line.quantity ?? 0),
    unit: String(line.unit ?? ""),
    unitRate: Number(line.unit_rate ?? 0),
    remarks: line.remarks ? String(line.remarks) : undefined,
  }));
  return mapped;
}

export async function createEstimation(payload: unknown, userId: string) {
  const input = estimationSchema.parse(payload);
  const supabase = createAdminClient();
  const subtotal = input.material_cost_total + input.labour_cost_total + input.equipment_cost_total + input.overhead_cost_total;
  const profit_margin_value = subtotal * (input.profit_margin_pct / 100);
  const { data, error } = await supabase
    .from("estimations")
    .insert({
      ...input,
      estimation_code: generateCode("EST", await countRows("estimations")),
      subtotal,
      profit_margin_value,
      grand_total: subtotal + profit_margin_value,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  await auditLog({ userId, action: "create", module: "estimations", recordId: data.id, newValues: data });
  return mapEstimation(data);
}

export async function updateEstimationStatus(id: string, status: string, userId?: string) {
  const supabase = createAdminClient();
  const numericId = await resolveId("estimations", idSchema.parse(id), "estimation_code");
  if (!numericId) throw new Error("Estimation not found.");
  const { data: current, error: currentError } = await supabase.from("estimations").select("status").eq("id", numericId).single();
  if (currentError) throw new Error(currentError.message);
  if (!transition[String(current.status)]?.includes(status)) throw new Error(`Invalid transition: ${current.status} to ${status}`);
  const { data, error } = await supabase.from("estimations").update({ status }).eq("id", numericId).select().single();
  if (error) throw new Error(error.message);
  await auditLog({ userId, action: "update", module: "estimations", recordId: numericId, oldValues: current, newValues: { status } });
  return mapEstimation(data);
}

export async function markEstimationReady(id: string, userId?: string) {
  return updateEstimationStatus(id, "ready_for_quotation", userId);
}
