"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Archive, Edit, Eye, Send, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { StatCard } from "@/components/cards/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable } from "@/components/tables/DataTable";
import { RowActionsMenu } from "@/components/tables/RowActionsMenu";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermission } from "@/hooks/usePermission";
import { formatCurrency } from "@/lib/utils";
import { getLeads } from "@/services/mock/leads.service";
import type { Lead, Priority, ProjectType } from "@/types";

const priorities: Array<Priority | ""> = ["", "LOW", "MEDIUM", "HIGH", "URGENT"];
const projectTypes: Array<ProjectType | ""> = ["", "DRAWING_ONLY", "2D_3D", "CONSTRUCTION_ONLY", "FULL_PROJECT"];

export function LeadListPage() {
  const { can } = usePermission();
  const { role } = useCurrentUser();
  const { data = [], isLoading } = useQuery({ queryKey: ["leads"], queryFn: () => getLeads() });
  const [filters, setFilters] = useState({
    status: "",
    owner: "",
    projectType: "",
    priority: "",
    from: "",
    to: "",
  });

  const marketingCanSend = role === "super_admin" || role === "marketing_manager" || role === "marketing_executive";
  const filtered = useMemo(
    () =>
      data.filter((lead) => {
        const created = new Date(lead.createdAt).getTime();
        return (
          (!filters.status || lead.status === filters.status) &&
          (!filters.owner || lead.owner === filters.owner) &&
          (!filters.projectType || lead.projectType === filters.projectType) &&
          (!filters.priority || lead.priority === filters.priority) &&
          (!filters.from || created >= new Date(filters.from).getTime()) &&
          (!filters.to || created <= new Date(filters.to).getTime())
        );
      }),
    [data, filters],
  );

  const columns: ColumnDef<Lead>[] = [
    { accessorKey: "code", header: "Lead Code", cell: ({ row }) => <Link className="font-medium text-cyan-800 hover:underline" href={`/marketing/leads/${row.original.id}`}>{row.original.code}</Link> },
    { accessorKey: "customerName", header: "Customer" },
    { accessorKey: "location", header: "Location" },
    { accessorKey: "projectType", header: "Project Type" },
    { accessorKey: "priority", header: "Priority", cell: ({ row }) => <PriorityBadge priority={row.original.priority} /> },
    { accessorKey: "owner", header: "Owner" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "createdAt", header: "Created" },
    { accessorKey: "updatedAt", header: "Last Updated" },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActionsMenu
          actions={[
            { label: "View", onSelect: () => (window.location.href = `/marketing/leads/${row.original.id}`) },
            ...(can("edit", "lead") ? [{ label: "Edit", onSelect: () => (window.location.href = `/marketing/leads/${row.original.id}`) }] : []),
            ...(marketingCanSend && row.original.status !== "qs_estimation_pending"
              ? [{ label: "Send to QS", onSelect: () => undefined }]
              : []),
            ...(can("delete", "lead") ? [{ label: "Archive", destructive: true, onSelect: () => undefined }] : []),
          ]}
        />
      ),
    },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Leads"
        description="Capture requirements and move opportunities through QS estimation and quotation."
        actions={
          can("create", "lead") ? (
            <Link href="/marketing/leads/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-3 text-sm font-semibold text-white hover:bg-cyan-800">
              <Plus className="h-4 w-4" />
              New Lead
            </Link>
          ) : null
        }
      />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Leads" value={data.length} />
        <StatCard title="New" value={data.filter((lead) => lead.status === "new").length} />
        <StatCard title="QS Pending" value={data.filter((lead) => lead.status === "qs_estimation_pending").length} />
        <StatCard title="Approved this month" value={data.filter((lead) => lead.status === "approved" && lead.updatedAt.startsWith("2026-06")).length} />
      </div>
      <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-6">
        <FilterSelect label="Status" value={filters.status} options={["", "new", "under_review", "qs_estimation_pending", "quotation_submitted", "client_discussion", "approved", "rejected"]} onChange={(status) => setFilters((prev) => ({ ...prev, status }))} />
        <FilterSelect label="Owner" value={filters.owner} options={["", ...Array.from(new Set(data.map((lead) => lead.owner)))]} onChange={(owner) => setFilters((prev) => ({ ...prev, owner }))} />
        <FilterSelect label="Project type" value={filters.projectType} options={projectTypes} onChange={(projectType) => setFilters((prev) => ({ ...prev, projectType }))} />
        <FilterSelect label="Priority" value={filters.priority} options={priorities} onChange={(priority) => setFilters((prev) => ({ ...prev, priority }))} />
        <DateInput label="From" value={filters.from} onChange={(from) => setFilters((prev) => ({ ...prev, from }))} />
        <DateInput label="To" value={filters.to} onChange={(to) => setFilters((prev) => ({ ...prev, to }))} />
      </div>
      <DataTable columns={columns} data={filtered} loading={isLoading} enableExport />
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-xs font-medium uppercase text-slate-500">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm normal-case text-slate-700">
        {options.map((option) => (
          <option key={option || "all"} value={option}>
            {option || "All"}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-xs font-medium uppercase text-slate-500">
      {label}
      <input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm normal-case text-slate-700" />
    </label>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const classes = {
    LOW: "bg-slate-100 text-slate-700",
    MEDIUM: "bg-blue-50 text-blue-700",
    HIGH: "bg-orange-50 text-orange-700",
    URGENT: "bg-red-50 text-red-700",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes[priority]}`}>{priority}</span>;
}
