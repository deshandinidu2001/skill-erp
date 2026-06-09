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
  const [leads, projects, stockRequests] = await Promise.all([
    getLeads(),
    getProjects(),
    getStockRequests(),
  ]);
  const pipeline = leads.reduce((total, lead) => total + lead.value, 0);

  return (
    <div className="grid gap-6">
      <PageHeader title="Dashboard" description="Operational snapshot for Skill Engineering." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Lead pipeline" value={formatCurrency(pipeline)} icon={Megaphone} href="/marketing/leads" />
        <StatCard title="Active projects" value={projects.filter((item) => item.status !== "completed").length} icon={FolderKanban} href="/projects" />
        <StatCard title="Stock requests" value={stockRequests.length} icon={Package} href="/stock/requests" />
        <StatCard title="Reports ready" value="10" icon={BarChart3} href="/reports" />
      </div>
      <section className="grid gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-base font-semibold text-slate-950">Recent leads</h2>
          <div className="grid gap-3">
            {leads.slice(0, 3).map((lead) => (
              <EntityCard key={lead.id} title={lead.title} subtitle={lead.customerName} status={lead.status} meta={formatCurrency(lead.value)} />
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-base font-semibold text-slate-950">Project progress</h2>
          <div className="grid gap-3">
            {projects.slice(0, 3).map((project) => (
              <EntityCard key={project.id} title={project.name} subtitle={`${project.client} - ${project.progress}%`} status={project.status} meta={project.site} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
