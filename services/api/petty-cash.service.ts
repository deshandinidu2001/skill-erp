import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { auditLog } from "@/services/api/common";

const schema = z.object({
  project_id: z.number().int().positive(),
  employee_id: z.string().uuid(),
  amount: z.number().positive(),
  notes: z.string().optional(),
  authorized_by: z.string().uuid().optional(),
});

export async function getPettyCash(projectId?: number) {
  const supabase = createAdminClient();
  let query = supabase.from("petty_cash").select("*").order("issued_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function issuePettyCash(payload: unknown, userId: string) {
  const input = schema.parse(payload);
  if (input.amount <= 0) throw new Error("Petty cash amount must be greater than zero.");
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("petty_cash").insert({ ...input, authorized_by: input.authorized_by ?? userId }).select().single();
  if (error) throw new Error(error.message);
  await auditLog({ userId, action: "create", module: "petty_cash", recordId: data.id, newValues: data });
  return data;
}
