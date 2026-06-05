"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ROLES, roleLabels, type Role } from "@/constants/roles";
import { PERMISSIONS } from "@/lib/permissions";
import { getUsers } from "@/services/api/client/users.service";
import { DataTable } from "@/components/tables/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";

type AdminUser = {
  name: string;
  email: string;
  role: Role;
  status: "active" | "inactive";
  lastLogin: string;
  created: string;
};

const roleDescriptions: Record<Role, string> = Object.fromEntries(
  ROLES.map((role) => [role, `${roleLabels[role]} access profile for Skill Engineering ERP.`]),
) as Record<Role, string>;

const modules = ["dashboard", "marketing", "qs", "quotations", "projects", "stock", "hr", "vehicles", "accounting", "reports", "admin"];

const masterSets = {
  Departments: [["Projects", "DEP-PRJ", "4 linked records"], ["HR", "DEP-HR", "2 linked records"], ["Accounting", "DEP-ACC", "1 linked record"]],
  Positions: [["Project Manager", "Projects", "2 linked records"], ["QS Engineer", "QS", "1 linked record"]],
  "Work Roles": [["Site supervision", "Technical site supervision", "3 linked records"], ["Costing", "Quantity surveying", "1 linked record"]],
  "Expense Categories": [["Material", "5100", "6 linked records"], ["Transport", "5100", "2 linked records"]],
  "Payment Terms": [["30 days", "30", "4 linked records"], ["Advance + Progress", "0", "3 linked records"]],
  Sites: [["Colombo 02", "SITE-CMB2", "5 linked records"], ["Galle", "SITE-GAL", "3 linked records"]],
  "Unit of Measure": [["Meter", "m", "8 linked records"], ["Number", "nos", "12 linked records"]],
};

const auditRows = [
  { timestamp: "2026-06-04 08:30", user: "Nadun Perera", role: "super_admin", action: "login", module: "auth", recordId: "-", ip: "127.0.0.1" },
  { timestamp: "2026-06-04 09:12", user: "Dinithi Fernando", role: "marketing_executive", action: "record create", module: "marketing", recordId: "LEAD-1011", ip: "127.0.0.1" },
  { timestamp: "2026-06-04 10:20", user: "Sajith Kumara", role: "qs_engineer", action: "status change", module: "qs", recordId: "EST-2002", ip: "127.0.0.1" },
  { timestamp: "2026-06-04 11:05", user: "Kasun Jayasinghe", role: "project_manager", action: "approval action", module: "stock", recordId: "SR-5003", ip: "127.0.0.1" },
  { timestamp: "2026-06-04 12:00", user: "Unknown", role: "-", action: "failed auth attempt", module: "auth", recordId: "-", ip: "10.0.0.14" },
];

export function AdminUsersPage() {
  const [toast, setToast] = useState<string | null>(null);
  const { data: users = [], isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: getUsers });
  const adminUsers: AdminUser[] = users.map((user) => ({
    name: user.name,
    email: user.email,
    role: user.role,
    status: "active",
    lastLogin: "-",
    created: "-",
  }));
  const columns: ColumnDef<AdminUser>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "role", header: "Role", cell: ({ row }) => roleLabels[row.original.role] },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "lastLogin", header: "Last Login" },
    { accessorKey: "created", header: "Created" },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <button onClick={() => setToast(`Mock password reset email sent to ${row.original.email}.`)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold">
          Reset Password
        </button>
      ),
    },
  ];
  return (
    <div className="grid gap-6">
      {toast ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{toast}</div> : null}
      <PageHeader title="User Management" description="Create users, change roles, reset passwords, and deactivate accounts." actions={<button className="h-10 rounded-md bg-cyan-700 px-3 text-sm font-semibold text-white">Create User</button>} />
      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-5">
          <input placeholder="Name" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
          <input placeholder="Email" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
          <input placeholder="Temp password" type="password" autoComplete="off" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
          <select className="h-10 rounded-md border border-slate-300 px-3 text-sm">{ROLES.map((role) => <option key={role}>{role}</option>)}</select>
          <select className="h-10 rounded-md border border-slate-300 px-3 text-sm"><option>active</option><option>inactive</option></select>
        </div>
      </section>
      <DataTable columns={columns} data={adminUsers} loading={isLoading} enableExport />
      <p className="text-sm text-slate-500">Users cannot be deleted; deactivate instead.</p>
    </div>
  );
}

export function AdminRolesPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Role Management" description="Role descriptions and live permission matrix. Super Admin is immutable." />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {ROLES.map((role) => (
          <article key={role} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-slate-950">{roleLabels[role]}</h2>
            <p className="mt-1 text-sm text-slate-500">{roleDescriptions[role]}</p>
            {role === "super_admin" ? <p className="mt-2 text-xs font-semibold text-cyan-800">Immutable</p> : null}
          </article>
        ))}
      </div>
      <section className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[1200px] text-left text-sm">
          <thead className="bg-slate-50">
            <tr><th className="px-3 py-2">Module</th>{ROLES.map((role) => <th key={role} className="px-3 py-2 text-xs">{role}</th>)}</tr>
          </thead>
          <tbody>
            {modules.map((module) => (
              <tr key={module} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium">{module}</td>
                {ROLES.map((role) => {
                  const checked = PERMISSIONS[role].modules.includes("*") || PERMISSIONS[role].modules.includes(module);
                  return <td key={role} className="px-3 py-2"><input type="checkbox" checked={checked} disabled={role === "super_admin"} readOnly /></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className="text-sm text-slate-500">Permission changes apply immediately in mock by invalidating the session cache placeholder.</p>
    </div>
  );
}

export function MasterDataPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Master Data" description="Departments, positions, work roles, expense categories, payment terms, sites, and units." />
      {Object.entries(masterSets).map(([title, rows]) => (
        <section key={title} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-950">{title}</h2>
            <button className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold">Add</button>
          </div>
          <div className="grid gap-2">
            {rows.map(([a, b, linked]) => (
              <div key={`${title}-${a}`} className="grid gap-2 rounded-md bg-slate-50 p-3 text-sm md:grid-cols-[1fr_1fr_160px_120px]">
                <span>{a}</span><span>{b}</span><span>{linked}</span><button className="text-left font-semibold text-orange-700">Deactivate</button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">Cannot delete if in use; deactivate only.</p>
        </section>
      ))}
    </div>
  );
}

export function AuditLogPage() {
  const columns: ColumnDef<(typeof auditRows)[number]>[] = [
    { accessorKey: "timestamp", header: "Timestamp" },
    { accessorKey: "user", header: "User" },
    { accessorKey: "role", header: "Role" },
    { accessorKey: "action", header: "Action" },
    { accessorKey: "module", header: "Module" },
    { accessorKey: "recordId", header: "Record ID" },
    { accessorKey: "ip", header: "IP Address" },
  ];
  return (
    <div className="grid gap-6">
      <PageHeader title="Audit Log" description="Read-only audit trail for auth, mutations, status changes, approvals, and file downloads." actions={<button className="h-10 rounded-md border border-slate-300 px-3 text-sm font-semibold">Export Audit Log</button>} />
      <section className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <input placeholder="User" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
        <input placeholder="Module" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
        <input type="date" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
        <input placeholder="Action type" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
      </section>
      <DataTable columns={columns} data={auditRows} enableExport />
    </div>
  );
}
