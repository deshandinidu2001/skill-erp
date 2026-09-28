"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  Calculator,
  Car,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  LayoutDashboard,
  Megaphone,
  X,
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
  children?: Omit<NavItem, "icon" | "children">[];
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", module: "dashboard", icon: LayoutDashboard },
  {
    label: "Marketing",
    href: "/marketing/leads",
    module: "marketing",
    icon: Megaphone,
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
  { label: "Projects", href: "/projects", module: "projects", icon: FolderKanban },
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

export function Sidebar({ role, collapsed, onToggle, mobileOpen, onClose }: { role?: Role; collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const allowed = navItems.filter((item) => role && hasModuleAccess(role, item.module));

  const sidebar = (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col overflow-hidden bg-[#102d36] text-slate-200 transition-all",
        collapsed && !mobileOpen ? "lg:w-[88px]" : "w-[268px]",
      )}
    >
      <div className={cn("relative flex h-[76px] shrink-0 items-center justify-between border-b border-white/10 px-5", collapsed && !mobileOpen && "justify-center px-0")}>
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3 overflow-hidden">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#c6f36b] text-sm font-black tracking-tight text-[#102d36]">
            SE
          </div>
          {(!collapsed || mobileOpen) ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-white">Skill Engineering</p>
              <p className="truncate text-[11px] uppercase tracking-[0.18em] text-slate-400">Workspace</p>
            </div>
          ) : null}
        </Link>
        <button
          type="button"
          onClick={onToggle}
          className={cn("hidden h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white lg:grid", collapsed && !mobileOpen && "absolute right-1")}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-300 hover:bg-white/10 lg:hidden" aria-label="Close menu"><X className="h-5 w-5" /></button>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-6">
        {(!collapsed || mobileOpen) ? <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Navigation</p> : null}
        <nav className="grid gap-1.5" aria-label="Main navigation">
          {allowed.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`) || item.children?.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`));
            const Icon = item.icon;
            return (
              <div key={item.label}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white",
                    active && "bg-[#c6f36b] font-semibold text-[#102d36] hover:bg-[#d5fa91] hover:text-[#102d36]",
                    collapsed && !mobileOpen && "justify-center px-0",
                  )}
                  title={collapsed && !mobileOpen ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {(!collapsed || mobileOpen) ? <span className="flex-1 truncate">{item.label}</span> : null}
                </Link>
                {(!collapsed || mobileOpen) && active && item.children ? (
                  <div className="ml-5 mt-1 grid gap-0.5 border-l border-white/15 pl-5">
                    {item.children.filter((child) => canShowChild(role, child.href)).map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        onClick={onClose}
                        className={cn(
                          "rounded-lg px-2 py-1.5 text-sm text-slate-400 hover:bg-white/10 hover:text-white",
                          pathname === child.href && "font-semibold text-[#c6f36b]",
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
      {(!collapsed || mobileOpen) ? (
        <div className="shrink-0 border-t border-white/10 p-5 text-xs text-slate-400">
          <span className="mb-1 block uppercase tracking-[0.16em]">Signed in as</span>
          <span className="font-medium text-white">{role ? roleLabels[role] : "Loading"}</span>
        </div>
      ) : null}
    </aside>
  );

  return (
    <>
      <div className={cn("fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden", mobileOpen ? "block" : "hidden")} onClick={onClose} />
      <div className={cn("fixed inset-y-0 left-0 z-50 w-[268px] transition-all lg:static lg:z-auto lg:translate-x-0", collapsed ? "lg:w-[88px]" : "lg:w-[268px]", mobileOpen ? "translate-x-0" : "-translate-x-full")}>{sidebar}</div>
    </>
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
