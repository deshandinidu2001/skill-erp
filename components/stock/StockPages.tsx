"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { PO_APPROVAL_THRESHOLD } from "@/constants/stock";
import { StatCard } from "@/components/cards/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable } from "@/components/tables/DataTable";
import { RowActionsMenu } from "@/components/tables/RowActionsMenu";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatCurrency } from "@/lib/utils";
import {
  approvePurchaseOrder,
  createGoodsReceipt,
  createStockRequest,
  getGoodsReceipts,
  getInventory,
  getPurchaseOrders,
  getStockItems,
  getStockRequestById,
  getStockRequests,
  getSuppliers,
  updateStockRequestStatus,
} from "@/services/api/client/stock.service";
import { getProjects } from "@/services/api/client/projects.service";
import type { GoodsReceipt, InventoryBalance, PurchaseOrder, StockItem, StockRequest, StockRequestLine, Supplier } from "@/types";

export function ItemMasterPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["stock-items"], queryFn: getStockItems });
  const columns: ColumnDef<StockItem>[] = [
    { accessorKey: "code", header: "Code" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "unit", header: "Unit" },
    { accessorKey: "standardCost", header: "Standard Cost", cell: ({ row }) => formatCurrency(row.original.standardCost) },
    { accessorKey: "preferredSupplier", header: "Preferred Supplier" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { id: "actions", header: "", cell: ({ row }) => <RowActionsMenu actions={[{ label: "Edit", onSelect: () => undefined }, { label: row.original.usedInRequest ? "Deactivate" : "Delete", destructive: !row.original.usedInRequest, onSelect: () => undefined }]} /> },
  ];
  return <PageShell title="Item Master" description="Maintain procurement items. Used items are deactivated instead of deleted." action="Create Item"><DataTable columns={columns} data={data} loading={isLoading} enableExport /></PageShell>;
}

export function SupplierListPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["suppliers"], queryFn: getSuppliers });
  const columns: ColumnDef<Supplier>[] = [
    { accessorKey: "code", header: "Code" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "contact", header: "Contact" },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "rating", header: "Rating" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  ];
  return (
    <PageShell title="Suppliers" description="Supplier information, on-time performance, ratings, and order history." action="Create Supplier">
      <div className="grid gap-4 md:grid-cols-3">
        {data.map((supplier) => <article key={supplier.id} className="rounded-md border border-slate-200 bg-white p-4 text-sm shadow-sm"><strong>{supplier.name}</strong><p className="mt-1 text-slate-500">On-time {supplier.onTimePercent}% / Avg rating {supplier.rating}</p><p className="mt-1 text-slate-500">Orders: {supplier.orderHistory.join(", ") || "None"}</p></article>)}
      </div>
      <DataTable columns={columns} data={data} loading={isLoading} enableExport />
    </PageShell>
  );
}

