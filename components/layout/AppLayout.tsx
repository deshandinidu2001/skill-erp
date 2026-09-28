"use client";

import { useState } from "react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, role, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f6f8fb] p-8">
        <LoadingSkeleton className="h-20 w-full max-w-xl" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8fb]">
      <Sidebar role={role} collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Header user={user} onMenuClick={() => setMobileOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-6 p-5 sm:p-7 lg:p-10">
            <Breadcrumb />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
