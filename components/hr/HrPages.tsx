"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Lock, Plus, Printer } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ActivityTimeline } from "@/components/shared/ActivityTimeline";
import { DataTable } from "@/components/tables/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { StatCard } from "@/components/cards/StatCard";
import { FormField } from "@/components/forms/FormField";
import { FormSection } from "@/components/forms/FormSection";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatCurrency } from "@/lib/utils";
import {
  calculatePayrollLine,
  getAttendance,
  getEmployeeById,
  getEmployees,
  getPayrollBatch,
  getPayrollBatches,
  saveAttendance,
  updatePayrollStatus,
} from "@/services/api/client/hr.service";
import type { AttendanceRecord, Employee, PayrollBatch } from "@/types";

export function EmployeeListPage() {
  const { role } = useCurrentUser();
  const { data = [], isLoading } = useQuery({ queryKey: ["employees"], queryFn: getEmployees });
  const [filters, setFilters] = useState({ department: "", position: "", site: "", salaryType: "", status: "" });
  const rows = useMemo(
    () =>
      data.filter(
        (row) =>
          (!filters.department || row.department === filters.department) &&
          (!filters.position || row.position === filters.position) &&
          (!filters.site || row.currentSite === filters.site) &&
          (!filters.salaryType || row.salaryType === filters.salaryType) &&
          (!filters.status || row.status === filters.status),
      ),
    [data, filters],
  );
  const columns: ColumnDef<Employee>[] = [
    { accessorKey: "code", header: "Code", cell: ({ row }) => <Link className="font-semibold text-cyan-800" href={`/hr/employees/${row.original.id}`}>{row.original.code}</Link> },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "department", header: "Department" },
    { accessorKey: "position", header: "Position" },
    { accessorKey: "currentSite", header: "Current Site" },
    { accessorKey: "salaryType", header: "Salary Type" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  ];
  const canCreate = role === "hr_executive" || role === "hr_manager" || role === "super_admin";
  return (
    <div className="grid gap-6">
      <PageHeader title="Employees" description="Employee master, site assignment, attendance, and payroll history." actions={canCreate ? <Link href="/hr/employees/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-3 text-sm font-semibold text-white"><Plus className="h-4 w-4" />New Employee</Link> : null} />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Active" value={data.filter((e) => e.status === "active").length} />
        <StatCard title="On Site" value={data.filter((e) => e.currentSite && e.currentSite !== "Head Office" && e.status === "active").length} />
        <StatCard title="On Leave" value="1" />
        <StatCard title="New This Month" value={data.filter((e) => e.joiningDate?.startsWith("2026-06")).length} />
      </div>
      <FilterGrid filters={filters} setFilters={setFilters} employees={data} />
      <DataTable columns={columns} data={rows} loading={isLoading} enableExport />
    </div>
  );
}

const employeeSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  nic: z.string().min(4, "NIC is required"),
  phone: z.string().min(3, "Phone is required"),
  email: z.preprocess((val) => val === "" ? undefined : val, z.string().email("Enter a valid email").optional()),
  address: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  position: z.string().min(1, "Position is required"),
  workRole: z.string().optional(),
  joiningDate: z.string().optional(),
  salaryType: z.enum(["monthly", "daily", "hourly"]),
  basicSalary: z.coerce.number().min(1, "Basic salary must be greater than zero"),
});

