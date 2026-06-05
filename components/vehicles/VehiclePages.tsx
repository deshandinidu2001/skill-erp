"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus } from "lucide-react";
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
import { getVehicleById, getVehicles, requiresAssignmentWarning } from "@/services/mock/vehicles.service";
import type { FuelLog, MaintenanceLog, MeterLog, Vehicle, VehicleAssignment } from "@/types";

export function VehicleListPage() {
  const { role } = useCurrentUser();
  const { data = [], isLoading } = useQuery({ queryKey: ["vehicles"], queryFn: () => getVehicles() });
  const [filters, setFilters] = useState({ status: "", category: "", project: "" });
  const rows = useMemo(() => data.filter((v) => (!filters.status || v.status === filters.status) && (!filters.category || v.category === filters.category) && (!filters.project || v.currentProject === filters.project)), [data, filters]);
  const columns: ColumnDef<Vehicle>[] = [
    { accessorKey: "code", header: "Code", cell: ({ row }) => <Link className="font-semibold text-cyan-800" href={`/vehicles/${row.original.id}`}>{row.original.code}</Link> },
    { accessorKey: "registrationNo", header: "Reg Number" },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "currentProject", header: "Current Project" },
    { accessorKey: "meterReading", header: "Meter Reading" },
    { accessorKey: "insuranceExpiry", header: "Insurance Expiry", cell: ({ row }) => <span className={expiringSoon(row.original.insuranceExpiry) || expiringSoon(row.original.licenseExpiry) ? "font-semibold text-orange-700" : ""}>{row.original.insuranceExpiry}</span> },
  ];
  const canCreate = role === "vehicle_manager" || role === "super_admin";
  return (
    <div className="grid gap-6">
      <PageHeader title="Vehicles" description="Fleet availability, assignments, documents, meter, fuel, and maintenance logs." actions={canCreate ? <Link href="/vehicles/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-3 text-sm font-semibold text-white"><Plus className="h-4 w-4" />New Vehicle</Link> : null} />
      <div className="grid gap-4 md:grid-cols-4"><StatCard title="Total" value={data.length} /><StatCard title="Available" value={data.filter((v) => v.status === "available").length} /><StatCard title="Assigned" value={data.filter((v) => v.status === "assigned").length} /><StatCard title="Under Maintenance" value={data.filter((v) => v.status === "maintenance").length} /></div>
      <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-3"><FilterSelect label="Status" value={filters.status} options={["", ...Array.from(new Set(data.map((v) => v.status)))]} onChange={(status) => setFilters((p) => ({ ...p, status }))} /><FilterSelect label="Category" value={filters.category} options={["", ...Array.from(new Set(data.map((v) => v.category ?? "")))]} onChange={(category) => setFilters((p) => ({ ...p, category }))} /><FilterSelect label="Project" value={filters.project} options={["", ...Array.from(new Set(data.map((v) => v.currentProject ?? "").filter(Boolean)))]} onChange={(project) => setFilters((p) => ({ ...p, project }))} /></div>
      <DataTable columns={columns} data={rows} loading={isLoading} enableExport />
    </div>
  );
}

const vehicleSchema = z.object({
  registrationNumber: z.string().min(2, "Registration number is required"),
  vehicleCode: z.string().min(1, "Vehicle code is required"),
  category: z.enum(["car", "van", "truck", "machinery", "other"]),
  ownershipStatus: z.enum(["owned", "leased"]),
  currentStatus: z.enum(["available", "assigned", "maintenance", "unavailable", "retired"]),
  insuranceExpiry: z.string().min(1, "Insurance expiry is required"),
  licenseExpiry: z.string().min(1, "License expiry is required"),
  currentMeterReading: z.coerce.number().min(0),
  notes: z.string().optional(),
});

export function VehicleFormPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<z.input<typeof vehicleSchema>, unknown, z.output<typeof vehicleSchema>>({ resolver: zodResolver(vehicleSchema), defaultValues: { category: "truck", ownershipStatus: "owned", currentStatus: "available" } });
  const [toast, setToast] = useState<string | null>(null);
  return <div className="grid gap-6">{toast ? <div className="rounded-md border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-800">{toast}</div> : null}<PageHeader title="New Vehicle" description="Create vehicle master record with expiry dates and meter reading." /><form onSubmit={handleSubmit((v) => setToast(`Validated ${v.registrationNumber}.`))}><FormSection title="Vehicle Details"><div className="grid gap-4 md:grid-cols-2"><FormField label="Vehicle Code" error={errors.vehicleCode?.message} {...register("vehicleCode")} /><FormField label="Registration Number" error={errors.registrationNumber?.message} {...register("registrationNumber")} /><FormSelect label="Category" options={["car", "van", "truck", "machinery", "other"]} {...register("category")} /><FormSelect label="Ownership" options={["owned", "leased"]} {...register("ownershipStatus")} /><FormSelect label="Status" options={["available", "assigned", "maintenance", "unavailable", "retired"]} {...register("currentStatus")} /><FormField label="Insurance Expiry" type="date" error={errors.insuranceExpiry?.message} {...register("insuranceExpiry")} /><FormField label="License Expiry" type="date" error={errors.licenseExpiry?.message} {...register("licenseExpiry")} /><FormField label="Meter Reading" type="number" error={errors.currentMeterReading?.message} {...register("currentMeterReading")} /><FormField label="Notes" error={errors.notes?.message} {...register("notes")} /></div></FormSection><button className="mt-4 h-10 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white">Save Vehicle</button></form></div>;
}

