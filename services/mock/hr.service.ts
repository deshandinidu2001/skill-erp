import {
  attendanceRecords,
  employees,
  payrollBatches,
  siteAssignments,
} from "@/services/mock/seed";
import { mockDelay } from "@/services/mock/utils";
import type { AttendanceRecord, Employee, PayrollBatch } from "@/types";

export const EPF_EMPLOYEE_RATE = 0.08;
export const EPF_EMPLOYER_RATE = 0.12;
export const ETF_EMPLOYER_RATE = 0.03;

export function calculatePayrollLine(line: PayrollBatch["lines"][number]) {
  const epfEmployee = line.basic * EPF_EMPLOYEE_RATE;
  const epfEmployer = line.basic * EPF_EMPLOYER_RATE;
  const etfEmployer = line.basic * ETF_EMPLOYER_RATE;
  const netPay =
    line.basic + line.attendanceAdj + line.allowances - line.deductions - epfEmployee - line.advances;
  return { epfEmployee, epfEmployer, etfEmployer, netPay };
}

export async function getEmployees(): Promise<Employee[]> {
  await mockDelay();
  return employees;
}

export async function getEmployeeById(id: string) {
  await mockDelay();
  const employee = employees.find((item) => item.id === id || item.code === id);
  if (!employee) return undefined;
  return {
    employee,
    assignments: siteAssignments.filter((item) => item.employeeId === employee.id),
    attendance: attendanceRecords.filter((item) => item.employeeId === employee.id),
    payrollLines: payrollBatches.flatMap((batch) =>
      batch.lines
        .filter((line) => line.employeeId === employee.id)
        .map((line) => ({ ...line, batchCode: batch.code, period: batch.period, status: batch.status })),
    ),
    timeline: [
      { actor: "HR", action: "hired employee", timestamp: `${employee.joiningDate ?? "2024-01-01"}T09:00:00`, summary: employee.position ?? employee.role },
      ...siteAssignments
        .filter((item) => item.employeeId === employee.id)
        .map((item) => ({ actor: "HR", action: "assigned site", timestamp: `${item.from}T09:00:00`, summary: item.site })),
    ],
  };
}

export async function createEmployee(input: Employee) {
  await mockDelay();
  if (!input.fullName && !input.name) throw new Error("Full name is required.");
  if (!input.nic) throw new Error("NIC is required.");
  if (employees.some((item) => item.nic === input.nic)) throw new Error("NIC must be unique.");
  if (!input.phone) throw new Error("Phone is required.");
  if (!input.department || !input.position) throw new Error("Department and position are required.");
  if (!input.basicSalary || input.basicSalary <= 0) throw new Error("Basic salary must be greater than zero.");
  employees.unshift(input);
  return input;
}

export async function assignEmployeeToSite(employeeId: string, site: string) {
  await mockDelay();
  const employee = employees.find((item) => item.id === employeeId);
  if (!employee) throw new Error("Employee not found.");
  if (employee.status !== "active") throw new Error("Cannot assign inactive employee to site.");
  const assignment = {
    id: `sa_${Date.now()}`,
    employeeId,
    employeeName: employee.name,
    site,
    from: new Date().toISOString().slice(0, 10),
    status: "active" as const,
  };
  siteAssignments.unshift(assignment);
  return assignment;
}

export async function getAttendance(site?: string, date?: string): Promise<AttendanceRecord[]> {
  await mockDelay();
  return attendanceRecords.filter((item) => (!site || item.site === site) && (!date || item.date === date));
}

export async function saveAttendance(rows: AttendanceRecord[], override = false) {
  await mockDelay();
  const twoDays = 1000 * 60 * 60 * 24 * 2;
  if (!override && rows.some((row) => Date.now() - new Date(row.date).getTime() > twoDays)) {
    throw new Error("Cannot edit attendance more than two days past without HR manager override.");
  }
  rows.forEach((row) => {
    const index = attendanceRecords.findIndex((item) => item.id === row.id);
    if (index >= 0) attendanceRecords[index] = row;
    else attendanceRecords.push(row);
  });
  return rows;
}

export async function getPayrollBatches() {
  await mockDelay();
  return payrollBatches;
}

export async function getPayrollBatch(id: string) {
  await mockDelay();
  return payrollBatches.find((item) => item.id === id || item.code === id);
}

export async function updatePayrollStatus(id: string, status: PayrollBatch["status"], role?: string, override = false) {
  await mockDelay();
  const batch = payrollBatches.find((item) => item.id === id || item.code === id);
  if (!batch) throw new Error("Payroll batch not found.");
  if (batch.locked) throw new Error("Locked payroll cannot be edited.");
  const hasNegativeNet = batch.lines.some((line) => calculatePayrollLine(line).netPay < 0);
  if ((status === "processed" || status === "paid" || status === "locked") && hasNegativeNet && !(role === "super_admin" && override)) {
    throw new Error("Cannot close/process payroll batch with net pay below zero without super admin override.");
  }
  batch.status = status;
  if (status === "locked") batch.locked = true;
  return batch;
}

export async function getAttendanceSummary() {
  await mockDelay();
  return { present: 42, absent: 3, late: 5 };
}

export async function getPayrollSummary() {
  await mockDelay();
  return { pendingApprovals: 2, currentMonthTotal: 8750000 };
}
