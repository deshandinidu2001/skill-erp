import { apiGet, apiPatch, apiPost } from "@/services/api/client/http";
import type { AttendanceRecord, Employee, PayrollBatch } from "@/types";

export type EmployeeDetail = {
  employee: Employee;
  assignments: Array<Record<string, any>>;
  attendance: Array<Record<string, any>>;
  payrollLines: Array<Record<string, any>>;
  timeline: Array<{ actor: string; action: string; timestamp: string; summary: string }>;
};

export const EPF_EMPLOYEE_RATE = 0.08;
export const EPF_EMPLOYER_RATE = 0.12;
export const ETF_EMPLOYER_RATE = 0.03;

export function calculatePayrollLine(line: PayrollBatch["lines"][number] | Record<string, any>) {
  const epfEmployee = line.basic * EPF_EMPLOYEE_RATE;
  const epfEmployer = line.basic * EPF_EMPLOYER_RATE;
  const etfEmployer = line.basic * ETF_EMPLOYER_RATE;
  const netPay = line.basic + line.attendanceAdj + line.allowances - line.deductions - epfEmployee - line.advances;
  return { epfEmployee, epfEmployer, etfEmployer, netPay };
}

export function getEmployees(): Promise<Employee[]> {
  return apiGet("/api/employees");
}

export function getEmployeeById(id: string) {
  return apiGet<EmployeeDetail | undefined>(`/api/employees/${id}`);
}

export function createEmployee(input: Employee) {
  return apiPost("/api/employees", input);
}

export function assignEmployeeToSite(employeeId: string, site: string) {
  return apiPost("/api/users", { action: "assign_site", employeeId, site });
}

export function getAttendance(site?: string, date?: string): Promise<AttendanceRecord[]> {
  const params = new URLSearchParams();
  if (site) params.set("site", site);
  if (date) params.set("date", date);
  return apiGet(`/api/attendance?${params}`);
}

export function saveAttendance(rows: AttendanceRecord[], override = false) {
  return apiPost("/api/attendance", { rows, override });
}

export function getPayrollBatches(): Promise<PayrollBatch[]> {
  return apiGet("/api/payroll");
}

export function getPayrollBatch(id: string): Promise<PayrollBatch | undefined> {
  return apiGet(`/api/payroll/${id}`);
}

export function updatePayrollStatus(id: string, status: PayrollBatch["status"], role?: string, override = false) {
  return apiPatch(`/api/payroll/${id}`, { status, role, override });
}

export function getAttendanceSummary() {
  return apiGet("/api/attendance?summary=1");
}

export function getPayrollSummary() {
  return apiGet("/api/payroll?summary=1");
}
