"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/tables/DataTable";
import { RowActionsMenu } from "@/components/tables/RowActionsMenu";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermission } from "@/hooks/usePermission";
import { formatCurrency } from "@/lib/utils";
import { duplicateQuotationVersion, getQuotations, markQuotationStatus } from "@/services/mock/quotations.service";
import type { Quotation } from "@/types";

export function QuotationListPage() {
  const { can } = usePermission();
  const { role } = useCurrentUser();
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["quotations"], queryFn: () => getQuotations() });
  const [filters, setFilters] = useState({ status: "", owner: "", from: "", to: "", min: "", max: "" });
  const duplicateMutation = useMutation({
    mutationFn: duplicateQuotationVersion,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quotations"] }),
  });
  const sendMutation = useMutation({
    mutationFn: (id: string) => markQuotationStatus(id, "sent_to_client"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quotations"] }),
  });

  const filtered = useMemo(
    () =>
      data.filter((row) => {
        const sent = row.sentDate ? new Date(row.sentDate).getTime() : 0;
        return (
          (!filters.status || row.status === filters.status) &&
          (!filters.owner || row.owner === filters.owner) &&
          (!filters.from || sent >= new Date(filters.from).getTime()) &&
          (!filters.to || sent <= new Date(filters.to).getTime()) &&
          (!filters.min || row.grandTotal >= Number(filters.min)) &&
          (!filters.max || row.grandTotal <= Number(filters.max))
        );
      }),
    [data, filters],
  );

  const isMarketingManager = role === "super_admin" || role === "marketing_manager";
  const columns: ColumnDef<Quotation>[] = [
    { accessorKey: "code", header: "Code", cell: ({ row }) => <Link className="font-medium text-cyan-800" href={`/quotations/${row.original.id}`}>{row.original.code}</Link> },
    { accessorKey: "version", header: "Version", cell: ({ row }) => <span className={row.original.active ? "font-semibold text-emerald-700" : "text-slate-500"}>v{row.original.version}{row.original.active ? " active" : ""}</span> },
    { accessorKey: "leadCode", header: "Lead" },
    { accessorKey: "customerName", header: "Customer" },
    { accessorKey: "grandTotal", header: "Grand Total", cell: ({ row }) => formatCurrency(row.original.grandTotal) },
    { accessorKey: "validUntil", header: "Valid Until" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "sentDate", header: "Sent Date" },
    { accessorKey: "owner", header: "Owner" },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActionsMenu
          actions={[
            { label: "View", onSelect: () => (window.location.href = `/quotations/${row.original.id}`) },
            ...(can("create", "quotation") ? [{ label: "Duplicate Version", onSelect: () => duplicateMutation.mutate(row.original.id) }] : []),
            ...(can("edit", "quotation") && row.original.status === "draft" ? [{ label: "Edit Draft", onSelect: () => undefined }] : []),
            ...(isMarketingManager && row.original.status !== "sent_to_client" ? [{ label: "Send to Client", onSelect: () => sendMutation.mutate(row.original.id) }] : []),
            { label: "Preview PDF", onSelect: () => undefined },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader title="Quotations" description="Generate, version, send, and track customer quotations." actions={<button className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700"><FileText className="h-4 w-4" />Preview PDF</button>} />
      <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-6">
        <Filter label="Status" value={filters.status} options={["", "draft", "review", "sent_to_client", "revision_requested", "approved", "rejected"]} onChange={(status) => setFilters((prev) => ({ ...prev, status }))} />
        <Filter label="Owner" value={filters.owner} options={["", ...Array.from(new Set(data.map((item) => item.owner)))]} onChange={(owner) => setFilters((prev) => ({ ...prev, owner }))} />
        <Input label="From" type="date" value={filters.from} onChange={(from) => setFilters((prev) => ({ ...prev, from }))} />
        <Input label="To" type="date" value={filters.to} onChange={(to) => setFilters((prev) => ({ ...prev, to }))} />
        <Input label="Min Value" type="number" value={filters.min} onChange={(min) => setFilters((prev) => ({ ...prev, min }))} />
        <Input label="Max Value" type="number" value={filters.max} onChange={(max) => setFilters((prev) => ({ ...prev, max }))} />
      </div>
      <DataTable columns={columns} data={filtered} loading={isLoading} enableExport />
    </div>
  );
}

function Filter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="grid gap-1 text-xs font-medium uppercase text-slate-500">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-slate-300 px-2 text-sm normal-case text-slate-700">{options.map((item) => <option key={item || "all"} value={item}>{item || "All"}</option>)}</select></label>;
}

function Input({ label, value, type, onChange }: { label: string; value: string; type: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1 text-xs font-medium uppercase text-slate-500">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-slate-300 px-2 text-sm normal-case text-slate-700" /></label>;
}
