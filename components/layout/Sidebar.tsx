"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  Calculator,
  Car,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  Megaphone,
  Package,
  ReceiptText,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { roleLabels, type Role } from "@/constants/roles";
import { hasModuleAccess } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  module: string;
  icon: LucideIcon;
  badge?: string;
  children?: Omit<NavItem, "icon" | "children">[];
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", module: "dashboard", icon: LayoutDashboard },
  {
    label: "Marketing",
    href: "/marketing/leads",
    module: "marketing",
    icon: Megaphone,
    badge: "10",
    children: [{ label: "Leads", href: "/marketing/leads", module: "marketing" }],
  },
  {
    label: "QS",
    href: "/qs",
    module: "qs",
    icon: Calculator,
    children: [
      { label: "Estimations", href: "/qs/estimations", module: "qs" },
      { label: "BOQ Import", href: "/qs/boq-import", module: "qs" },
    ],
  },
  { label: "Quotations", href: "/quotations", module: "quotations", icon: ReceiptText },
  { label: "Projects", href: "/projects", module: "projects", icon: FolderKanban, badge: "5" },
  {
    label: "Stock",
    href: "/stock/requests",
    module: "stock",
    icon: Package,
    children: [
      { label: "Items", href: "/stock/items", module: "stock" },
      { label: "Suppliers", href: "/stock/suppliers", module: "stock" },
      { label: "Requests", href: "/stock/requests", module: "stock" },
      { label: "Purchase Orders", href: "/stock/purchase-orders", module: "stock" },
      { label: "Goods Receipts", href: "/stock/goods-receipts", module: "stock" },
      { label: "Inventory", href: "/stock/inventory", module: "stock" },
    ],
  },
  {
    label: "HR",
    href: "/hr/employees",
    module: "hr",
    icon: Users,
    children: [
      { label: "Employees", href: "/hr/employees", module: "hr" },
      { label: "Attendance", href: "/hr/attendance", module: "hr" },
      { label: "Payroll", href: "/hr/payroll", module: "hr" },
    ],
  },
  { label: "Vehicles", href: "/vehicles", module: "vehicles", icon: Car },
  {
    label: "Accounting",
    href: "/accounting/ledger",
    module: "accounting",
    icon: BriefcaseBusiness,
    children: [
      { label: "Chart of Accounts", href: "/accounting/chart-of-accounts", module: "accounting" },
      { label: "Ledger", href: "/accounting/ledger", module: "accounting" },
      { label: "General Ledger", href: "/accounting/ledger/general", module: "accounting" },
      { label: "Cash Book", href: "/accounting/cash-book", module: "accounting" },
      { label: "Payments", href: "/accounting/payments", module: "accounting" },
      { label: "P&L", href: "/accounting/pnl", module: "accounting" },
      { label: "Debtors", href: "/accounting/debtors", module: "accounting" },
    ],
  },
  {
    label: "Reports",
    href: "/reports",
    module: "reports",
    icon: BarChart3,
    children: [
      { label: "Leads", href: "/reports/leads", module: "reports" },
      { label: "Quotations", href: "/reports/quotations", module: "reports" },
      { label: "Projects", href: "/reports/projects", module: "reports" },
      { label: "Payroll", href: "/reports/payroll", module: "reports" },
      { label: "Attendance", href: "/reports/attendance", module: "reports" },
      { label: "Stock", href: "/reports/stock", module: "reports" },
      { label: "Suppliers", href: "/reports/suppliers", module: "reports" },
      { label: "Vehicles", href: "/reports/vehicles", module: "reports" },
      { label: "Project P&L", href: "/reports/project-pnl", module: "reports" },
      { label: "Debtors", href: "/reports/debtors", module: "reports" },
    ],
  },
  {
    label: "Administration",
    href: "/admin/users",
    module: "admin",
    icon: ShieldCheck,
    children: [
      { label: "Users", href: "/admin/users", module: "admin" },
      { label: "Roles", href: "/admin/roles", module: "admin" },
      { label: "Master Data", href: "/admin/master-data", module: "admin" },
      { label: "Audit Log", href: "/admin/audit", module: "admin" },
    ],
  },
];

export function Sidebar({ role, collapsed, onToggle }: { role?: Role; collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const allowed = navItems.filter((item) => role && hasModuleAccess(role, item.module));

  return (
    <aside
      className={cn(
        "hidden h-screen shrink-0 overflow-hidden border-r border-slate-200 bg-white transition-all lg:flex lg:flex-col",
        collapsed ? "lg:w-20" : "lg:w-72",
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-cyan-700 text-sm font-bold text-white">
            SE
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">Skill Engineering</p>
              <p className="truncate text-xs text-slate-500">ERP</p>
            </div>
          ) : null}
        </Link>
        <button
          type="button"
          onClick={onToggle}
          className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
          aria-label="Toggle sidebar"
        >
          <ClipboardList className="h-4 w-4" />
        </button>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
        <nav className="grid gap-1">
          {allowed.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <div key={item.label}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                    active && "bg-cyan-50 text-cyan-800",
                    collapsed && "justify-center px-0",
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed ? <span className="flex-1 truncate">{item.label}</span> : null}
                  {!collapsed && item.badge ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
                {!collapsed && item.children ? (
                  <div className="ml-7 mt-1 grid gap-1 border-l border-slate-200 pl-3">
                    {item.children.filter((child) => canShowChild(role, child.href)).map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        className={cn(
                          "rounded-md px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-950",
                          pathname === child.href && "font-medium text-cyan-800",
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </div>
      {!collapsed ? (
        <div className="shrink-0 border-t border-slate-200 p-4 text-xs text-slate-500">
          Current access: {role ? roleLabels[role] : "Loading"}
        </div>
      ) : null}
    </aside>
  );
}

function canShowChild(role: Role | undefined, href: string) {
  if (!role || !href.startsWith("/stock")) return true;
  if (role === "super_admin" || role === "stock_manager") return true;
  if (role === "store_keeper") return href === "/stock/goods-receipts" || href === "/stock/inventory";
  if (role === "project_manager") return href === "/stock/requests";
  if (role === "qs_manager" || role === "qs_engineer") return href === "/stock/requests";
  if (role === "finance_manager") return href === "/stock/purchase-orders";
  return true;
}