export function VehicleDetailPage({ id }: { id: string }) {
  const { role } = useCurrentUser();
  const [tab, setTab] = useState("Overview");
  const { data } = useQuery({ queryKey: ["vehicle", id], queryFn: () => getVehicleById(id) });
  if (!data) return <EmptyState title="Vehicle not found" description="The vehicle could not be loaded." />;
  const { vehicle } = data;
  const canAct = role === "vehicle_manager" || role === "super_admin";
  return (
    <div className="grid gap-6">
      {requiresAssignmentWarning(vehicle) ? <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-medium text-orange-700">Warning: assigning a vehicle under maintenance or unavailable requires confirmation.</div> : null}
      <PageHeader title={`${vehicle.registrationNo} - ${vehicle.category ?? vehicle.type}`} description={`Meter ${vehicle.meterReading ?? 0}`} actions={canAct ? <div className="flex flex-wrap gap-2">{["Assign to Project", "Log Meter Reading", "Log Maintenance", "Log Fuel", "Update Status", "Upload Document"].map((a) => <button key={a} className="h-10 rounded-md border border-slate-300 px-3 text-sm font-semibold">{a}</button>)}</div> : null} />
      <StatusBadge status={vehicle.status} />
      <Tabs tabs={["Overview", "Assignments", "Meter History", "Maintenance", "Fuel Logs", "Documents", "Timeline"]} active={tab} setActive={setTab} />
      {tab === "Overview" ? <Info rows={[["Current Assignment", vehicle.currentProject || "-"], ["Insurance Expiry", vehicle.insuranceExpiry ?? "-"], ["License Expiry", vehicle.licenseExpiry ?? "-"], ["Meter Reading", String(vehicle.meterReading ?? 0)], ["Status", vehicle.status]]} /> : null}
      {tab === "Assignments" ? <AssignmentTable rows={data.assignments} /> : null}
      {tab === "Meter History" ? <MeterTable rows={data.meterLogs} /> : null}
      {tab === "Maintenance" ? <MaintenanceTable rows={data.maintenanceLogs} /> : null}
      {tab === "Fuel Logs" ? <FuelTable rows={data.fuelLogs} /> : null}
      {tab === "Documents" ? <section className="rounded-md border border-slate-200 bg-white p-5 text-sm shadow-sm">Insurance cert, license, and other documents upload grid.</section> : null}
      {tab === "Timeline" ? <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"><ActivityTimeline items={data.timeline} /></section> : null}
    </div>
  );
}

function expiringSoon(date?: string) {
  if (!date) return false;
  const diff = new Date(date).getTime() - Date.now();
  return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 30;
}

function Tabs({ tabs, active, setActive }: { tabs: string[]; active: string; setActive: (value: string) => void }) {
  return <div className="flex flex-wrap gap-2 border-b border-slate-200">{tabs.map((tab) => <button key={tab} onClick={() => setActive(tab)} className={`border-b-2 px-3 py-2 text-sm font-semibold ${active === tab ? "border-cyan-700 text-cyan-800" : "border-transparent text-slate-500"}`}>{tab}</button>)}</div>;
}

function Info({ rows }: { rows: string[][] }) {
  return <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"><dl className="grid gap-4 md:grid-cols-2">{rows.map(([label, value]) => <div key={label}><dt className="text-xs font-medium uppercase text-slate-500">{label}</dt><dd className="mt-1 text-sm text-slate-800">{value}</dd></div>)}</dl></section>;
}

function AssignmentTable({ rows }: { rows: VehicleAssignment[] }) {
  const columns: ColumnDef<VehicleAssignment>[] = [{ accessorKey: "project", header: "Project" }, { accessorKey: "site", header: "Site" }, { accessorKey: "from", header: "From" }, { accessorKey: "to", header: "To" }, { accessorKey: "notes", header: "Notes" }];
  return <DataTable columns={columns} data={rows} />;
}

function MeterTable({ rows }: { rows: MeterLog[] }) {
  const columns: ColumnDef<MeterLog>[] = [{ accessorKey: "date", header: "Date" }, { accessorKey: "reading", header: "Reading" }, { id: "diff", header: "Km Since Last", cell: ({ row }) => row.index === 0 ? "-" : row.original.reading - rows[row.index - 1].reading }, { accessorKey: "loggedBy", header: "Logged By" }];
  return <DataTable columns={columns} data={rows} />;
}

function MaintenanceTable({ rows }: { rows: MaintenanceLog[] }) {
  const columns: ColumnDef<MaintenanceLog>[] = [{ accessorKey: "date", header: "Date" }, { accessorKey: "type", header: "Type" }, { accessorKey: "description", header: "Description" }, { accessorKey: "cost", header: "Cost", cell: ({ row }) => formatCurrency(row.original.cost) }, { accessorKey: "nextDue", header: "Next Due" }];
  return <DataTable columns={columns} data={rows} />;
}

function FuelTable({ rows }: { rows: FuelLog[] }) {
  const columns: ColumnDef<FuelLog>[] = [{ accessorKey: "date", header: "Date" }, { accessorKey: "odometer", header: "Odometer" }, { accessorKey: "liters", header: "Liters" }, { accessorKey: "cost", header: "Cost", cell: ({ row }) => formatCurrency(row.original.cost) }, { accessorKey: "station", header: "Station" }];
  return <DataTable columns={columns} data={rows} />;
}

function FormSelect({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: string[] }) {
  return <label className="grid gap-1.5"><span className="text-sm font-medium text-slate-700">{label}</span><select {...props} className="h-10 rounded-md border border-slate-300 px-3 text-sm">{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="grid gap-1 text-xs font-medium uppercase text-slate-500">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-slate-300 px-2 text-sm normal-case text-slate-700">{options.map((o) => <option key={o || "all"} value={o}>{o || "All"}</option>)}</select></label>;
}
