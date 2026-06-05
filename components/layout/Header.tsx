"use client";

import { signOut } from "next-auth/react";
import { Bell, LogOut, Search, UserCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { employees, leads, projects } from "@/services/mock/seed";
import { roleLabels, type Role } from "@/constants/roles";
import { includesText } from "@/lib/utils";

export function Header({
  user,
}: {
  user?: { name?: string | null; email?: string | null; role?: Role };
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    if (!query.trim()) return [];
    return [
      ...leads.map((item) => ({ label: item.title, type: "Lead", href: `/marketing/leads/${item.id}` })),
      ...projects.map((item) => ({ label: item.name, type: "Project", href: `/projects/${item.id}` })),
      ...employees.map((item) => ({ label: item.name, type: "Employee", href: "/hr/employees" })),
    ]
      .filter((item) => includesText(item.label, query))
      .slice(0, 6);
  }, [query]);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        <div className="lg:hidden">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-cyan-700 text-sm font-bold text-white">
            SE
          </div>
        </div>
        <div className="relative max-w-xl flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search leads, projects, employees"
            className="h-10 w-full rounded-md border border-slate-300 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-cyan-600 focus:bg-white focus:ring-2 focus:ring-cyan-100"
          />
          {results.length > 0 ? (
            <div className="absolute left-0 right-0 top-11 z-30 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
              {results.map((item) => (
                <a key={`${item.type}-${item.label}`} href={item.href} className="block px-3 py-2 hover:bg-slate-50">
                  <span className="block text-sm font-medium text-slate-950">{item.label}</span>
                  <span className="text-xs text-slate-500">{item.type}</span>
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2">
          <UserCircle className="h-5 w-5 text-slate-500" />
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-none text-slate-950">{user?.name ?? "User"}</p>
            <p className="mt-1 text-xs text-slate-500">{user?.role ? roleLabels[user.role] : "Loading"}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-50"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
