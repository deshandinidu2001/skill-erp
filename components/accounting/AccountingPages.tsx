"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useState } from "react";
import { DataTable } from "@/components/tables/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/cards/StatCard";
import { getProjects } from "@/services/api/client/projects.service";
import {
  type LedgerRow,
  getAccounts,
  getCashBook,
  getCustomerPayments,
  getDebtorAging,
  getGeneralLedger,
  getPnl,
  getProjectLedger,
} from "@/services/api/client/accounting-core.service";
import { formatCurrency } from "@/lib/utils";

export function ChartOfAccountsPage() {
  const { data = [] } = useQuery({ queryKey: ["accounts"], queryFn: getAccounts });
  return <div className="grid gap-6"><PageHeader title="Chart of Accounts" description="Super admin account hierarchy." />{["asset", "liability", "income", "expense", "equity"].map((type) => <section key={type} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold capitalize">{type}</h2><div className="mt-3 grid gap-2">{data.filter((a) => a.type === type).map((a) => <div key={a.id} className="rounded-md bg-slate-50 p-3 text-sm"><strong>{a.code}</strong> {a.name} {a.parent ? `/ parent ${a.parent}` : ""} {a.is_cash ? "/ cash" : ""} {a.is_bank ? "/ bank" : ""}</div>)}</div></section>)}</div>;
}

export function ProjectLedgerPage() {
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => getProjects() });
  const [projectId, setProjectId] = useState("");
  const selectedProjectId = projectId || projects[0]?.project_id || "";
  const { data = [] } = useQuery({ queryKey: ["project-ledger", selectedProjectId], queryFn: () => getProjectLedger(selectedProjectId), enabled: Boolean(selectedProjectId) });
  return <LedgerShell title="Project Ledger" description="Project-specific ledger with balanced posted journal lines." rows={data} selector={<Select label="Project" value={selectedProjectId} options={projects.map((p) => p.project_id)} onChange={setProjectId} />} />;
}

export function GeneralLedgerPage() {
  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: getAccounts });
  const [account, setAccount] = useState("");
  const { data = [] } = useQuery({ queryKey: ["general-ledger", account], queryFn: () => getGeneralLedger(account || undefined) });
  return <LedgerShell title="General Ledger" description="Company-wide ledger by account." rows={data} selector={<Select label="Account" value={account} options={["", ...accounts.map((a) => a.code)]} onChange={setAccount} />} />;
}

function LedgerShell({ title, description, rows, selector }: { title: string; description: string; rows: LedgerRow[]; selector: React.ReactNode }) {
  const columns: ColumnDef<LedgerRow>[] = [
    { accessorKey: "date", header: "Date" },
    { accessorKey: "entryCode", header: "Entry Code" },
    { accessorKey: "description", header: "Description" },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "debit", header: "Debit", cell: ({ row }) => formatCurrency(row.original.debit) },
    { accessorKey: "credit", header: "Credit", cell: ({ row }) => formatCurrency(row.original.credit) },
    { accessorKey: "balance", header: "Balance", cell: ({ row }) => formatCurrency(row.original.balance) },
    { accessorKey: "sourceReference", header: "Source Reference" },
  ];
  return <div className="grid gap-6"><PageHeader title={title} description={description} actions={<button className="h-10 rounded-md border border-slate-300 px-3 text-sm font-semibold">Export</button>} />{selector}<DataTable columns={columns} data={rows} enableExport /></div>;
}

export function CashBookPage() {
  const [kind, setKind] = useState<"all" | "cash" | "bank">("all");
  const { data = [] } = useQuery({ queryKey: ["cash-book", kind], queryFn: () => getCashBook(kind) });
  const columns: ColumnDef<(typeof data)[number]>[] = [
    { accessorKey: "date", header: "Date" },
    { accessorKey: "txnCode", header: "Txn Code" },
    { accessorKey: "type", header: "Type" },
    { accessorKey: "amount", header: "Amount", cell: ({ row }) => formatCurrency(row.original.amount) },
    { accessorKey: "projectRef", header: "Project Ref" },
    { accessorKey: "siteRef", header: "Site Ref" },
    { accessorKey: "notes", header: "Notes" },
    { accessorKey: "balance", header: "Running Balance", cell: ({ row }) => formatCurrency(row.original.balance) },
  ];
  return <div className="grid gap-6"><PageHeader title="Cash Book" description="Cash and bank movements with running balance." /><Select label="Cash vs Bank" value={kind} options={["all", "cash", "bank"]} onChange={(v) => setKind(v as typeof kind)} /><DataTable columns={columns} data={data} enableExport /></div>;
}

