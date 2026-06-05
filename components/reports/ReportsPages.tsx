"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/tables/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/cards/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatCurrency } from "@/lib/utils";
import { calculatePayrollLine } from "@/services/api/client/hr.service";
import { getReportsSummary } from "@/services/api/client/reports.service";

const Chart = dynamic(() => import("@/components/reports/SimpleCharts").then((m) => m.SimpleChart), {
  ssr: false,
  loading: () => <div className="h-72 rounded-md bg-slate-100" />,
});

type Row = Record<string, string | number>;

type ReportsData = {
  leads: any[];
  quotations: any[];
  projects: any[];
  finance: { payments: any[]; expenses: any[] };
  employees: any[];
  payrollBatches: any[];
  attendanceRecords: any[];
  stockItems: any[];
  stockRequests: any[];
  suppliers: any[];
  purchaseOrders: any[];
  vehicles: any[];
  debtorAgingRows: any[];
  maintenanceLogs: any[];
  fuelLogs: any[];
};

const emptyReportData: ReportsData = {
  leads: [],
  quotations: [],
  projects: [],
  finance: { payments: [], expenses: [] },
  employees: [],
  payrollBatches: [],
  attendanceRecords: [],
  stockItems: [],
  stockRequests: [],
  suppliers: [],
  purchaseOrders: [],
  vehicles: [],
  debtorAgingRows: [],
  maintenanceLogs: [],
  fuelLogs: [],
};

function useReportsData() {
  const { data = emptyReportData } = useQuery({ queryKey: ["reports-summary"], queryFn: getReportsSummary });
  return data as ReportsData;
}

const genericColumns: ColumnDef<Row>[] = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
].map((key) => ({
  accessorKey: key,
  header: key.toUpperCase(),
}));

