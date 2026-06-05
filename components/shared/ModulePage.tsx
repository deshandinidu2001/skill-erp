"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/tables/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { StatCard } from "@/components/cards/StatCard";
import { formatCurrency } from "@/lib/utils";
import { getEstimations } from "@/services/mock/estimations.service";
import { getLeads } from "@/services/mock/leads.service";
import { getProjects } from "@/services/mock/projects.service";
import { getQuotations } from "@/services/mock/quotations.service";
import { getEmployees } from "@/services/mock/hr.service";
import { getVehicles } from "@/services/mock/vehicles.service";
import { getInventory, getPurchaseOrders, getStockRequests } from "@/services/mock/stock.service";
import type { Employee, Estimation, Lead, Project, Quotation, Vehicle } from "@/types";

type ModuleKind =
  | "leads"
  | "estimations"
  | "quotations"
  | "projects"
  | "employees"
  | "vehicles"
  | "stockRequests"
  | "purchaseOrders"
  | "inventory"
  | "simple";

const leadColumns: ColumnDef<Lead>[] = [
  { accessorKey: "code", header: "Code" },
  { accessorKey: "title", header: "Lead" },
  { accessorKey: "customerName", header: "Customer" },
  { accessorKey: "value", header: "Value", cell: ({ row }) => formatCurrency(row.original.value) },
  { accessorKey: "owner", header: "Owner" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

const estimationColumns: ColumnDef<Estimation>[] = [
  { accessorKey: "code", header: "Code" },
  { accessorKey: "leadCode", header: "Lead" },
  { accessorKey: "projectType", header: "Type" },
  { accessorKey: "amount", header: "Amount", cell: ({ row }) => formatCurrency(row.original.amount) },
  { accessorKey: "estimator", header: "Estimator" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

const quotationColumns: ColumnDef<Quotation>[] = [
  { accessorKey: "code", header: "Code" },
  { accessorKey: "customerName", header: "Customer" },
  { accessorKey: "amount", header: "Amount", cell: ({ row }) => formatCurrency(row.original.amount) },
  { accessorKey: "validUntil", header: "Valid Until" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

const projectColumns: ColumnDef<Project>[] = [
  { accessorKey: "code", header: "Code" },
  { accessorKey: "name", header: "Project" },
  { accessorKey: "client", header: "Client" },
  { accessorKey: "manager", header: "Manager" },
  { accessorKey: "progress", header: "Progress", cell: ({ row }) => `${row.original.progress}%` },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

const employeeColumns: ColumnDef<Employee>[] = [
  { accessorKey: "code", header: "Code" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "department", header: "Department" },
  { accessorKey: "role", header: "Role" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

const vehicleColumns: ColumnDef<Vehicle>[] = [
  { accessorKey: "code", header: "Code" },
  { accessorKey: "registrationNo", header: "Registration" },
  { accessorKey: "type", header: "Type" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

const genericColumns: ColumnDef<Record<string, unknown>>[] = [
  { accessorKey: "code", header: "Code" },
  { accessorKey: "project", header: "Project" },
  { accessorKey: "supplier", header: "Supplier" },
  { accessorKey: "item", header: "Item" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "quantity", header: "Qty" },
  { accessorKey: "amount", header: "Amount", cell: ({ row }) => row.original.amount ? formatCurrency(Number(row.original.amount)) : "" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => row.original.status ? <StatusBadge status={String(row.original.status)} /> : "" },
];

function useModuleQuery(kind: ModuleKind) {
  return useQuery({
    queryKey: ["module", kind],
    queryFn: async () => {
      if (kind === "leads") return { rows: await getLeads(), columns: leadColumns };
      if (kind === "estimations") return { rows: await getEstimations(), columns: estimationColumns };
      if (kind === "quotations") return { rows: await getQuotations(), columns: quotationColumns };
      if (kind === "projects") return { rows: await getProjects(), columns: projectColumns };
      if (kind === "employees") return { rows: await getEmployees(), columns: employeeColumns };
      if (kind === "vehicles") return { rows: await getVehicles(), columns: vehicleColumns };
      if (kind === "stockRequests") return { rows: await getStockRequests(), columns: genericColumns };
      if (kind === "purchaseOrders") return { rows: await getPurchaseOrders(), columns: genericColumns };
      if (kind === "inventory") return { rows: await getInventory(), columns: genericColumns };
      return { rows: [], columns: genericColumns };
    },
  });
}

export function ModulePage({
  title,
  description,
  kind,
  createHref,
}: {
  title: string;
  description: string;
  kind: ModuleKind;
  createHref?: string;
}) {
  const { data, isLoading, error } = useModuleQuery(kind);

  return (
    <div className="grid gap-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          createHref ? (
            <Link
              href={createHref}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-3 text-sm font-semibold text-white hover:bg-cyan-800"
            >
              <Plus className="h-4 w-4" />
              New
            </Link>
          ) : null
        }
      />
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {(error as Error).message}
        </div>
      ) : null}
      <DataTable
        columns={(data?.columns ?? genericColumns) as ColumnDef<Record<string, unknown>>[]}
        data={(data?.rows ?? []) as Record<string, unknown>[]}
        loading={isLoading}
        enableExport
      />
    </div>
  );
}

export function SummaryPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid gap-6">
      <PageHeader title={title} description={description} />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Open items" value="12" delta="+3 this week" />
        <StatCard title="Pending approvals" value="4" />
        <StatCard title="Completed this month" value="9" delta="+18%" />
      </div>
      <div className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        This module scaffold is ready for real API integration and feature-specific forms.
      </div>
    </div>
  );
}
