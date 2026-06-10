import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { auditLog, idSchema, resolveId } from "@/services/api/common";
import { mapEmployee } from "@/services/api/mappers";

const schema = z.object({
  employee_code: z.string().optional(),
  full_name: z.string().min(1),
  nic: z.string().optional(),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  department_id: z.number().int().positive().optional(),
  position_id: z.number().int().positive().optional(),
  work_role_id: z.number().int().positive().optional(),
  joining_date: z.string().min(1),
  salary_type: z.enum(["monthly", "daily", "hourly"]),
  basic_salary: z.number().positive(),
  allowances: z.array(z.object({ label: z.string(), amount: z.number() })).default([]),
  deductions: z.array(z.object({ label: z.string(), amount: z.number() })).default([]),
  department: z.string().optional(),
  position: z.string().optional(),
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

  // Resolve department_id if string 'department' is provided
  let depId = input.department_id;
  if (!depId && input.department) {
    const { data: depData } = await supabase
      .from("departments")
      .select("id")
      .or(`name.ilike."${input.department}",code.ilike."${input.department}"`)
      .limit(1)
      .maybeSingle();
    if (depData) {
      depId = Number(depData.id);
    } else {
      const { data: newDep } = await supabase
        .from("departments")
        .insert({ name: input.department, code: input.department.substring(0, 3).toUpperCase() })
        .select("id")
        .single();
      if (newDep) depId = Number(newDep.id);
    }
  }

  // Resolve position_id if string 'position' is provided
  let posId = input.position_id;
  if (!posId && input.position) {
    const { data: posData } = await supabase
      .from("positions")
      .select("id")
      .or(`title.ilike."${input.position}",name.ilike."${input.position}"`)
      .limit(1)
      .maybeSingle();
    if (posData) {
      posId = Number(posData.id);
    } else {
      const { data: newPos } = await supabase
        .from("positions")
        .insert({ title: input.position, department_id: depId })
        .select("id")
        .single();
      if (newPos) posId = Number(newPos.id);
    }
  }

  // Auto-generate employee code if missing
  let code = input.employee_code;
  if (!code) {
    const { data: lastEmp } = await supabase
      .from("employees")
      .select("employee_code")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    let nextNum = 1;
    if (lastEmp?.employee_code?.startsWith("EMP-")) {
      const match = lastEmp.employee_code.match(/EMP-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    code = `EMP-${String(nextNum).padStart(3, "0")}`;
  }

  const { data, error } = await supabase
    .from("employees")
    .insert({
      employee_code: code,
      full_name: input.full_name,
      email: input.email || null,
      phone: input.phone,
      nic: input.nic || null,
      address: input.address || null,
      department_id: depId || null,
      position_id: posId || null,
      joined_on: input.joining_date,
      joining_date: input.joining_date,
      salary_type: input.salary_type,
      base_salary: input.basic_salary,
      basic_salary: input.basic_salary,
      allowances: input.allowances,
      deductions: input.deductions,
      is_active: true,
    })
    .select("*, departments(*), positions(*)")
    .single();
  if (error) throw new Error(error.message);
  await auditLog({ userId, action: "create", module: "employees", recordId: data.id, newValues: data });
  return mapEmployee(data);
}
