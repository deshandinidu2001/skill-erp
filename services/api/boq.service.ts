import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { auditLog, countRows, generateCode, idSchema, resolveId } from "@/services/api/common";

const boqSchema = z.object({
  estimation_id: z.number().int().positive().optional(),
  quotation_id: z.number().int().positive().optional(),
  version_number: z.number().int().positive().default(1),
  notes: z.string().optional(),
});

export async function getBoqs() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("boqs").select("*, boq_sections(*), boq_items(*)").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getBoqById(id: string) {
  const supabase = createAdminClient();
  const numericId = await resolveId("boqs", idSchema.parse(id), "boq_code");
  if (!numericId) return undefined;
  const { data, error } = await supabase.from("boqs").select("*, boq_sections(*), boq_items(*)").eq("id", numericId).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createBoq(payload: unknown, userId: string) {
  const supabase = createAdminClient();
  const input = boqSchema.parse(payload);
  const { data, error } = await supabase
    .from("boqs")
    .insert({ ...input, boq_code: generateCode("BOQ", await countRows("boqs")), created_by: userId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  await auditLog({ userId, action: "create", module: "boqs", recordId: data.id, newValues: data });
  return data;
}
