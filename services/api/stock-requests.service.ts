import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { auditLog, countRows, generateCode, idSchema, resolveId } from "@/services/api/common";
import { mapStockRequest } from "@/services/api/mappers";

const lineSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().positive(),
  unit_id: z.number().int().positive().optional(),
  purpose: z.string().optional(),
  estimatedPrice: z.number().nonnegative().optional(),
});

const schema = z.object({
  project_id: z.union([z.string(), z.number()]),
  site_id: z.number().int().positive().optional(),
  site: z.string().optional(),
  requestDate: z.string().min(1),
  requiredByDate: z.string().min(1),
  requested_by: z.string().uuid().optional(),
  requestedBy: z.string().optional(),
  remarks: z.string().optional(),
  lines: z.array(lineSchema).min(1),
});

const transitions: Record<string, string[]> = {
  draft: ["submitted", "cancelled"],
  submitted: ["qs_review", "approved", "rejected"],
  qs_review: ["approved", "rejected"],
  approved: ["converted_to_po", "cancelled"],
  converted_to_po: ["partially_fulfilled", "completed"],
  partially_fulfilled: ["completed", "cancelled"],
};

export async function getStockRequests() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("stock_requests")
    .select("*, projects(*), sites(*), app_users!requested_by(full_name,id), stock_request_items(*, materials(*), units_of_measure(*))")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapStockRequest(row));
}

export async function getStockRequestById(id: string) {
  const supabase = createAdminClient();
  const numericId = await resolveId("stock_requests", idSchema.parse(id), "request_code");
  if (!numericId) return undefined;
  const { data, error } = await supabase
    .from("stock_requests")
    .select("*, projects(*), sites(*), app_users!requested_by(full_name,id), stock_request_items(*, materials(*), units_of_measure(*))")
    .eq("id", numericId)
    .single();
  if (error) throw new Error(error.message);
  return mapStockRequest(data);
}

export async function createStockRequest(payload: unknown, userId: string) {
  const input = schema.parse(payload);
  if (new Date(input.requiredByDate) < new Date(input.requestDate)) throw new Error("Required by date cannot be before request date.");
  const supabase = createAdminClient();
  const projectId = await resolveId("projects", String(input.project_id), "project_code");
  if (!projectId) throw new Error("Project is required.");
  const { data: project } = await supabase.from("projects").select("site_id").eq("id", projectId).single();
  const siteId = input.site_id ?? project?.site_id;
  if (!siteId) throw new Error("Site is required.");
  const { data, error } = await supabase
    .from("stock_requests")
    .insert({
      request_code: generateCode("SR", await countRows("stock_requests")),
      project_id: projectId,
      site_id: siteId,
      requested_by: input.requested_by ?? userId,
      request_date: input.requestDate,
      required_by_date: input.requiredByDate,
      remarks: input.remarks,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const lineInserts = input.lines.map((line) => ({
    stock_request_id: data.id,
    material_id: Number(line.itemId),
    quantity: line.quantity,
    unit_id: line.unit_id,
    estimated_price: line.estimatedPrice,
    purpose: line.purpose,
  }));
  const { error: lineError } = await supabase.from("stock_request_items").insert(lineInserts);
  if (lineError) {
    await supabase.from("stock_requests").delete().eq("id", data.id);
    throw new Error(lineError.message);
  }
  await auditLog({ userId, action: "create", module: "stock_requests", recordId: data.id, newValues: { ...data, lines: lineInserts } });
  return getStockRequestById(String(data.id));
}

export async function updateStockRequestStatus(id: string, status: string, reason?: string, userId?: string) {
  const supabase = createAdminClient();
  const numericId = await resolveId("stock_requests", idSchema.parse(id), "request_code");
  if (!numericId) throw new Error("Stock request not found.");
  const { data: current, error: currentError } = await supabase.from("stock_requests").select("status").eq("id", numericId).single();
  if (currentError) throw new Error(currentError.message);
  if (!transitions[String(current.status)]?.includes(status)) throw new Error(`Invalid transition: ${current.status} to ${status}`);
  const patch: Record<string, unknown> = { status };
  if (status === "rejected") patch.rejection_reason = reason;
  const { error } = await supabase.from("stock_requests").update(patch).eq("id", numericId);
  if (error) throw new Error(error.message);
  await auditLog({ userId, action: "update", module: "stock_requests", recordId: numericId, oldValues: current, newValues: patch });
  return getStockRequestById(String(numericId));
}
