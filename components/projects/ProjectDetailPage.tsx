"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { ReactNode } from "react";
import { useState } from "react";
import { ActivityTimeline } from "@/components/shared/ActivityTimeline";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { StatCard } from "@/components/cards/StatCard";
import { DataTable } from "@/components/tables/DataTable";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatCurrency } from "@/lib/utils";
import { changeProjectStatus, getProjectDetail } from "@/services/api/client/projects.service";
import type { ClientPayment, InventoryBalance, JournalEntry, PettyCash, ProjectExpense, ProjectProgressUpdate, ProjectTeamAssignment, ProjectVehicleAssignment, StockRequest, PurchaseOrder } from "@/types";

const tabs = ["Overview", "Team", "Progress", "Expenses", "Payments", "Stock", "Vehicles", "Documents", "Petty Cash", "Finance", "Timeline"] as const;
const closedStatuses = ["completed", "closed", "cancelled"];

export function ProjectDetailPage({ id }: { id: string }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { role } = useCurrentUser();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["project-detail", id], queryFn: () => getProjectDetail(id) });
  const statusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: Parameters<typeof changeProjectStatus>[1]; reason?: string }) => changeProjectStatus(id, status, reason),
    onSuccess: () => {
      setToast("Project status log written and project status updated.");
      queryClient.invalidateQueries({ queryKey: ["project-detail", id] });
    },
    onError: (error) => setToast((error as Error).message),
  });

  if (isLoading) return <LoadingSkeleton className="h-64 w-full" />;
  if (!data) return <EmptyState title="Project not found" description="The requested project could not be loaded." />;

  const { project } = data;
  const isLocked = closedStatuses.includes(project.status);
  const financeRole = role === "accountant" || role === "finance_manager" || role === "super_admin";
  const actions = getProjectActions(role, isLocked);

  return (
    <div className="grid gap-6">
      {toast ? <div className="rounded-md border border-cyan-200 bg-cyan-50 p-3 text-sm font-medium text-cyan-800">{toast}</div> : null}
      {project.status === "cancelled" ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">Cancelled: {project.cancellationReason}</div> : null}
      <PageHeader
        title={`${project.code} - ${project.name}`}
        description={`${project.customer} / ${project.siteName} / ${project.manager}`}
        actions={<div className="flex flex-wrap gap-2">{actions.map((action) => <button key={action} className="h-10 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">{action}</button>)}{role === "super_admin" && !isLocked ? <button onClick={() => statusMutation.mutate({ status: "closed" })} className="h-10 rounded-md bg-cyan-700 px-3 text-sm font-semibold text-white">Close Project</button> : null}{!isLocked && (role === "project_manager" || role === "super_admin") ? <button onClick={() => setCancelOpen(true)} className="h-10 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700">Cancel</button> : null}</div>}
      />
      <div className="grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_280px]">
        <div>
          <div className="mb-3 flex flex-wrap gap-2"><StatusBadge status={project.status} /><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{formatCurrency(project.budget)}</span></div>
          <div className="h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-cyan-700" style={{ width: `${project.progress}%` }} /></div>
        </div>
        <strong className="text-right text-2xl text-slate-950">{project.progress}%</strong>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {tabs.filter((item) => item !== "Finance" || financeRole).map((item) => <button key={item} onClick={() => setTab(item)} className={`border-b-2 px-3 py-2 text-sm font-semibold ${tab === item ? "border-cyan-700 text-cyan-800" : "border-transparent text-slate-500"}`}>{item}</button>)}
      </div>
      {tab === "Overview" ? <Overview data={data} /> : null}
      {tab === "Team" ? <TeamTab rows={data.team} locked={isLocked} /> : null}
      {tab === "Progress" ? <ProgressTab rows={data.progressUpdates} locked={isLocked} /> : null}
      {tab === "Expenses" ? <ExpensesTab rows={data.expenses} locked={isLocked} /> : null}
      {tab === "Payments" ? <PaymentsTab rows={data.payments} locked={isLocked} /> : null}
      {tab === "Stock" ? <StockTab requests={data.stockRequests} purchaseOrders={data.purchaseOrders} /> : null}
      {tab === "Vehicles" ? <VehiclesTab rows={data.vehicles} locked={isLocked} /> : null}
      {tab === "Documents" ? <DocumentsTab rows={data.documents.map((item) => ({ ...item, project_id: project.project_id }))} locked={isLocked} /> : null}
      {tab === "Petty Cash" ? <PettyCashTab rows={data.pettyCash} locked={isLocked} /> : null}
      {tab === "Finance" ? <FinanceTab expenses={data.expenses} payments={data.payments} inventory={data.inventory} /> : null}
      {tab === "Timeline" ? <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"><ActivityTimeline items={data.timeline} /></section> : null}
      <ConfirmDialog open={cancelOpen} title="Cancel project" message="Cancelling requires a reason. This mock action records a standard cancellation reason." destructive onCancel={() => setCancelOpen(false)} onConfirm={() => { setCancelOpen(false); statusMutation.mutate({ status: "cancelled", reason: "Cancelled by authorized user." }); }} />
    </div>
  );
}

function getProjectActions(role: string | undefined, locked: boolean) {
  if (locked) return [];
  const actions: string[] = [];
  if (role === "project_manager" || role === "super_admin") actions.push("Edit project details", "Add progress update", "Add expense", "Assign team member", "Raise stock request", "Change project status");
  if (role === "technical_officer") actions.push("Add progress update", "Upload document");
  if (role === "accountant" || role === "finance_manager" || role === "super_admin") actions.push("Record client payment");
  if (role === "vehicle_manager" || role === "super_admin") actions.push("Assign vehicle");
  if (role === "super_admin") actions.push("Upload document");
  return Array.from(new Set(actions));
}

function Overview({ data }: { data: Awaited<ReturnType<typeof getProjectDetail>> & {} }) {
  if (!data) return null;
  const expenses = data.expenses.reduce((sum, item) => sum + item.amount, 0);
  const income = data.payments.reduce((sum, item) => sum + item.amount, 0);
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Project Summary</h2><p className="mt-3 text-sm text-slate-600">{data.project.name} at {data.project.siteName} for {data.project.customer}. Dates {data.project.startDate} to {data.project.endDate}.</p></section>
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Linked Quotation</h2>{data.quotation ? <Link className="mt-3 block text-sm font-semibold text-cyan-800" href={`/quotations/${data.quotation.id}`}>{data.quotation.code} v{data.quotation.version} / {formatCurrency(data.quotation.grandTotal)}</Link> : <p className="mt-3 text-sm text-slate-500">No linked quotation.</p>}</section>
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Profitability Snapshot</h2><p className="mt-3 text-sm text-slate-600">Income {formatCurrency(income)} / Expenses {formatCurrency(expenses)} / P&L {formatCurrency(income - expenses)}</p></section>
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2"><h2 className="font-semibold">Budget vs Actual</h2><div className="mt-4 h-4 rounded-full bg-slate-100"><div className="h-4 rounded-full bg-cyan-700" style={{ width: `${Math.min(100, (expenses / data.project.budget) * 100)}%` }} /></div><p className="mt-2 text-sm text-slate-600">{formatCurrency(expenses)} spent of {formatCurrency(data.project.budget)}</p></section>
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Next Milestones</h2><ul className="mt-3 list-disc pl-4 text-sm text-slate-600"><li>Site access confirmation</li><li>Material delivery</li><li>Client progress review</li></ul></section>
    </div>
  );
}