export function EmployeeFormPage() {
  const { role } = useCurrentUser();
  const salaryVisible = role === "hr_manager" || role === "super_admin";
  const { register, handleSubmit, formState: { errors } } = useForm<z.input<typeof employeeSchema>, unknown, z.output<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { salaryType: "monthly", department: "Projects" },
  });
  const [toast, setToast] = useState<string | null>(null);
  return (
    <div className="grid gap-6">
      {toast ? <div className="rounded-md border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-800">{toast}</div> : null}
      <PageHeader title="New Employee" description="Create employee personal, job, salary, and document records." />
      <form onSubmit={handleSubmit((values) => setToast(`Validated employee ${values.fullName}.`))} className="grid gap-5">
        <FormSection title="Personal Info"><div className="grid gap-4 md:grid-cols-2"><FormField label="Full name" error={errors.fullName?.message} {...register("fullName")} /><FormField label="NIC" error={errors.nic?.message} {...register("nic")} /><FormField label="Phone" error={errors.phone?.message} {...register("phone")} /><FormField label="Email" error={errors.email?.message} {...register("email")} /><FormField label="Address" error={errors.address?.message} {...register("address")} /></div></FormSection>
        <FormSection title="Job Info"><div className="grid gap-4 md:grid-cols-2"><FormField label="Department" error={errors.department?.message} {...register("department")} /><FormField label="Position" error={errors.position?.message} {...register("position")} /><FormField label="Work role" error={errors.workRole?.message} {...register("workRole")} /><FormField label="Joining date" type="date" error={errors.joiningDate?.message} {...register("joiningDate")} /></div></FormSection>
        {salaryVisible ? <FormSection title="Salary Info"><div className="grid gap-4 md:grid-cols-3"><label className="grid gap-1.5"><span className="text-sm font-medium text-slate-700">Salary type</span><select {...register("salaryType")} className="h-10 rounded-md border border-slate-300 px-3 text-sm"><option value="monthly">monthly</option><option value="daily">daily</option><option value="hourly">hourly</option></select></label><FormField label="Basic salary" type="number" error={errors.basicSalary?.message} {...register("basicSalary")} /><FormField label="Allowances" placeholder="Transport:25000" /><FormField label="Deductions" placeholder="Loan:5000" /></div></FormSection> : null}
        <FormSection title="Documents"><input type="file" multiple className="text-sm" /><p className="text-sm text-slate-500">Upload NIC copy, contract, and other documents.</p></FormSection>
        <button className="h-10 w-fit rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white">Save Employee</button>
      </form>
    </div>
  );
}

