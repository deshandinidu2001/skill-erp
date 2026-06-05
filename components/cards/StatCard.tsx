import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  delta?: string;
  icon?: LucideIcon;
  href?: string;
};

export function StatCard({ title, value, delta, icon: Icon, href }: StatCardProps) {
  const content = (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
        {Icon ? (
          <div className="rounded-md bg-cyan-50 p-2 text-cyan-700">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      {delta ? <p className="mt-3 text-xs font-medium text-emerald-700">{delta}</p> : null}
    </div>
  );

  if (!href) return content;
  return (
    <Link href={href} className={cn("block transition hover:-translate-y-0.5 hover:shadow-md")}>
      {content}
    </Link>
  );
}
