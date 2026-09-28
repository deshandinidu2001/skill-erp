import Link from "next/link";
import { ArrowUpRight, BarChart3, FolderKanban, Megaphone, Package, Plus } from "lucide-react";
import { StatCard } from "@/components/cards/StatCard";
import { EntityCard } from "@/components/cards/EntityCard";
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
    <div className="grid gap-7">
      <div className="flex flex-col gap-5 rounded-[28px] bg-[#102d36] p-6 text-white shadow-[0_20px_50px_rgba(16,45,54,0.12)] sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#c6f36b]">Overview</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your work, at a glance.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Track your pipeline, projects, and stock from one workspace.</p>
        </div>
        <Link href="/marketing/leads/new" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-[#c6f36b] px-4 text-sm font-bold text-[#102d36] transition hover:bg-[#d7fa97] lg:self-auto"><Plus className="h-4 w-4" />New lead</Link>
      </div>
      {dataUnavailable ? (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Some dashboard data is unavailable. Check the Supabase connection and reload this page.
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Lead pipeline" value={pipeline === undefined ? "Unavailable" : formatCurrency(pipeline)} icon={Megaphone} href="/marketing/leads" />
        <StatCard title="Active projects" value={projects ? projects.filter((item) => item.status !== "completed").length : "Unavailable"} icon={FolderKanban} href="/projects" />
        <StatCard title="Stock requests" value={stockRequests?.length ?? "Unavailable"} icon={Package} href="/stock/requests" />
        <StatCard title="Report categories" value="10" icon={BarChart3} href="/reports" />
      </div>
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(16,45,54,0.04)] sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-lg font-bold tracking-tight text-[#102d36]">Recent leads</h2><Link href="/marketing/leads" className="inline-flex items-center gap-1 text-xs font-semibold text-[#257565] hover:underline">View all <ArrowUpRight className="h-3.5 w-3.5" /></Link></div>
          <div className="grid gap-2.5">
            {leads?.slice(0, 3).map((lead) => (
              <EntityCard key={lead.id} title={lead.title} subtitle={lead.customerName} status={lead.status} meta={formatCurrency(lead.value)} />
            ))}
            {!leads ? <p className="text-sm text-slate-500">Recent leads are unavailable.</p> : null}
            {leads?.length === 0 ? <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No leads yet. New leads will appear here.</p> : null}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(16,45,54,0.04)] sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-lg font-bold tracking-tight text-[#102d36]">Project progress</h2><Link href="/projects" className="inline-flex items-center gap-1 text-xs font-semibold text-[#257565] hover:underline">View all <ArrowUpRight className="h-3.5 w-3.5" /></Link></div>
          <div className="grid gap-2.5">
            {projects?.slice(0, 3).map((project) => (
              <EntityCard key={project.id} title={project.name} subtitle={`${project.client} - ${project.progress}%`} status={project.status} meta={project.site} />
            ))}
            {!projects ? <p className="text-sm text-slate-500">Project progress is unavailable.</p> : null}
            {projects?.length === 0 ? <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No projects yet. Active work will appear here.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