export function StockRequestListPage() {
  const { role } = useCurrentUser();
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["stock-requests"], queryFn: getStockRequests });
  const [filters, setFilters] = useState({ status: "", project: "", site: "", from: "", to: "" });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StockRequest["status"] }) => updateStockRequestStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stock-requests"] }),
  });
  const filtered = useMemo(() => data.filter((row) => (!filters.status || row.status === filters.status) && (!filters.project || row.project === filters.project) && (!filters.site || row.site === filters.site) && (!filters.from || new Date(row.requestDate) >= new Date(filters.from)) && (!filters.to || new Date(row.requestDate) <= new Date(filters.to))), [data, filters]);
  const stockManager = role === "stock_manager" || role === "super_admin";
  const columns: ColumnDef<StockRequest>[] = [
    { accessorKey: "code", header: "Code", cell: ({ row }) => <Link className="font-semibold text-cyan-800" href={`/stock/requests/${row.original.id}`}>{row.original.code}</Link> },
    { accessorKey: "project", header: "Project" },
    { accessorKey: "site", header: "Site" },
    { accessorKey: "requestDate", header: "Request Date" },
    { accessorKey: "requiredByDate", header: "Required By" },
    { accessorKey: "requester", header: "Requester" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { id: "actions", header: "", cell: ({ row }) => <RowActionsMenu actions={[{ label: "View", onSelect: () => (window.location.href = `/stock/requests/${row.original.id}`) }, ...(row.original.status === "draft" ? [{ label: "Edit", onSelect: () => undefined }] : []), ...(stockManager ? [{ label: "Convert to PO", onSelect: () => statusMutation.mutate({ id: row.original.id, status: "converted_to_po" }) }] : [])]} /> },
  ];
  return (
    <div className="grid gap-6">
      <PageHeader title="Stock Requests" description="Project material requests through review, approval, and PO conversion." actions={<Link href="/stock/requests/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-3 text-sm font-semibold text-white"><Plus className="h-4 w-4" />New Request</Link>} />
      <div className="grid gap-4 md:grid-cols-4"><StatCard title="Draft" value={data.filter((i) => i.status === "draft").length} /><StatCard title="Pending Review" value={data.filter((i) => i.status === "submitted" || i.status === "qs_review").length} /><StatCard title="Approved" value={data.filter((i) => i.status === "approved").length} /><StatCard title="In Progress" value={data.filter((i) => i.status === "converted_to_po" || i.status === "partially_fulfilled").length} /></div>
      <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5"><Select label="Status" value={filters.status} options={["", ...Array.from(new Set(data.map((i) => i.status)))]} onChange={(status) => setFilters((p) => ({ ...p, status }))} /><Select label="Project" value={filters.project} options={["", ...Array.from(new Set(data.map((i) => i.project)))]} onChange={(project) => setFilters((p) => ({ ...p, project }))} /><Select label="Site" value={filters.site} options={["", ...Array.from(new Set(data.map((i) => i.site)))]} onChange={(site) => setFilters((p) => ({ ...p, site }))} /><Input label="From" type="date" value={filters.from} onChange={(from) => setFilters((p) => ({ ...p, from }))} /><Input label="To" type="date" value={filters.to} onChange={(to) => setFilters((p) => ({ ...p, to }))} /></div>
      <DataTable columns={columns} data={filtered} loading={isLoading} enableExport />
    </div>
  );
}

export function StockRequestFormPage() {
  const queryClient = useQueryClient();
  const { data: items = [] } = useQuery({ queryKey: ["stock-items"], queryFn: getStockItems });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => getProjects() });
  const [projectId, setProjectId] = useState("");
  const [site, setSite] = useState("");
  const selectedProjectId = projectId || projects[0]?.project_id || "";
  const selectedSite = site || projects[0]?.site || "";
  const [requestDate, setRequestDate] = useState("2026-06-04");
  const [requiredByDate, setRequiredByDate] = useState("2026-06-08");
  const [lines, setLines] = useState<StockRequestLine[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (status: "draft" | "submitted") => createStockRequest({ project_id: selectedProjectId, site: selectedSite, requestDate, requiredByDate, requestedBy: "Kasun Jayasinghe", lines }).then((row) => updateStockRequestStatus(row.id, status)),
    onSuccess: () => { setToast("Stock request saved."); queryClient.invalidateQueries({ queryKey: ["stock-requests"] }); },
    onError: (error) => setToast((error as Error).message),
  });
  const addLine = () => {
    const item = items[0];
    if (!item) return;
    setLines((prev) => [...prev, { id: `line_${Date.now()}`, itemId: item.id, itemCode: item.code, itemName: item.name, quantity: 1, unit: item.unit, purpose: "", estimatedPrice: item.standardCost }]);
  };
  return (
    <div className="grid gap-6">
      {toast ? <div className="rounded-md border border-cyan-200 bg-cyan-50 p-3 text-sm font-medium text-cyan-800">{toast}</div> : null}
      <PageHeader title="Create Stock Request" description="Project, site, required date, and line quantities are validated before submit." />
      <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
        <Select label="Project" value={selectedProjectId} options={projects.map((p) => p.project_id)} onChange={(value) => { const project = projects.find((p) => p.project_id === value); setProjectId(value); setSite(project?.site ?? ""); }} />
        <Input label="Site" value={selectedSite} type="text" onChange={setSite} />
        <Input label="Request Date" value={requestDate} type="date" onChange={setRequestDate} />
        <Input label="Required By" value={requiredByDate} type="date" onChange={setRequiredByDate} />
        <Input label="Requested By" value="Kasun Jayasinghe" type="text" onChange={() => undefined} />
      </section>
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Lines</h2><button onClick={addLine} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">Add Row</button></div>
        <RequestLines rows={lines} items={items} onChange={setLines} />
      </section>
      <div className="flex gap-2"><button onClick={() => mutation.mutate("draft")} className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold">Save Draft</button><button onClick={() => mutation.mutate("submitted")} className="h-10 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white">Submit Request</button></div>
    </div>
  );
}

