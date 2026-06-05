import { ActivityTimeline } from "@/components/shared/ActivityTimeline";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";

export function DetailPage({ title, id }: { title: string; id: string }) {
  return (
    <div className="grid gap-6">
      <PageHeader title={title} description={`Reference ${id}`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Record summary</h2>
              <p className="mt-1 text-sm text-slate-500">Detailed workflows will attach here.</p>
            </div>
            <StatusBadge status="in_progress" />
          </div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Owner</dt>
              <dd className="mt-1 text-sm text-slate-950">Assigned team</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Last update</dt>
              <dd className="mt-1 text-sm text-slate-950">2026-06-04</dd>
            </div>
          </dl>
        </section>
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-950">Activity</h2>
          <ActivityTimeline
            items={[
              {
                actor: "System",
                action: "created the record",
                timestamp: "2026-06-03T08:30:00",
                summary: "Initial mock record activity.",
              },
              {
                actor: "Operations",
                action: "updated status",
                timestamp: "2026-06-04T10:15:00",
                summary: "Prepared for next workflow step.",
              },
            ]}
          />
        </section>
      </div>
    </div>
  );
}