export function ReportsIndexPage() {
  const reports = [
    ["Lead Pipeline", "/reports/leads"],
    ["Quotation Conversion", "/reports/quotations"],
    ["Project Summary", "/reports/projects"],
    ["Employee Payroll", "/reports/payroll"],
    ["Attendance Summary", "/reports/attendance"],
    ["Stock Movement", "/reports/stock"],
    ["Supplier Performance", "/reports/suppliers"],
    ["Vehicle Maintenance", "/reports/vehicles"],
    ["Project P&L", "/reports/project-pnl"],
    ["Debtor Aging", "/reports/debtors"],
  ];
  return (
    <div className="grid gap-6">
      <PageHeader title="Reports" description="Operational and financial reports across Skill Engineering ERP." />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {reports.map(([title, href]) => (
          <Link key={href} href={href} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm hover:border-cyan-300">
            <h2 className="font-semibold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">Open report</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function LeadPipelineReport() {
  const { leads } = useReportsData();
  const rows = leads.map((lead) => ({
    a: lead.code,
    b: lead.customerName,
    c: lead.status,
    d: lead.owner,
    e: lead.createdAt,
    f: lead.status === "closed" || lead.status === "approved" ? lead.updatedAt : "-",
    g: lead.value,
  }));
  const approved = leads.filter((lead) => lead.status === "approved" || lead.status === "closed");
  return (
    <ReportShell
      title="Lead Pipeline Report"
      description="Lead movement by owner, type, status, and approved value."
      filters={["Date range", "Owner", "Project type"]}
      kpis={[
        ["Total Leads", leads.length],
        ["Conversion Rate", `${Math.round((approved.length / leads.length) * 100)}%`],
        ["Avg Days to Close", "18"],
        ["Revenue from Approved Leads", formatCurrency(approved.reduce((sum, lead) => sum + lead.value, 0))],
      ]}
      chartData={statusCounts(leads.map((lead) => lead.status))}
      secondaryChartData={leads.map((lead, index) => ({ name: lead.createdAt, value: index + 1 }))}
      rows={rows}
    />
  );
}

export function QuotationConversionReport() {
  const { quotations } = useReportsData();
  const sent = quotations.filter((q) => q.sentDate);
  const approved = quotations.filter((q) => q.status === "approved");
  const revised = quotations.filter((q) => q.status === "revision_requested" || q.clientResponses.some((r: any) => r.decision === "revision_requested"));
  return (
    <ReportShell
      title="Quotation Conversion Report"
      description="Quotation funnel and customer decision cycle."
      filters={["Date range", "QS engineer", "Project type"]}
      kpis={[
        ["Quotations Sent", sent.length],
        ["Approval Rate", `${Math.round((approved.length / Math.max(1, sent.length)) * 100)}%`],
        ["Avg Value", formatCurrency(quotations.reduce((s, q) => s + q.grandTotal, 0) / quotations.length)],
        ["Revision Rate", `${Math.round((revised.length / quotations.length) * 100)}%`],
      ]}
      chartData={[
        { name: "Sent", value: sent.length },
        { name: "Approved", value: approved.length },
        { name: "Rejected", value: quotations.filter((q) => q.status === "rejected").length },
        { name: "Revised", value: revised.length },
      ]}
      rows={quotations.map((q) => ({ a: q.code, b: `v${q.version}`, c: q.customerName, d: q.grandTotal, e: q.status, f: q.sentDate ? 7 : "-" }))}
    />
  );
}

export function ProjectSummaryReport() {
  const { projects, finance } = useReportsData();
  const projectExpenses = finance.expenses;
  const actualByProject = new Map(projectExpenses.map((expense) => [expense.project_id, 0]));
  projectExpenses.forEach((expense) => actualByProject.set(expense.project_id, (actualByProject.get(expense.project_id) ?? 0) + expense.amount));
  return (
    <ReportShell
      title="Project Summary Report"
      description="Budget, actual spend, progress and project status."
      filters={["Status", "Site", "Manager", "Date range"]}
      kpis={[
        ["Active Projects", projects.filter((p) => ["created", "assigned", "in_progress", "ongoing"].includes(p.status)).length],
        ["Total Budget", formatCurrency(projects.reduce((s, p) => s + p.budget, 0))],
        ["Total Actual Spend", formatCurrency(projectExpenses.reduce((s, e) => s + e.amount, 0))],
        ["Avg Progress %", `${Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length)}%`],
      ]}
      chartData={statusCounts(projects.map((project) => project.status))}
      secondaryChartData={projects.map((project) => ({ name: project.code, value: actualByProject.get(project.project_id) ?? 0, value2: project.budget }))}
      rows={projects.map((project) => {
        const actual = actualByProject.get(project.project_id) ?? 0;
        return { a: project.code, b: project.name, c: project.customer, d: project.budget, e: actual, f: project.budget - actual, g: project.progress, h: project.status };
      })}
    />
  );
}

export function PayrollReport() {
  const { employees, payrollBatches } = useReportsData();
  const { role } = useCurrentUser();
  if (!["hr_manager", "finance_manager", "super_admin"].includes(role ?? "")) {
    return <EmptyState title="Access denied" description="Payroll reports are visible to HR Manager, Finance Manager, and Super Admin only." />;
  }
  const lines = payrollBatches.flatMap((batch) => batch.lines.map((line: any) => ({ batch, line })));
  const gross = lines.reduce((sum, item) => sum + item.line.basic + item.line.allowances, 0);
  const net = lines.reduce((sum, item) => sum + calculatePayrollLine(item.line).netPay, 0);
  const epfEtf = lines.reduce((sum, item) => {
    const calc = calculatePayrollLine(item.line);
    return sum + calc.epfEmployee + calc.epfEmployer + calc.etfEmployer;
  }, 0);
  return (
    <ReportShell
      title="Employee Payroll Report"
      description="Payroll gross, net, EPF and ETF by employee."
      filters={["Period", "Department", "Site"]}
      kpis={[["Total Employees", lines.length], ["Total Gross", formatCurrency(gross)], ["Total Net", formatCurrency(net)], ["Total EPF/ETF", formatCurrency(epfEtf)]]}
      chartData={payrollBatches.map((b) => ({ name: b.period, value: b.lines.reduce((s: number, l: any) => s + calculatePayrollLine(l).netPay, 0) }))}
      rows={lines.map(({ batch, line }) => {
        const employee = employees.find((e) => e.id === line.employeeId);
        const calc = calculatePayrollLine(line);
        return { a: line.employeeName, b: employee?.department ?? "-", c: batch.site, d: line.basic + line.allowances, e: line.deductions, f: calc.netPay, g: calc.epfEmployee };
      })}
    />
  );
}

export function AttendanceSummaryReport() {
  const { employees, attendanceRecords } = useReportsData();
  const grouped = employees.map((employee) => {
    const records = attendanceRecords.filter((row) => row.employeeId === employee.id);
    const present = records.filter((r) => r.status === "present").length;
    const absent = records.filter((r) => r.status === "absent").length;
    const leave = records.filter((r) => r.status === "leave").length;
    const unpaid = records.filter((r) => r.status === "unpaid").length;
    return { employee, present, absent, leave, unpaid, rate: records.length ? Math.round((present / records.length) * 100) : 0 };
  });
  const total = attendanceRecords.length || 1;
  return (
    <ReportShell
      title="Attendance Summary Report"
      description="Attendance by site, department, employee and day."
      filters={["Period", "Site", "Department"]}
      kpis={[
        ["Present Rate %", `${Math.round((attendanceRecords.filter((r) => r.status === "present").length / total) * 100)}%`],
        ["Absent Rate %", `${Math.round((attendanceRecords.filter((r) => r.status === "absent").length / total) * 100)}%`],
        ["Leave Count", attendanceRecords.filter((r) => r.status === "leave").length],
        ["Unpaid Count", attendanceRecords.filter((r) => r.status === "unpaid").length],
      ]}
      chartData={statusCounts(attendanceRecords.map((r) => r.site))}
      secondaryChartData={attendanceRecords.map((r) => ({ name: r.date, value: r.status === "present" ? 1 : 0 }))}
      rows={grouped.map((row) => ({ a: row.employee.name, b: row.present, c: row.absent, d: row.leave, e: row.unpaid, f: `${row.rate}%` }))}
    />
  );
}

export function StockMovementReport() {
  const { stockRequests, purchaseOrders, stockItems } = useReportsData();
  return (
    <ReportShell
      title="Stock Movement Report"
      description="Requests, POs, receipts and pending deliveries by item and site."
      filters={["Date range", "Site", "Item", "Category"]}
      kpis={[
        ["Total Requests", stockRequests.length],
        ["Total PO Value", formatCurrency(purchaseOrders.reduce((s, p) => s + p.grandTotal, 0))],
        ["Items Received", purchaseOrders.reduce((s, p) => s + p.lines.reduce((x: number, l: any) => x + l.receivedQuantity, 0), 0)],
        ["Pending Deliveries", purchaseOrders.filter((p) => p.status !== "completed").length],
      ]}
      chartData={purchaseOrders.map((po) => ({ name: po.issueDate.slice(0, 7), value: po.grandTotal }))}
      secondaryChartData={stockItems.slice(0, 10).map((item) => ({ name: item.name, value: stockRequests.flatMap((r) => r.lines).filter((l: any) => l.itemId === item.id).reduce((s: number, l: any) => s + l.quantity, 0) }))}
      rows={stockRequests.flatMap((request) => request.lines.map((line: any) => ({ a: line.itemName, b: request.site, c: "request", d: line.quantity, e: request.requestDate, f: request.code })))}
    />
  );
}

export function SupplierPerformanceReport() {
  const { suppliers, purchaseOrders } = useReportsData();
  const totalPo = purchaseOrders.reduce((s, p) => s + p.grandTotal, 0);
  return (
    <ReportShell
      title="Supplier Performance Report"
      description="Supplier ratings, delivery performance and PO value."
      filters={["Category", "Status"]}
      kpis={[["Total Suppliers", suppliers.length], ["On-Time Delivery %", `${Math.round(suppliers.reduce((s, p) => s + p.onTimePercent, 0) / suppliers.length)}%`], ["Avg Rating", (suppliers.reduce((s, p) => s + p.rating, 0) / suppliers.length).toFixed(1)], ["Total PO Value", formatCurrency(totalPo)]]}
      chartData={suppliers.map((s) => ({ name: s.name, value: s.rating }))}
      secondaryChartData={suppliers.map((s) => ({ name: s.name, value: s.onTimePercent, value2: 100 - s.onTimePercent }))}
      rows={suppliers.map((supplier) => ({ a: supplier.name, b: supplier.orderHistory.length, c: `${supplier.onTimePercent}%`, d: `${100 - supplier.onTimePercent}%`, e: supplier.rating, f: purchaseOrders.filter((po) => po.supplierId === supplier.id).reduce((s, p) => s + p.grandTotal, 0) }))}
    />
  );
}

export function VehicleMaintenanceReport() {
  const { vehicles, maintenanceLogs, fuelLogs } = useReportsData();
  return (
    <ReportShell
      title="Vehicle Maintenance Report"
      description="Maintenance cost, service due and fuel support data."
      filters={["Date range", "Vehicle", "Category"]}
      kpis={[["Total Maintenance Events", maintenanceLogs.length], ["Total Cost", formatCurrency(maintenanceLogs.reduce((s, m) => s + m.cost, 0))], ["Vehicles Due for Service", maintenanceLogs.filter((m) => new Date(m.nextDue) <= new Date("2026-08-01")).length], ["Fuel Logs", fuelLogs.length]]}
      chartData={vehicles.map((v) => ({ name: v.registrationNo, value: maintenanceLogs.filter((m) => m.vehicleId === v.id).reduce((s, m) => s + m.cost, 0) }))}
      secondaryChartData={maintenanceLogs.map((m) => ({ name: m.date.slice(0, 7), value: 1 }))}
      rows={maintenanceLogs.map((m) => ({ a: vehicles.find((v) => v.id === m.vehicleId)?.registrationNo ?? m.vehicleId, b: m.date, c: m.type, d: m.description, e: m.cost, f: m.nextDue }))}
    />
  );
}

export function ProjectPnlReport() {
  const { finance } = useReportsData();
  const clientPayments = finance.payments;
  const projectExpenses = finance.expenses;
  const { role } = useCurrentUser();
  if (!["accountant", "finance_manager", "super_admin"].includes(role ?? "")) {
    return <EmptyState title="Access denied" description="Project P&L is visible to Accountant, Finance Manager, and Super Admin only." />;
  }
  const income = clientPayments.reduce((s, p) => s + p.amount, 0);
  const expense = projectExpenses.reduce((s, e) => s + e.amount, 0);
  return (
    <ReportShell
      title="Project P&L Report"
      description="Project income, expenses, gross profit and margin."
      filters={["Project", "Date range"]}
      kpis={[["Total Income", formatCurrency(income)], ["Total Expenses", formatCurrency(expense)], ["Gross Profit", formatCurrency(income - expense)], ["Profit Margin %", `${Math.round(((income - expense) / Math.max(1, income)) * 100)}%`]]}
      chartData={[{ name: "Income", value: income }, { name: "Expenses", value: expense }]}
      rows={["material", "labour", "transport", "misc"].map((category) => {
        const categoryExpense = projectExpenses.filter((e) => e.category === category).reduce((s, e) => s + e.amount, 0);
        return { a: category, b: category === "material" ? income : 0, c: categoryExpense, d: (category === "material" ? income : 0) - categoryExpense };
      })}
    />
  );
}

export function DebtorAgingReport() {
  const { debtorAgingRows } = useReportsData();
  return (
    <ReportShell
      title="Debtor Aging Report"
      description="Outstanding client balances by aging bucket."
      filters={["Customer", "Project", "Date range"]}
      kpis={[
        ["Current", debtorAgingRows.filter((r) => r.overdueDays <= 0).length],
        ["30 days", debtorAgingRows.filter((r) => r.overdueDays > 0 && r.overdueDays <= 30).length],
        ["60 days", debtorAgingRows.filter((r) => r.overdueDays > 30 && r.overdueDays <= 60).length],
        ["90+ days", debtorAgingRows.filter((r) => r.overdueDays > 90).length],
      ]}
      chartData={debtorAgingRows.map((row) => ({ name: row.customer, value: row.outstanding }))}
      rows={debtorAgingRows.map((row) => ({ a: row.project, b: row.customer, c: row.milestone, d: row.dueDate, e: row.dueAmount, f: row.paid, g: row.outstanding, h: row.overdueDays }))}
    />
  );
}

function ReportShell({
  title,
  description,
  filters,
  kpis,
  chartData,
  secondaryChartData,
  rows,
}: {
  title: string;
  description: string;
  filters: string[];
  kpis: Array<[string, string | number]>;
  chartData: Array<{ name: string; value: number; value2?: number }>;
  secondaryChartData?: Array<{ name: string; value: number; value2?: number }>;
  rows: Row[];
}) {
  const [open, setOpen] = useState(true);
  const { role } = useCurrentUser();
  const canExport = role !== "viewer" && role !== "client_user";
  const columns = useMemo(() => genericColumns.slice(0, Math.max(1, Object.keys(rows[0] ?? {}).length)), [rows]);
  return (
    <div className="grid gap-6">
      <PageHeader
        title={title}
        description={description}
        actions={canExport ? <button className="h-10 rounded-md border border-slate-300 px-3 text-sm font-semibold">Export CSV</button> : null}
      />
      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <button className="text-sm font-semibold text-cyan-800" onClick={() => setOpen((value) => !value)}>
          {open ? "Hide" : "Show"} filters
        </button>
        {open ? <div className="mt-4 grid gap-3 md:grid-cols-4">{filters.map((filter) => <input key={filter} placeholder={filter} className="h-10 rounded-md border border-slate-300 px-3 text-sm" />)}</div> : null}
      </section>
      <div className="grid gap-4 md:grid-cols-4">{kpis.map(([title, value]) => <StatCard key={title} title={title} value={value} />)}</div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="h-80 rounded-md border border-slate-200 bg-white p-4 shadow-sm"><Chart type="bar" data={chartData} /></section>
        <section className="h-80 rounded-md border border-slate-200 bg-white p-4 shadow-sm"><Chart type="line" data={secondaryChartData ?? chartData} /></section>
      </div>
      <DataTable columns={columns} data={rows} enableExport={canExport} />
    </div>
  );
}

function statusCounts(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
}