export function CustomerPaymentsPage() {
  const { data = [] } = useQuery({ queryKey: ["customer-payments"], queryFn: getCustomerPayments });
  const columns: ColumnDef<(typeof data)[number]>[] = [
    { accessorKey: "code", header: "Code" },
    { accessorKey: "project", header: "Project" },
    { accessorKey: "customer", header: "Customer" },
    { accessorKey: "date", header: "Date" },
    { accessorKey: "amount", header: "Amount", cell: ({ row }) => formatCurrency(row.original.amount) },
    { accessorKey: "method", header: "Method" },
    { accessorKey: "milestoneReference", header: "Milestone Ref" },
  ];
  return <div className="grid gap-6"><PageHeader title="Customer Payments" description="Client receipts and milestone references." /><DataTable columns={columns} data={data} enableExport /><section className="rounded-md border border-slate-200 bg-white p-4 text-sm shadow-sm">Clicking a row will open a payment detail drawer in the API-backed version.</section></div>;
}

export function PnlPage() {
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => getProjects() });
  const [projectId, setProjectId] = useState("");
  const { data } = useQuery({ queryKey: ["pnl", projectId], queryFn: () => getPnl(projectId || undefined) });
  return <div className="grid gap-6"><PageHeader title="P&L Report" description="Income, expenses, and net profit by period." /><Select label="Project" value={projectId} options={["", ...projects.map((p) => p.project_id)]} onChange={setProjectId} /><div className="grid gap-4 md:grid-cols-3"><StatCard title="Income" value={formatCurrency(data?.income.reduce((s, r) => s + r.amount, 0) ?? 0)} /><StatCard title="Expenses" value={formatCurrency(data?.expenses.reduce((s, r) => s + r.amount, 0) ?? 0)} /><StatCard title="Net Profit/Loss" value={formatCurrency(data?.net ?? 0)} /></div><section className="h-80 rounded-md border border-slate-200 bg-white p-5 shadow-sm"><ResponsiveContainer width="100%" height="100%"><BarChart data={data?.chart ?? []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Bar dataKey="income" fill="#0e7490" /><Bar dataKey="expense" fill="#f97316" /></BarChart></ResponsiveContainer></section><div className="grid gap-4 md:grid-cols-2"><AccountSummary title="Income" rows={data?.income ?? []} /><AccountSummary title="Expenses" rows={data?.expenses ?? []} /></div></div>;
}

export function DebtorsPage() {
  const { data = [] } = useQuery({ queryKey: ["debtors"], queryFn: getDebtorAging });
  const columns: ColumnDef<(typeof data)[number]>[] = [
    { accessorKey: "project", header: "Project" },
    { accessorKey: "customer", header: "Customer" },
    { accessorKey: "milestone", header: "Milestone" },
    { accessorKey: "dueDate", header: "Due Date" },
    { accessorKey: "dueAmount", header: "Due Amount", cell: ({ row }) => formatCurrency(row.original.dueAmount) },
    { accessorKey: "paid", header: "Paid", cell: ({ row }) => formatCurrency(row.original.paid) },
    { accessorKey: "outstanding", header: "Outstanding", cell: ({ row }) => formatCurrency(row.original.outstanding) },
    { accessorKey: "overdueDays", header: "Overdue Days", cell: ({ row }) => <span className={agingColor(row.original.overdueDays)}>{row.original.overdueDays}</span> },
  ];
  return <div className="grid gap-6"><PageHeader title="Debtor Aging" description="Outstanding receivables by aging bucket." /><div className="grid gap-4 md:grid-cols-4"><StatCard title="Current" value={data.filter((r) => r.overdueDays <= 0).length} /><StatCard title="30 days" value={data.filter((r) => r.overdueDays > 0 && r.overdueDays <= 30).length} /><StatCard title="60 days" value={data.filter((r) => r.overdueDays > 30 && r.overdueDays <= 60).length} /><StatCard title="90+ days" value={data.filter((r) => r.overdueDays > 90).length} /></div><DataTable columns={columns} data={data} enableExport /></div>;
}

function AccountSummary({ title, rows }: { title: string; rows: Array<{ account: string; amount: number }> }) {
  return <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">{title}</h2>{rows.map((row) => <p key={row.account} className="mt-2 flex justify-between text-sm"><span>{row.account}</span><strong>{formatCurrency(row.amount)}</strong></p>)}</section>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="grid max-w-sm gap-1 text-xs font-medium uppercase text-slate-500">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-slate-300 px-2 text-sm normal-case text-slate-700">{options.map((o) => <option key={o || "all"} value={o}>{o || "All"}</option>)}</select></label>;
}

function agingColor(days: number) {
  if (days <= 0) return "font-semibold text-emerald-700";
  if (days <= 30) return "font-semibold text-yellow-700";
  if (days <= 60) return "font-semibold text-orange-700";
  return "font-semibold text-red-700";
}
