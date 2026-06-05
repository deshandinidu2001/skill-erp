import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import { auditLog, idSchema, resolveId } from "@/services/api/common";
import { mapPayrollBatch } from "@/services/api/mappers";
import type { PayrollBatch } from "@/types";

export const EPF_EMPLOYEE_RATE = 0.08;
export const EPF_EMPLOYER_RATE = 0.12;
export const ETF_EMPLOYER_RATE = 0.03;

export function calculatePayrollLine(line: PayrollBatch["lines"][number]) {
  const epfEmployee = line.basic * EPF_EMPLOYEE_RATE;
  const epfEmployer = line.basic * EPF_EMPLOYER_RATE;
  const etfEmployer = line.basic * ETF_EMPLOYER_RATE;
  const netPay = line.basic + line.attendanceAdj + line.allowances - line.deductions - epfEmployee - line.advances;
  return { epfEmployee, epfEmployer, etfEmployer, netPay };
}

export async function getPayrollBatches() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("payroll_batches").select("*, payroll_lines(*, employees(*))").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapPayrollBatch(row));
}

export async function getPayrollBatch(id: string) {
  const supabase = createAdminClient();
  const numericId = await resolveId("payroll_batches", idSchema.parse(id), "batch_code");
  if (!numericId) return undefined;
  const { data, error } = await supabase.from("payroll_batches").select("*, payroll_lines(*, employees(*))").eq("id", numericId).single();
  if (error) throw new Error(error.message);
  return mapPayrollBatch(data);
}

export async function updatePayrollStatus(id: string, status: PayrollBatch["status"], role?: string, override = false, userId?: string) {
  const supabase = createAdminClient();
  const batch = await getPayrollBatch(id);
  if (!batch) throw new Error("Payroll batch not found.");
  if (batch.locked) throw new Error("Locked payroll cannot be edited.");
  const hasNegativeNet = batch.lines.some((line) => calculatePayrollLine(line).netPay < 0);
  if ((status === "processed" || status === "paid" || status === "locked") && hasNegativeNet && !(role === "super_admin" && override)) {
    throw new Error("Cannot close/process payroll batch with net pay below zero without super admin override.");
  }
  const numericId = await resolveId("payroll_batches", idSchema.parse(id), "batch_code");
  const patch = { status, locked_at: status === "locked" ? new Date().toISOString() : undefined };
  const { error } = await supabase.from("payroll_batches").update(patch).eq("id", numericId);
  if (error) throw new Error(error.message);
  await auditLog({ userId, action: "update", module: "payroll_batches", recordId: numericId, oldValues: { status: batch.status }, newValues: patch });
  return getPayrollBatch(id);
}

export async function getPayrollSummary() {
  const batches = await getPayrollBatches();
  return {
    pendingApprovals: batches.filter((batch) => batch.status === "prepared").length,
    currentMonthTotal: batches.reduce((sum, batch) => sum + batch.lines.reduce((lineSum, line) => lineSum + calculatePayrollLine(line).netPay, 0), 0),
  };
}
