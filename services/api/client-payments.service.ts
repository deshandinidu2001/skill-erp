import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { auditLog } from "@/services/api/common";
import { mapClientPayment } from "@/services/api/mappers";
import { journalForClientPayment } from "@/services/api/journal.service";

const schema = z.object({
  project_id: z.number().int().positive(),
  customer_id: z.number().int().positive(),
  amount: z.number().positive(),
  payment_date: z.string().min(1),
  payment_method: z.string().min(1),
  reference_no: z.string().optional(),
  milestone_ref: z.string().optional(),
  notes: z.string().optional(),
});

export async function getClientPayments(projectId?: number) {
  const supabase = createAdminClient();
  let query = supabase.from("client_payments").select("*, customers(*)").order("payment_date", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapClientPayment(row));
}

export async function createClientPayment(payload: unknown, userId: string) {
  const input = schema.parse(payload);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("client_payments")
    .insert({
      project_id: input.project_id,
      customer_id: input.customer_id,
      amount: input.amount,
      payment_date: input.payment_date,
      method: input.payment_method,
      reference_no: input.reference_no,
    })
    .select("*, customers(*)")
    .single();
  if (error) throw new Error(error.message);
  await auditLog({ userId, action: "create", module: "client_payments", recordId: data.id, newValues: data });
  await journalForClientPayment({ id: data.id, amount: Number(data.amount), project_id: data.project_id, payment_date: data.payment_date }, userId);
  return mapClientPayment(data);
}
