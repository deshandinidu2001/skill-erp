import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { auditLog, countRows, generateCode } from "@/services/api/common";

const customerSchema = z.object({
  customer_type: z.string().default("individual"),
  display_name: z.string().min(1),
  company_name: z.string().optional(),
  primary_contact: z.string().min(1),
  primary_phone: z.string().min(1),
  secondary_phone: z.string().optional(),
  email: z.string().email().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  notes: z.string().optional(),
});

export async function getCustomers() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("customers").select("*").order("display_name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createCustomer(payload: unknown, userId: string) {
  const supabase = createAdminClient();
  const input = customerSchema.parse(payload);
  const customer_code = generateCode("CUS", await countRows("customers"));
  const { data, error } = await supabase
    .from("customers")
    .insert({ ...input, customer_code, created_by: userId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  await auditLog({ userId, action: "create", module: "customers", recordId: data.id, newValues: data });
  return data;
}