export function StockRequestDetailPage({ id }: { id: string }) {
  const { role } = useCurrentUser();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("Overview");
  const [toast, setToast] = useState<string | null>(null);
  const { data } = useQuery({ queryKey: ["stock-request", id], queryFn: () => getStockRequestById(id) });
  const mutation = useMutation({ mutationFn: ({ status, reason }: { status: StockRequest["status"]; reason?: string }) => updateStockRequestStatus(id, status, reason), onSuccess: () => { setToast("Status updated."); queryClient.invalidateQueries({ queryKey: ["stock-request", id] }); } });
  if (!data) return <EmptyStock title="Stock request not found" />;
  const stockManager = role === "stock_manager" || role === "super_admin";
  const qs = role === "qs_manager" || role === "qs_engineer" || role === "super_admin";
  return (
    <div className="grid gap-6">
      {toast ? <div className="rounded-md border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-800">{toast}</div> : null}
      <PageHeader title={`${data.code}`} description={`${data.project} / ${data.site}`} actions={<div className="flex flex-wrap gap-2">{data.status === "draft" && role === "project_manager" ? <Button label="Submit" onClick={() => mutation.mutate({ status: "submitted" })} /> : null}{qs ? <Button label="QS Review/Validate" onClick={() => mutation.mutate({ status: "qs_review" })} /> : null}{stockManager ? <Button label="Approve" onClick={() => mutation.mutate({ status: "approved" })} /> : null}{stockManager ? <Button label="Reject" onClick={() => mutation.mutate({ status: "rejected", reason: "Rejected by stock manager." })} /> : null}{stockManager && data.status === "approved" ? <Button label="Convert to PO" onClick={() => mutation.mutate({ status: "converted_to_po" })} /> : null}</div>} />
      <StatusBadge status={data.status} />
      <div className="flex gap-2 border-b border-slate-200">{["Overview", "Lines", "Purchase Orders", "Timeline"].map((item) => <button key={item} onClick={() => setTab(item)} className={`border-b-2 px-3 py-2 text-sm font-semibold ${tab === item ? "border-cyan-700 text-cyan-800" : "border-transparent text-slate-500"}`}>{item}</button>)}</div>
      {tab === "Overview" ? <section className="rounded-md border border-slate-200 bg-white p-5 text-sm shadow-sm">Requested by {data.requester} on {data.requestDate}. Required by {data.requiredByDate}. {data.rejectReason ? `Rejected: ${data.rejectReason}` : ""}</section> : null}
      {tab === "Lines" ? <DataTable columns={requestLineColumns} data={data.lines} /> : null}
      {tab === "Purchase Orders" ? <Link href="/stock/purchase-orders/new" className="w-fit rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white">Create PO from Request</Link> : null}
      {tab === "Timeline" ? <section className="rounded-md border border-slate-200 bg-white p-5 text-sm shadow-sm">Created, submitted, reviewed, approved, converted status events will appear here.</section> : null}
    </div>
  );
}

