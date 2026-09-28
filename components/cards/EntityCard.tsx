import { StatusBadge } from "@/components/shared/StatusBadge";

export function EntityCard({
  title,
  subtitle,
  status,
  meta,
}: {
  title: string;
  subtitle: string;
  status?: string;
  meta?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 transition-colors hover:border-teal-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {status ? <StatusBadge status={status} /> : null}
      </div>
      {meta ? <p className="mt-4 text-xs text-slate-500">{meta}</p> : null}
    </div>
  );
}
