import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { auditLog } from "@/services/api/common";

const appUserSchema = z.object({
  id: z.string().uuid(),
  employee_code: z.string().optional(),
  full_name: z.string().min(1),
  role: z.string().min(1),
  department_id: z.number().int().positive().optional(),
  is_active: z.boolean().default(true),
});

export async function getUsers() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("app_users").select("*, departments(*)").order("full_name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.full_name),
    email: String(row.email ?? ""),
    role: row.role,
  }));
}

export async function upsertAppUser(payload: unknown, userId: string) {
  const input = appUserSchema.parse(payload);
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("app_users").upsert(input).select().single();
  if (error) throw new Error(error.message);
  await auditLog({ userId, action: "update", module: "app_users", recordId: data.id, newValues: data });
  return data;
}

export async function assignEmployeeToSite(employeeId: string, site: string, userId?: string) {
  const supabase = createAdminClient();
  const { data: employee, error: employeeError } = await supabase.from("employees").select("id, is_active, full_name").eq("id", Number(employeeId)).single();
  if (employeeError || !employee) throw new Error("Employee not found.");
  if (!employee.is_active) throw new Error("Cannot assign inactive employee to site.");
  const { data: siteRow, error: siteError } = await supabase.from("sites").select("id, site_name").or(`id.eq.${Number(site) || 0},site_code.eq.${site}`).limit(1).maybeSingle();
  if (siteError || !siteRow) throw new Error("Site not found.");
  const { data, error } = await supabase
    .from("employee_site_assignments")
    .insert({ employee_id: employee.id, site_id: siteRow.id, from_date: new Date().toISOString().slice(0, 10), assigned_by: userId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  await auditLog({ userId, action: "create", module: "employee_site_assignments", recordId: data.id, newValues: data });
  return { id: String(data.id), employeeId: String(employee.id), employeeName: employee.full_name, site: siteRow.site_name, from: data.from_date, status: "active" as const };
}