export function PurchaseOrderListPage() {
  const { role } = useCurrentUser();
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["purchase-orders"], queryFn: getPurchaseOrders });
  const [status, setStatus] = useState("");
  const mutation = useMutation({ mutationFn: (id: string) => approvePurchaseOrder(id, role || ""), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["purchase-orders"] }) });
  const columns: ColumnDef<PurchaseOrder>[] = [
    { accessorKey: "code", header: "PO Code" },
    { accessorKey: "supplier", header: "Supplier" },
    { accessorKey: "linkedRequestCode", header: "Linked Request" },
    { accessorKey: "site", header: "Site" },
    { accessorKey: "issueDate", header: "Issue Date" },
    { accessorKey: "expectedDeliveryDate", header: "Expected Delivery" },
    { accessorKey: "grandTotal", header: "Grand Total", cell: ({ row }) => formatCurrency(row.original.grandTotal) },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { id: "actions", header: "", cell: ({ row }) => <RowActionsMenu actions={[{ label: `Approve (${row.original.grandTotal > PO_APPROVAL_THRESHOLD ? "Finance" : "Stock"})`, onSelect: () => mutation.mutate(row.original.id) }]} /> },
  ];
  return <PageShell title="Purchase Orders" description="Draft, approve, issue, and receive purchase orders." actionHref="/stock/purchase-orders/new" action="New PO"><Select label="Status" value={status} options={["", ...Array.from(new Set(data.map((po) => po.status)))]} onChange={setStatus} /><DataTable columns={columns} data={status ? data.filter((po) => po.status === status) : data} loading={isLoading} enableExport /></PageShell>;
}

export function PurchaseOrderFormPage() {
  return <PageShell title="New Purchase Order" description={`Grand total auto-calculates. Stock manager approval limit is ${formatCurrency(PO_APPROVAL_THRESHOLD)}; finance manager approves above threshold.`} action="Save Draft"><section className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">Supplier, project, linked request, issue date, expected delivery date, and editable lines are scaffolded for API integration.</section></PageShell>;
}

export function GoodsReceiptPage() {
  const queryClient = useQueryClient();
  const { data: receipts = [] } = useQuery({ queryKey: ["goods-receipts"], queryFn: getGoodsReceipts });
  const { data: pos = [] } = useQuery({ queryKey: ["purchase-orders"], queryFn: getPurchaseOrders });
  const mutation = useMutation({ mutationFn: () => createGoodsReceipt({ project_id: pos[0].project_id, poId: pos[0].id, poCode: pos[0].code, receivedDate: "2026-06-04", receivedBy: "Malith Silva", lines: pos[0].lines.map((line) => ({ itemId: line.itemId, itemName: line.itemName, orderedQty: line.orderedQty, receivedQty: Math.max(0, line.orderedQty - line.receivedQuantity), damagedQty: 0 })) }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goods-receipts"] }) });
  const columns: ColumnDef<GoodsReceipt>[] = [{ accessorKey: "code", header: "Code" }, { accessorKey: "poCode", header: "PO" }, { accessorKey: "receivedDate", header: "Received Date" }, { accessorKey: "receivedBy", header: "Received By" }];
  return <PageShell title="Goods Receipts" description="Store keeper records receipts, updates PO received quantity, and moves inventory balance." action="Record Goods Receipt" onAction={() => mutation.mutate()}><DataTable columns={columns} data={receipts} enableExport /></PageShell>;
}

export function InventoryDashboardPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["inventory"], queryFn: getInventory });
  const [site, setSite] = useState("");
  const rows = site ? data.filter((row) => row.site === site) : data;
  const columns: ColumnDef<InventoryBalance>[] = [{ accessorKey: "item", header: "Item" }, { accessorKey: "category", header: "Category" }, { accessorKey: "unit", header: "Unit" }, { accessorKey: "currentBalance", header: "Current Balance" }, { accessorKey: "reorderLevel", header: "Reorder Level" }, { id: "alert", header: "Alert", cell: ({ row }) => row.original.currentBalance <= row.original.reorderLevel ? <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">Low Stock</span> : <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">OK</span> }];
  return <PageShell title="Inventory" description="Site inventory balances, low stock alerts, and recent movements."><Select label="Site" value={site} options={["", ...Array.from(new Set(data.map((row) => row.site)))]} onChange={setSite} /><DataTable columns={columns} data={rows} loading={isLoading} enableExport /><section className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">Recent movements: goods receipt GR-7001 increased Cement 50kg balance; PO-6001 pending receipt.</section></PageShell>;
}

