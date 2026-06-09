import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { auditLog, idSchema, resolveId } from "@/services/api/common";
import { mapEmployee } from "@/services/api/mappers";

const schema = z.object({
  employee_code: z.string().min(1),
  full_name: z.string().min(1),
  nic: z.string().optional(),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  address: z.string().optional(),
  department_id: z.number().int().positive().optional(),
  position_id: z.number().int().positive().optional(),
  work_role_id: z.number().int().positive().optional(),
  joining_date: z.string().min(1),
  salary_type: z.enum(["monthly", "daily", "hourly"]),
  basic_salary: z.number().positive(),
  allowances: z.array(z.object({ label: z.string(), amount: z.number() })).default([]),
  deductions: z.array(z.object({ label: z.string(), amount: z.number() })).default([]),
});

export async function getEmployees() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("employees").select("*, departments(*), positions(*)").order("full_name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapEmployee(row));
}

export async function getEmployeeById(id: string) {
  const supabase = createAdminClient();
  const numericId = await resolveId("employees", idSchema.parse(id), "employee_code");
  if (!numericId) return undefined;
  const { data, error } = await supabase.from("employees").select("*, departments(*), positions(*)").eq("id", numericId).single();
  if (error) throw new Error(error.message);
  const employee = mapEmployee(data);
  const [{ data: assignments }, { data: attendance }, { data: payrollLines }] = await Promise.all([
    supabase.from("employee_site_assignments").select("*, sites(*)").eq("employee_id", numericId),
    supabase.from("attendance").select("*").eq("employee_id", numericId),
    supabase.from("payroll_lines").select("*, payroll_batches(*)").eq("employee_id", numericId),
  ]);
  return {
    employee,
    assignments: assignments ?? [],
    attendance: attendance ?? [],
    payrollLines: payrollLines ?? [],
    timeline: [{ actor: "HR", action: "hired employee", timestamp: `${employee.joiningDate ?? ""}T09:00:00`, summary: employee.position ?? employee.role }],
  };
}

export async function createEmployee(payload: unknown, userId: string) {
  const input = schema.parse(payload);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("employees")
    .insert({
      employee_code: input.employee_code,
      full_name: input.full_name,
      email: input.email,
      phone: input.phone,
      department_id: input.department_id,
      position_id: input.position_id,
      joined_on: input.joining_date,
      salary_type: input.salary_type,
      base_salary: input.basic_salary,
    })
    .select("*, departments(*), positions(*)")
    .single();
  if (error) throw new Error(error.message);
  await auditLog({ userId, action: "create", module: "employees", recordId: data.id, newValues: data });
  return mapEmployee(data);
}
