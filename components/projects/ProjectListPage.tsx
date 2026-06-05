"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { StatCard } from "@/components/cards/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable } from "@/components/tables/DataTable";
import { RowActionsMenu } from "@/components/tables/RowActionsMenu";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatCurrency } from "@/lib/utils";
import { getProjects } from "@/services/api/client/projects.service";
import type { Project } from "@/types";

export function ProjectListPage() {
  const { role } = useCurrentUser();
  const { data = [], isLoading } = useQuery({ queryKey: ["projects"], queryFn: () => getProjects() });
  const [filters, setFilters] = useState({ status: "", site: "", manager: "", customer: "", from: "", to: "" });
  const canCreate = role === "super_admin" || role === "marketing_manager";
  const filtered = useMemo(
    () =>
      data.filter((project) => {
        const start = new Date(project.startDate).getTime();
        return (
          (!filters.status || project.status === filters.status) &&
          (!filters.site || project.site === filters.site) &&
          (!filters.manager || project.manager === filters.manager) &&
          (!filters.customer || project.customer === filters.customer) &&
          (!filters.from || start >= new Date(filters.from).getTime()) &&
          (!filters.to || start <= new Date(filters.to).getTime())
        );
      }),
    [data, filters],
  );
  const columns: ColumnDef<Project>[] = [
    { accessorKey: "code", header: "Code", cell: ({ row }) => <Link className="font-semibold text-cyan-800" href={`/projects/${row.original.id}`}>{row.original.code}</Link> },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "customer", header: "Customer" },
    { accessorKey: "site", header: "Site" },
    { accessorKey: "manager", header: "Manager" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "startDate", header: "Start" },
    { accessorKey: "endDate", header: "End" },
    { accessorKey: "budget", header: "Budget", cell: ({ row }) => formatCurrency(row.original.budget) },
    { accessorKey: "progress", header: "Progress %", cell: ({ row }) => `${row.original.progress}%` },
    { id: "actions", header: "", cell: ({ row }) => <RowActionsMenu actions={[{ label: "View", onSelect: () => (window.location.href = `/projects/${row.original.id}`) }, { label: "Add Progress", onSelect: () => undefined }, { label: "Add Expense", onSelect: () => undefined }, { label: "Assign Team", onSelect: () => undefined }]} /> },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader title="Projects" description="Manage active sites, budgets, progress, expenses, payments, and resources." actions={canCreate ? <Link href="/projects/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-3 text-sm font-semibold text-white"><Plus className="h-4 w-4" />New Project</Link> : null} />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Active Projects" value={data.filter((item) => ["created", "assigned", "in_progress", "ongoing"].includes(item.status)).length} />
        <StatCard title="On Hold" value={data.filter((item) => item.status === "on_hold").length} />
        <StatCard title="Completed this quarter" value={data.filter((item) => item.status === "completed").length} />
        <StatCard title="Total Budget" value={formatCurrency(data.reduce((sum, item) => sum + item.budget, 0))} />
      </div>
      <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-6">
        <Select label="Status" value={filters.status} options={["", ...Array.from(new Set(data.map((item) => item.status)))]} onChange={(status) => setFilters((prev) => ({ ...prev, status }))} />
        <Select label="Site" value={filters.site} options={["", ...Array.from(new Set(data.map((item) => item.site)))]} onChange={(site) => setFilters((prev) => ({ ...prev, site }))} />
        <Select label="Manager" value={filters.manager} options={["", ...Array.from(new Set(data.map((item) => item.manager)))]} onChange={(manager) => setFilters((prev) => ({ ...prev, manager }))} />
        <Select label="Customer" value={filters.customer} options={["", ...Array.from(new Set(data.map((item) => item.customer)))]} onChange={(customer) => setFilters((prev) => ({ ...prev, customer }))} />
        <Input label="From" type="date" value={filters.from} onChange={(from) => setFilters((prev) => ({ ...prev, from }))} />
        <Input label="To" type="date" value={filters.to} onChange={(to) => setFilters((prev) => ({ ...prev, to }))} />
      </div>
      <DataTable columns={columns} data={filtered} loading={isLoading} enableExport />
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="grid gap-1 text-xs font-medium uppercase text-slate-500">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-slate-300 px-2 text-sm normal-case text-slate-700">{options.map((item) => <option key={item || "all"} value={item}>{item || "All"}</option>)}</select></label>;
}

function Input({ label, value, type, onChange }: { label: string; value: string; type: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1 text-xs font-medium uppercase text-slate-500">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-slate-300 px-2 text-sm normal-case text-slate-700" /></label>;
}