const requestLineColumns: ColumnDef<StockRequestLine>[] = [{ accessorKey: "itemCode", header: "Item Code" }, { accessorKey: "itemName", header: "Item" }, { accessorKey: "quantity", header: "Qty" }, { accessorKey: "unit", header: "Unit" }, { accessorKey: "purpose", header: "Purpose" }, { accessorKey: "boqItemReference", header: "BOQ Ref" }, { accessorKey: "estimatedPrice", header: "Estimated Price", cell: ({ row }) => formatCurrency(row.original.estimatedPrice) }];

function RequestLines({ rows, items, onChange }: { rows: StockRequestLine[]; items: StockItem[]; onChange: (rows: StockRequestLine[]) => void }) {
  return <div className="grid gap-3">{rows.map((row) => <div key={row.id} className="grid gap-2 rounded-md border border-slate-200 p-3 md:grid-cols-6"><Select label="Item" value={row.itemId} options={items.map((item) => item.id)} onChange={(itemId) => { const item = items.find((candidate) => candidate.id === itemId); onChange(rows.map((line) => line.id === row.id && item ? { ...line, itemId, itemCode: item.code, itemName: item.name, unit: item.unit, estimatedPrice: item.standardCost * line.quantity } : line)); }} /><Input label="Quantity" type="number" value={String(row.quantity)} onChange={(quantity) => onChange(rows.map((line) => line.id === row.id ? { ...line, quantity: Number(quantity), estimatedPrice: Number(quantity) * (items.find((item) => item.id === line.itemId)?.standardCost ?? 0) } : line))} /><Input label="Unit" type="text" value={row.unit} onChange={() => undefined} /><Input label="Purpose" type="text" value={row.purpose} onChange={(purpose) => onChange(rows.map((line) => line.id === row.id ? { ...line, purpose } : line))} /><Input label="BOQ Ref" type="text" value={row.boqItemReference ?? ""} onChange={(boqItemReference) => onChange(rows.map((line) => line.id === row.id ? { ...line, boqItemReference } : line))} /><button onClick={() => onChange(rows.filter((line) => line.id !== row.id))} className="mt-5 h-10 rounded-md border border-red-200 text-sm font-semibold text-red-700">Remove</button></div>)}</div>;
}

function PageShell({ title, description, action, actionHref, onAction, children }: { title: string; description: string; action?: string; actionHref?: string; onAction?: () => void; children: ReactNode }) {
  const actionNode = actionHref ? <Link href={actionHref} className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-3 text-sm font-semibold text-white"><Plus className="h-4 w-4" />{action}</Link> : action ? <button onClick={onAction} className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-3 text-sm font-semibold text-white"><Plus className="h-4 w-4" />{action}</button> : null;
  return <div className="grid gap-6"><PageHeader title={title} description={description} actions={actionNode} />{children}</div>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="grid gap-1 text-xs font-medium uppercase text-slate-500">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-slate-300 px-2 text-sm normal-case text-slate-700">{options.map((item) => <option key={item || "all"} value={item}>{item || "All"}</option>)}</select></label>;
}

function Input({ label, value, type, onChange }: { label: string; value: string; type: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1 text-xs font-medium uppercase text-slate-500">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-slate-300 px-2 text-sm normal-case text-slate-700" /></label>;
}

function Button({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} className="h-10 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">{label}</button>;
}

function EmptyStock({ title }: { title: string }) {
  return <div className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">{title}</div>;
}
