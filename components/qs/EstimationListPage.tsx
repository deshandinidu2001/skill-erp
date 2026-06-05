"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Edit, Eye, Plus, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/tables/DataTable";
import { RowActionsMenu } from "@/components/tables/RowActionsMenu";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { usePermission } from "@/hooks/usePermission";
import { formatCurrency } from "@/lib/utils";
import { getEstimations, markEstimationReady } from "@/services/mock/estimations.service";
import type { Estimation } from "@/types";

export function EstimationListPage() {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["estimations"], queryFn: () => getEstimations() });
  const [filters, setFilters] = useState({ status: "", engineer: "", type: "", from: "", to: "" });
  const readyMutation = useMutation({
    mutationFn: markEstimationReady,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["estimations"] }),
  });

  const filtered = useMemo(
    () =>
      data.filter((row) => {
        const updated = new Date(row.updatedAt).getTime();
        return (
          (!filters.status || row.status === filters.status) &&
          (!filters.engineer || row.estimator === filters.engineer) &&
          (!filters.type || row.projectType === filters.type) &&
          (!filters.from || updated >= new Date(filters.from).getTime()) &&
          (!filters.to || updated <= new Date(filters.to).getTime())
        );
      }),
    [data, filters],
  );

  const columns: ColumnDef<Estimation>[] = [
    { accessorKey: "code", header: "Estimation Code", cell: ({ row }) => <Link className="font-medium text-cyan-800" href={`/qs/estimations/${row.original.id}`}>{row.original.code}</Link> },
    { accessorKey: "leadCode", header: "Lead" },
    { accessorKey: "customerName", header: "Customer" },
    { accessorKey: "estimator", header: "QS Engineer" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "grandTotal", header: "Grand Total", cell: ({ row }) => formatCurrency(row.original.grandTotal) },
    { accessorKey: "updatedAt", header: "Updated" },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActionsMenu
          actions={[
            { label: "View", onSelect: () => (window.location.href = `/qs/estimations/${row.original.id}`) },
            ...(can("edit", "estimation") && row.original.status === "draft" ? [{ label: "Edit", onSelect: () => (window.location.href = `/qs/estimations/${row.original.id}/edit`) }] : []),
            ...(can("approve", "estimation") || can("edit", "estimation") ? [{ label: "Mark Ready", onSelect: () => readyMutation.mutate(row.original.id) }] : []),
          ]}
        />
      ),
    },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Estimations"
        description="Build QS estimates and mark ready for quotation."
        actions={can("create", "estimation") ? <Link href="/qs/estimations/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-3 text-sm font-semibold text-white"><Plus className="h-4 w-4" />New Estimation</Link> : null}
      />
      <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5">
        <Select label="Status" value={filters.status} options={["", "draft", "ready", "completed"]} onChange={(status) => setFilters((prev) => ({ ...prev, status }))} />
        <Select label="Engineer" value={filters.engineer} options={["", ...Array.from(new Set(data.map((item) => item.estimator)))]} onChange={(engineer) => setFilters((prev) => ({ ...prev, engineer }))} />
        <Select label="Project Type" value={filters.type} options={["", ...Array.from(new Set(data.map((item) => item.projectType)))]} onChange={(type) => setFilters((prev) => ({ ...prev, type }))} />
        <DateBox label="From" value={filters.from} onChange={(from) => setFilters((prev) => ({ ...prev, from }))} />
        <DateBox label="To" value={filters.to} onChange={(to) => setFilters((prev) => ({ ...prev, to }))} />
      </div>
      <DataTable columns={columns} data={filtered} loading={isLoading} enableExport />
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="grid gap-1 text-xs font-medium uppercase text-slate-500">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-slate-300 px-2 text-sm normal-case text-slate-700">{options.map((item) => <option key={item || "all"} value={item}>{item || "All"}</option>)}</select></label>;
}

function DateBox({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1 text-xs font-medium uppercase text-slate-500">{label}<input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-slate-300 px-2 text-sm normal-case text-slate-700" /></label>;
}
