"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { StatCard } from "@/components/cards/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { getEstimations } from "@/services/api/client/estimations.service";
import { getQuotations } from "@/services/api/client/quotations.service";

export function QsDashboardPage() {
  const { data: estimations = [] } = useQuery({ queryKey: ["estimations"], queryFn: () => getEstimations() });
  const { data: quotations = [] } = useQuery({ queryKey: ["quotations"], queryFn: () => getQuotations() });
  const chart = Object.values(
    estimations.reduce<Record<string, { engineer: string; count: number }>>((acc, item) => {
      acc[item.estimator] ??= { engineer: item.estimator, count: 0 };
      acc[item.estimator].count += 1;
      return acc;
    }, {}),
  );

  return (
    <div className="grid gap-6">
      <PageHeader title="QS Dashboard" description="Estimation workload, revisions, and quotation readiness." />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Pending Estimations" value={estimations.filter((item) => item.status === "draft" || item.status === "qs_estimation_pending").length} />
        <StatCard title="Revision Requests" value={quotations.filter((item) => item.status === "revision_requested").length} />
        <StatCard title="Quotations Awaiting Upload" value={estimations.filter((item) => item.status === "ready").length} />
        <StatCard title="Ready BOQs" value={estimations.filter((item) => item.boqLines.length > 0).length} />
      </div>
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-950">Estimations by Engineer</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="engineer" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#0e7490" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
