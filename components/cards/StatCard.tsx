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
    <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(16,45,54,0.04)] transition-shadow hover:shadow-[0_12px_36px_rgba(16,45,54,0.09)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-4 text-[clamp(1.4rem,2vw,2rem)] font-bold tracking-tight text-[#102d36]">{value}</p>
        </div>
        {Icon ? (
          <div className="rounded-xl bg-[#e9f5ef] p-2.5 text-[#257565]">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      {delta ? <p className="mt-3 text-xs font-medium text-emerald-700">{delta}</p> : null}
    </div>
  );

  if (!href) return content;
  return (
    <Link href={href} className={cn("block h-full transition-transform hover:-translate-y-1")}>
      {content}
    </Link>
  );
}
