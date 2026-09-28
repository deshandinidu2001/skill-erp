"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { titleCase } from "@/lib/utils";

export function Breadcrumb() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const visibleParts = parts[0] === "dashboard" ? parts.slice(1) : parts;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs font-medium text-slate-500">
      <Link href="/dashboard" className="hover:text-slate-950">
        Dashboard
      </Link>
      {visibleParts.map((part, index) => {
        const href = `/${parts.slice(0, index + (parts[0] === "dashboard" ? 2 : 1)).join("/")}`;
        const isLast = index === visibleParts.length - 1;
        return (
          <span key={`${part}-${index}`} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            {isLast ? (
              <span className="font-medium text-slate-700">{titleCase(part)}</span>
            ) : (
              <Link href={href} className="hover:text-slate-950">
                {titleCase(part)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
