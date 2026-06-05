import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { auditLog, countRows, generateCode, resolveId } from "@/services/api/common";

const lineSchema = z.object({
  itemId: z.string().min(1),
  receivedQty: z.number().nonnegative(),
  damagedQty: z.number().nonnegative().default(0),
});

const schema = z.object({
  poId: z.string().min(1),
  project_id: z.union([z.string(), z.number()]),
  site_id: z.number().int().positive().optional(),
  receivedDate: z.string().min(1),
  received_by: z.string().uuid().optional(),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1),
});

export async function getGoodsReceipts() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("goods_receipts").select("*, purchase_orders(*), goods_receipt_items(*, materials(*))").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    project_id: String(row.project_id),
    code: `GR-${String(row.id).padStart(5, "0")}`,
    poId: String(row.purchase_order_id),
    poCode: row.purchase_orders?.po_number ?? "",
    receivedDate: String(row.received_date),
    receivedBy: String(row.received_by ?? ""),
    lines: (row.goods_receipt_items ?? []).map((line: Record<string, unknown>) => ({
      itemId: String(line.material_id),
      itemName: String((line.materials as Record<string, unknown> | undefined)?.name ?? ""),
      orderedQty: 0,
      receivedQty: Number(line.received_quantity ?? 0),
      damagedQty: Number(line.damaged_quantity ?? 0),
    })),
  }));
}

export async function createGoodsReceipt(payload: unknown, userId: string) {
  const input = schema.parse(payload);
  const supabase = createAdminClient();
  const poId = await resolveId("purchase_orders", input.poId, "po_number");
  const projectId = await resolveId("projects", String(input.project_id), "project_code");
  if (!poId || !projectId) throw new Error("Purchase order and project are required.");
  const { data: po } = await supabase.from("purchase_orders").select("site_id").eq("id", poId).single();
  const { data, error } = await supabase
    .from("goods_receipts")
    .insert({ purchase_order_id: poId, project_id: projectId, site_id: input.site_id ?? po?.site_id, received_by: input.received_by ?? userId, received_date: input.receivedDate, notes: input.notes })
    .select()
    .single();
  if (error) throw new Error(error.message);
  const lines = input.lines.map((line) => ({ goods_receipt_id: data.id, material_id: Number(line.itemId), received_quantity: line.receivedQty, damaged_quantity: line.damagedQty }));
  const { error: lineError } = await supabase.from("goods_receipt_items").insert(lines);
  if (lineError) {
    await supabase.from("goods_receipts").delete().eq("id", data.id);
    throw new Error(lineError.message);
  }
  await supabase.from("purchase_orders").update({ status: "partially_received" }).eq("id", poId);
  await auditLog({ userId, action: "create", module: "goods_receipts", recordId: data.id, newValues: { ...data, lines } });
  return getGoodsReceipts();
}
