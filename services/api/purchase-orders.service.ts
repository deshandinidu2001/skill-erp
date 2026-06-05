import "server-only";

import { z } from "zod";
import { PO_APPROVAL_THRESHOLD } from "@/constants/stock";
import { createAdminClient } from "@/lib/supabase/server";
import { auditLog, countRows, generateCode, idSchema, resolveId } from "@/services/api/common";
import { mapPurchaseOrder } from "@/services/api/mappers";

const lineSchema = z.object({
  itemId: z.string().min(1),
  orderedQty: z.number().positive(),
  unit_id: z.number().int().positive().optional(),
  unitPrice: z.number().nonnegative(),
  tax: z.number().nonnegative().default(0),
});

const schema = z.object({
  supplierId: z.string().min(1),
  project_id: z.union([z.string(), z.number()]),
  site_id: z.number().int().positive(),
  linkedRequestId: z.string().optional(),
  issueDate: z.string().min(1),
  expectedDeliveryDate: z.string().optional(),
  lines: z.array(lineSchema).min(1),
});

export async function getPurchaseOrders() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("*, suppliers(*), projects(*), sites(*), stock_requests(*), purchase_order_items(*, materials(*), units_of_measure(*))")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapPurchaseOrder(row));
}

export async function getPurchaseOrderById(id: string) {
  const supabase = createAdminClient();
  const numericId = await resolveId("purchase_orders", idSchema.parse(id), "po_number");
  if (!numericId) return undefined;
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("*, suppliers(*), projects(*), sites(*), stock_requests(*), purchase_order_items(*, materials(*), units_of_measure(*))")
    .eq("id", numericId)
    .single();
  if (error) throw new Error(error.message);
  return mapPurchaseOrder(data);
}

export async function createPurchaseOrder(payload: unknown, userId: string) {
  const input = schema.parse(payload);
  const supabase = createAdminClient();
  const projectId = await resolveId("projects", String(input.project_id), "project_code");
  if (!projectId) throw new Error("Project is required.");
  const supplierId = await resolveId("suppliers", input.supplierId, "supplier_code");
  if (!supplierId) throw new Error("Supplier is required.");
  const requestId = input.linkedRequestId ? await resolveId("stock_requests", input.linkedRequestId, "request_code") : undefined;
  const total = input.lines.reduce((sum, line) => sum + line.orderedQty * line.unitPrice + line.tax, 0);
  const { data, error } = await supabase
    .from("purchase_orders")
    .insert({
      po_number: generateCode("PO", await countRows("purchase_orders")),
      supplier_id: supplierId,
      project_id: projectId,
      site_id: input.site_id,
      stock_request_id: requestId,
      issue_date: input.issueDate,
      expected_delivery_date: input.expectedDeliveryDate,
      total_amount: total,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  const lines = input.lines.map((line) => ({
    purchase_order_id: data.id,
    material_id: Number(line.itemId),
    quantity: line.orderedQty,
    unit_id: line.unit_id,
    unit_price: line.unitPrice,
    tax_amount: line.tax,
  }));
  const { error: lineError } = await supabase.from("purchase_order_items").insert(lines);
  if (lineError) {
    await supabase.from("purchase_orders").delete().eq("id", data.id);
    throw new Error(lineError.message);
  }
  await auditLog({ userId, action: "create", module: "purchase_orders", recordId: data.id, newValues: { ...data, lines } });
  return getPurchaseOrderById(String(data.id));
}

export async function approvePurchaseOrder(id: string, role: string, userId?: string) {
  const supabase = createAdminClient();
  const numericId = await resolveId("purchase_orders", idSchema.parse(id), "po_number");
  if (!numericId) throw new Error("Purchase order not found.");
  const { data: po, error: poError } = await supabase.from("purchase_orders").select("total_amount, status").eq("id", numericId).single();
  if (poError) throw new Error(poError.message);
  if (Number(po.total_amount ?? 0) > PO_APPROVAL_THRESHOLD && role !== "finance_manager" && role !== "super_admin") throw new Error("Finance manager approval required above threshold.");
  const { error } = await supabase.from("purchase_orders").update({ status: "approved" }).eq("id", numericId);
  if (error) throw new Error(error.message);
  await supabase.from("purchase_approvals").insert({ purchase_order_id: numericId, approved_by: userId, approver_role: role as never, status: "approved", approved_at: new Date().toISOString() });
  await auditLog({ userId, action: "update", module: "purchase_orders", recordId: numericId, oldValues: po, newValues: { status: "approved" } });
  return getPurchaseOrderById(String(numericId));
}
