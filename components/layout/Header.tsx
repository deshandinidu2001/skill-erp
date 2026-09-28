"use client";

import { signOut } from "next-auth/react";
import { LogOut, Menu, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { roleLabels, type Role } from "@/constants/roles";

type SearchResult = { label: string; type: string; href: string };

export function Header({
  user,
  onMenuClick,
}: {
  user?: { name?: string | null; email?: string | null; role?: Role };
  onMenuClick: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    if (!query.trim()) {
      setResults([]);
      return () => controller.abort();
    }
    const handle = window.setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
      if (res.ok) {
        const body = await res.json();
        setResults(body.results ?? []);
      }
    }, 200);
    return () => {
      window.clearTimeout(handle);
      controller.abort();
    };
  }, [query]);

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="flex h-[76px] items-center gap-4 px-5 sm:px-7 lg:px-10">
        <button type="button" onClick={onMenuClick} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-700 lg:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
        <div className="relative max-w-lg flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your workspace..."
            aria-label="Search workspace"
            className="h-11 w-full rounded-xl border border-slate-200 bg-[#f6f8fb] pl-11 pr-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-50"
          />
          {results.length > 0 ? (
            <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              {results.map((item) => (
                <a key={`${item.type}-${item.label}`} href={item.href} className="block px-3 py-2 hover:bg-slate-50">
                  <span className="block text-sm font-medium text-slate-950">{item.label}</span>
                  <span className="text-xs text-slate-500">{item.type}</span>
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <div className="ml-auto flex items-center gap-3 border-l border-slate-200 pl-4 sm:pl-5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#d9ebe5] text-sm font-bold text-[#155e58]">{(user?.name ?? "U").slice(0, 1).toUpperCase()}</div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-none text-slate-950">{user?.role ? roleLabels[user.role] : "Loading"}</p>
            <p className="mt-1 text-xs text-slate-500">Current role</p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg px-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
