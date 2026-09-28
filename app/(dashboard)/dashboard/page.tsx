import { BarChart3, FolderKanban, Megaphone, Package } from "lucide-react";
import { StatCard } from "@/components/cards/StatCard";
import { EntityCard } from "@/components/cards/EntityCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { getLeads } from "@/services/api/leads.service";
import { getProjects } from "@/services/api/projects.service";
import { getStockRequests } from "@/services/api/stock-requests.service";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [leadsResult, projectsResult, stockRequestsResult] = await Promise.allSettled([
    getLeads(),
    getProjects(),
    getStockRequests(),
  ]);
  const leads = leadsResult.status === "fulfilled" ? leadsResult.value : null;
  const projects = projectsResult.status === "fulfilled" ? projectsResult.value : null;
  const stockRequests = stockRequestsResult.status === "fulfilled" ? stockRequestsResult.value : null;
  const pipeline = leads?.reduce((total, lead) => total + lead.value, 0);
  const dataUnavailable = !leads || !projects || !stockRequests;

  return (
    <div className="grid gap-6">
      <PageHeader title="Dashboard" description="Operational snapshot for Skill Engineering." />
      {dataUnavailable ? (
        <div role="alert" className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Some dashboard data is unavailable. Check the Supabase connection and reload this page.
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Lead pipeline" value={pipeline === undefined ? "Unavailable" : formatCurrency(pipeline)} icon={Megaphone} href="/marketing/leads" />
        <StatCard title="Active projects" value={projects ? projects.filter((item) => item.status !== "completed").length : "Unavailable"} icon={FolderKanban} href="/projects" />
        <StatCard title="Stock requests" value={stockRequests?.length ?? "Unavailable"} icon={Package} href="/stock/requests" />
        <StatCard title="Reports ready" value="10" icon={BarChart3} href="/reports" />
      </div>
      <section className="grid gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-base font-semibold text-slate-950">Recent leads</h2>
          <div className="grid gap-3">
            {leads?.slice(0, 3).map((lead) => (
              <EntityCard key={lead.id} title={lead.title} subtitle={lead.customerName} status={lead.status} meta={formatCurrency(lead.value)} />
            ))}
            {!leads ? <p className="text-sm text-slate-500">Recent leads are unavailable.</p> : null}
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-base font-semibold text-slate-950">Project progress</h2>
          <div className="grid gap-3">
            {projects?.slice(0, 3).map((project) => (
              <EntityCard key={project.id} title={project.name} subtitle={`${project.client} - ${project.progress}%`} status={project.status} meta={project.site} />
            ))}
            {!projects ? <p className="text-sm text-slate-500">Project progress is unavailable.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