export function EmployeeProfilePage({ id }: { id: string }) {
  const { role } = useCurrentUser();
  const salaryVisible = role === "hr_manager" || role === "super_admin";
  const [tab, setTab] = useState("Personal");
  const { data } = useQuery({ queryKey: ["employee", id], queryFn: () => getEmployeeById(id) });
  if (!data) return <EmptyState title="Employee not found" description="The employee profile could not be loaded." />;
  const { employee } = data;
  return (
    <div className="grid gap-6">
      <PageHeader title={`${employee.name} - ${employee.code}`} description={`${employee.department} / ${employee.position}`} />
      <StatusBadge status={employee.status} />
      <Tabs tabs={["Personal", "Job", "Site Assignments", "Attendance", "Payroll", "Timeline"]} active={tab} setActive={setTab} />
      {tab === "Personal" ? <Info rows={[["NIC", employee.nic ?? "-"], ["Phone", employee.phone ?? "-"], ["Email", employee.email ?? "-"], ["Address", employee.address ?? "-"], ["Documents", "NIC copy, contract"]]} /> : null}
      {tab === "Job" ? <Info rows={[["Department", employee.department], ["Position", employee.position ?? "-"], ["Role", employee.workRole ?? employee.role], ["Joining Date", employee.joiningDate ?? "-"], ...(salaryVisible ? [["Salary", `${employee.salaryType} / ${formatCurrency(employee.basicSalary ?? 0)}`]] : [])]} /> : null}
      {tab === "Site Assignments" ? <SimpleTable rows={data.assignments.map((a) => [a.site, a.from, a.to ?? "-", a.status])} headers={["Site", "From", "To", "Status"]} action="Assign to Site" /> : null}
      {tab === "Attendance" ? <SimpleTable rows={data.attendance.map((a) => [a.date, a.site, a.status])} headers={["Date", "Site", "Status"]} /> : null}
      {tab === "Payroll" ? <SimpleTable rows={data.payrollLines.map((p) => [p.batchCode, p.period, formatCurrency(calculatePayrollLine(p).netPay), p.status, "Payslip"])} headers={["Batch", "Period", "Net Pay", "Status", "Download"]} /> : null}
      {tab === "Timeline" ? <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"><ActivityTimeline items={data.timeline} /></section> : null}
    </div>
  );
}

export function AttendancePage() {
  const { role } = useCurrentUser();
  const [site, setSite] = useState("Colombo 02");
  const [date, setDate] = useState("2026-06-04");
  const { data = [] } = useQuery({ queryKey: ["attendance", site, date], queryFn: () => getAttendance(site, date) });
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const mutation = useMutation({ mutationFn: () => saveAttendance(rows.length ? rows : data, role === "hr_manager" || role === "super_admin") });
  const visibleRows = rows.length ? rows : data;
  return (
    <div className="grid gap-6">
      <PageHeader title="Attendance" description="Bulk attendance by site and date." actions={role === "hr_manager" || role === "super_admin" ? <button className="h-10 rounded-md border border-slate-300 px-3 text-sm font-semibold">Export CSV</button> : null} />
      <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-2"><Input label="Site" value={site} onChange={setSite} /><Input label="Date" type="date" value={date} onChange={setDate} /></div>
      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        {visibleRows.map((row) => <div key={row.id} className="grid gap-3 border-b border-slate-100 py-3 md:grid-cols-[1fr_220px]"><span className="text-sm font-medium">{row.employeeName}</span><select value={row.status} onChange={(event) => setRows(visibleRows.map((item) => item.id === row.id ? { ...item, status: event.target.value as AttendanceRecord["status"] } : item))} className="h-10 rounded-md border border-slate-300 px-2 text-sm"><option value="present">Present</option><option value="absent">Absent</option><option value="leave">Leave</option><option value="unpaid">Unpaid</option></select></div>)}
        <button onClick={() => mutation.mutate()} className="mt-4 h-10 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white">Save Attendance</button>
      </section>
    </div>
  );
}

export function PayrollListPage() {
  const { role } = useCurrentUser();
  const { data = [], isLoading } = useQuery({ queryKey: ["payroll-batches"], queryFn: getPayrollBatches });
  const [status, setStatus] = useState("");
  const columns: ColumnDef<PayrollBatch>[] = [
    { accessorKey: "code", header: "Batch Code", cell: ({ row }) => <Link className="font-semibold text-cyan-800" href={`/hr/payroll/${row.original.id}`}>{row.original.code}</Link> },
    { accessorKey: "period", header: "Period" },
    { accessorKey: "site", header: "Site" },
    { id: "count", header: "Employee Count", cell: ({ row }) => row.original.lines.length },
    { id: "gross", header: "Total Gross", cell: ({ row }) => formatCurrency(row.original.lines.reduce((s, l) => s + l.basic + l.allowances, 0)) },
    { id: "net", header: "Total Net", cell: ({ row }) => formatCurrency(row.original.lines.reduce((s, l) => s + calculatePayrollLine(l).netPay, 0)) },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  ];
  return <div className="grid gap-6"><PageHeader title="Payroll" description="Payroll batches, EPF/ETF calculations, approvals and locking." actions={role !== "viewer" ? <button className="h-10 rounded-md bg-cyan-700 px-3 text-sm font-semibold text-white">Prepare Payroll</button> : null} /><Select label="Status" value={status} options={["", ...Array.from(new Set(data.map((b) => b.status)))]} onChange={setStatus} /><DataTable columns={columns} data={status ? data.filter((b) => b.status === status) : data} loading={isLoading} /></div>;
}

export function PayrollDetailPage({ id }: { id: string }) {
  const { role } = useCurrentUser();
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["payroll", id], queryFn: () => getPayrollBatch(id) });
  const mutation = useMutation({ mutationFn: (status: PayrollBatch["status"]) => updatePayrollStatus(id, status, role, role === "super_admin"), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payroll", id] }) });
  if (!data) return <EmptyState title="Payroll not found" description="The payroll batch could not be loaded." />;
  const locked = data.locked || data.status === "locked";
  const columns: ColumnDef<PayrollBatch["lines"][number]>[] = [
    { accessorKey: "employeeName", header: "Employee" },
    { accessorKey: "basic", header: "Basic", cell: ({ row }) => formatCurrency(row.original.basic) },
    { accessorKey: "attendanceAdj", header: "Attendance Adj", cell: ({ row }) => formatCurrency(row.original.attendanceAdj) },
    { accessorKey: "allowances", header: "Allowances", cell: ({ row }) => formatCurrency(row.original.allowances) },
    { accessorKey: "deductions", header: "Deductions", cell: ({ row }) => formatCurrency(row.original.deductions) },
    { id: "epf", header: "EPF (8%)", cell: ({ row }) => formatCurrency(calculatePayrollLine(row.original).epfEmployee) },
    { id: "etf", header: "ETF (3%)", cell: ({ row }) => formatCurrency(calculatePayrollLine(row.original).etfEmployer) },
    { accessorKey: "advances", header: "Advances", cell: ({ row }) => formatCurrency(row.original.advances) },
    { id: "net", header: "Net Pay", cell: ({ row }) => <span className={calculatePayrollLine(row.original).netPay < 0 ? "font-semibold text-red-700" : ""}>{formatCurrency(calculatePayrollLine(row.original).netPay)}</span> },
    { accessorKey: "mode", header: "Mode" },
  ];
  return (
    <div className="grid gap-6">
      <PageHeader title={data.code} description={`${data.period} / ${data.site}`} actions={<div className="flex flex-wrap gap-2">{locked ? <span title="Locked payroll cannot be edited" className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-100 px-3 text-sm font-semibold text-slate-500"><Lock className="h-4 w-4" />Locked</span> : null}{!locked && role === "hr_executive" ? <button className="h-10 rounded-md border border-slate-300 px-3 text-sm font-semibold">Edit lines</button> : null}{(role === "hr_manager" || role === "super_admin") && !locked ? ["approved", "processed", "paid", "locked"].map((s) => <button key={s} onClick={() => mutation.mutate(s as PayrollBatch["status"])} className="h-10 rounded-md border border-slate-300 px-3 text-sm font-semibold">{s}</button>) : null}<button className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold"><Printer className="h-4 w-4" />Preview Payslip</button></div>} />
      <StatusBadge status={data.status} />
      <DataTable columns={columns} data={data.lines} />
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm print:shadow-none"><h2 className="font-semibold">Payslip Preview</h2>{data.lines.map((line) => <div key={line.id} className="mt-4 rounded-md bg-slate-50 p-4 text-sm"><strong>{line.employeeName}</strong><p>Basic {formatCurrency(line.basic)} / EPF employee {formatCurrency(calculatePayrollLine(line).epfEmployee)} / EPF employer {formatCurrency(calculatePayrollLine(line).epfEmployer)} / ETF {formatCurrency(calculatePayrollLine(line).etfEmployer)} / Net {formatCurrency(calculatePayrollLine(line).netPay)}</p></div>)}</section>
    </div>
  );
}

type EmployeeFilters = { department: string; position: string; site: string; salaryType: string; status: string };

function FilterGrid({ filters, setFilters, employees }: { filters: EmployeeFilters; setFilters: Dispatch<SetStateAction<EmployeeFilters>>; employees: Employee[] }) {
  return <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-5">{(["department", "position", "site", "salaryType", "status"] as const).map((key) => <Select key={key} label={key} value={filters[key]} options={["", ...Array.from(new Set(employees.map((e) => String(key === "site" ? e.currentSite ?? "" : e[key] ?? "")).filter(Boolean)))]} onChange={(value) => setFilters((prev) => ({ ...prev, [key]: value }))} />)}</div>;
}

function Tabs({ tabs, active, setActive }: { tabs: string[]; active: string; setActive: (value: string) => void }) {
  return <div className="flex flex-wrap gap-2 border-b border-slate-200">{tabs.map((tab) => <button key={tab} onClick={() => setActive(tab)} className={`border-b-2 px-3 py-2 text-sm font-semibold ${active === tab ? "border-cyan-700 text-cyan-800" : "border-transparent text-slate-500"}`}>{tab}</button>)}</div>;
}

function Info({ rows }: { rows: string[][] }) {
  return <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"><dl className="grid gap-4 md:grid-cols-2">{rows.map(([label, value]) => <div key={label}><dt className="text-xs font-medium uppercase text-slate-500">{label}</dt><dd className="mt-1 text-sm text-slate-800">{value}</dd></div>)}</dl></section>;
}

function SimpleTable({ headers, rows, action }: { headers: string[]; rows: string[][]; action?: string }) {
  return <section className="grid gap-3">{action ? <button className="w-fit rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">{action}</button> : null}<div className="rounded-md border border-slate-200 bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-slate-50">{headers.map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</thead><tbody>{rows.map((r, i) => <tr key={i} className="border-t border-slate-100">{r.map((c, j) => <td key={j} className="px-3 py-2">{c}</td>)}</tr>)}</tbody></table></div></section>;
}

function Select({ label, value, options, onChange }: { label: string; value?: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="grid gap-1 text-xs font-medium uppercase text-slate-500">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-slate-300 px-2 text-sm normal-case text-slate-700">{options.map((item) => <option key={item || "all"} value={item}>{item || "All"}</option>)}</select></label>;
}

function Input({ label, value, type = "text", onChange }: { label: string; value: string; type?: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1 text-xs font-medium uppercase text-slate-500">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-slate-300 px-2 text-sm normal-case text-slate-700" /></label>;
}