function TeamTab({ rows, locked }: { rows: ProjectTeamAssignment[]; locked: boolean }) {
  const columns: ColumnDef<ProjectTeamAssignment>[] = [{ accessorKey: "employeeName", header: "Employee" }, { accessorKey: "roleOnProject", header: "Role on Project" }, { accessorKey: "assignedDate", header: "Assigned Date" }, { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> }];
  return <SectionAction title="Team" action="Assign Member" hidden={locked}><DataTable columns={columns} data={rows} /></SectionAction>;
}

function ProgressTab({ rows, locked }: { rows: ProjectProgressUpdate[]; locked: boolean }) {
  return <SectionAction title="Progress Updates" action="Add Update" hidden={locked}>{rows.map((row) => <article key={row.id} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"><div className="flex justify-between gap-3"><h3 className="font-semibold">{row.title}</h3><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{row.clientVisible ? "Client Visible" : "Internal Only"}</span></div><p className="mt-2 text-sm text-slate-600">{row.summary}</p><p className="mt-1 text-xs text-slate-500">{row.date} / {row.percentComplete}% complete</p></article>)}</SectionAction>;
}

function ExpensesTab({ rows, locked }: { rows: ProjectExpense[]; locked: boolean }) {
  const columns: ColumnDef<ProjectExpense>[] = [{ accessorKey: "code", header: "Code" }, { accessorKey: "category", header: "Category" }, { accessorKey: "date", header: "Date" }, { accessorKey: "vendorOrPayee", header: "Vendor" }, { accessorKey: "amount", header: "Amount", cell: ({ row }) => formatCurrency(row.original.amount) }, { accessorKey: "paymentMethod", header: "Method" }, { accessorKey: "approvalStatus", header: "Approval", cell: ({ row }) => <StatusBadge status={row.original.approvalStatus} /> }, { accessorKey: "notes", header: "Notes" }];
  const categoryData = Object.entries(rows.reduce<Record<string, number>>((acc, row) => { acc[row.category] = (acc[row.category] ?? 0) + row.amount; return acc; }, {})).map(([name, value]) => ({ name, value }));
  return <SectionAction title="Expenses" action="Add Expense" hidden={locked}><div className="grid gap-4 md:grid-cols-3"><StatCard title="Total Expenses" value={formatCurrency(rows.reduce((sum, row) => sum + row.amount, 0))} /><StatCard title="This Month" value={formatCurrency(rows.filter((row) => row.date.startsWith("2026-06")).reduce((sum, row) => sum + row.amount, 0))} /><div className="h-24 rounded-md border border-slate-200 bg-white p-2"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="value">{categoryData.map((_, index) => <Cell key={index} fill={["#0e7490", "#f59e0b", "#10b981", "#64748b"][index % 4]} />)}</Pie></PieChart></ResponsiveContainer></div></div><DataTable columns={columns} data={rows} /></SectionAction>;
}

function PaymentsTab({ rows, locked }: { rows: ClientPayment[]; locked: boolean }) {
  const columns: ColumnDef<ClientPayment>[] = [{ accessorKey: "code", header: "Code" }, { accessorKey: "customer", header: "Customer" }, { accessorKey: "date", header: "Date" }, { accessorKey: "amount", header: "Amount", cell: ({ row }) => formatCurrency(row.original.amount) }, { accessorKey: "method", header: "Method" }, { accessorKey: "milestoneReference", header: "Milestone Ref" }, { accessorKey: "referenceNo", header: "Reference No" }];
  return <SectionAction title="Payments" action="Record Payment" hidden={locked}><DataTable columns={columns} data={rows} /></SectionAction>;
}

function StockTab({ requests, purchaseOrders }: { requests: StockRequest[]; purchaseOrders: PurchaseOrder[] }) {
  const columns: ColumnDef<StockRequest>[] = [{ accessorKey: "code", header: "Code", cell: ({ row }) => <Link className="font-semibold text-cyan-800" href={`/stock/requests/${row.original.id}`}>{row.original.code}</Link> }, { accessorKey: "requestDate", header: "Request Date" }, { accessorKey: "requiredByDate", header: "Required By" }, { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> }];
  return <div className="grid gap-4"><Link href="/stock/requests/new" className="w-fit rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white">Raise Stock Request</Link><DataTable columns={columns} data={requests} /><p className="text-sm text-slate-500">Linked POs: {purchaseOrders.map((po) => po.code).join(", ") || "None"}</p></div>;
}

function VehiclesTab({ rows, locked }: { rows: ProjectVehicleAssignment[]; locked: boolean }) {
  const columns: ColumnDef<ProjectVehicleAssignment>[] = [{ accessorKey: "vehicleNo", header: "Vehicle No" }, { accessorKey: "category", header: "Category" }, { accessorKey: "assignedDate", header: "Assigned Date" }, { accessorKey: "removedDate", header: "Removed Date" }, { accessorKey: "status", header: "Status" }];
  return <SectionAction title="Vehicles" action="Assign Vehicle" hidden={locked}><DataTable columns={columns} data={rows} /></SectionAction>;
}

function DocumentsTab({ rows, locked }: { rows: Array<{ name: string; type: string; uploader: string; date: string }>; locked: boolean }) {
  return <SectionAction title="Documents" action="Upload" hidden={locked}>{rows.length ? <div className="grid gap-3 md:grid-cols-3">{rows.map((row) => <article key={row.name} className="rounded-md border border-slate-200 bg-white p-4 text-sm shadow-sm"><strong>{row.name}</strong><p className="mt-1 text-slate-500">{row.type} / {row.uploader} / {row.date}</p><a className="mt-2 inline-block text-cyan-800">Download</a></article>)}</div> : <EmptyState title="No documents" description="Upload drawings, photos, and receipts." />}</SectionAction>;
}

function PettyCashTab({ rows, locked }: { rows: PettyCash[]; locked: boolean }) {
  const columns: ColumnDef<PettyCash>[] = [{ accessorKey: "employeeName", header: "Employee" }, { accessorKey: "amount", header: "Amount", cell: ({ row }) => formatCurrency(row.original.amount) }, { accessorKey: "issued", header: "Issued" }, { accessorKey: "settled", header: "Settled", cell: ({ row }) => formatCurrency(row.original.settled) }, { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> }];
  return <SectionAction title="Petty Cash" action="Issue Petty Cash" hidden={locked}><DataTable columns={columns} data={rows} /></SectionAction>;
}

function FinanceTab({ expenses, payments, inventory }: { expenses: ProjectExpense[]; payments: ClientPayment[]; inventory: InventoryBalance[] }) {
  const income = payments.reduce((sum, row) => sum + row.amount, 0);
  const expense = expenses.reduce((sum, row) => sum + row.amount, 0);
  return <div className="grid gap-4"><div className="grid gap-4 md:grid-cols-3"><StatCard title="Income" value={formatCurrency(income)} /><StatCard title="Expenses" value={formatCurrency(expense)} /><StatCard title="P&L" value={formatCurrency(income - expense)} /></div><p className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">Inventory lines tied to this project: {inventory.length}. Detailed journal entries are available only in Accounting ledgers.</p></div>;
}

function SectionAction({ title, action, hidden, children }: { title: string; action: string; hidden?: boolean; children: ReactNode }) {
  return <section className="grid gap-4"><div className="flex justify-between gap-3"><h2 className="text-base font-semibold text-slate-950">{title}</h2>{!hidden ? <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">{action}</button> : null}</div>{children}</section>;
}
