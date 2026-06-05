"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { FileUp, MessageSquarePlus, Phone, Mail, Users, Send, XCircle, Pencil } from "lucide-react";
import { useState } from "react";
import { ActivityTimeline } from "@/components/shared/ActivityTimeline";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable } from "@/components/tables/DataTable";
import { PriorityBadge } from "@/components/marketing/LeadListPage";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermission } from "@/hooks/usePermission";
import { formatCurrency } from "@/lib/utils";
import { getLeadDetail, sendLeadToQs, updateLeadStatus } from "@/services/mock/leads.service";
import type { CommunicationEntry, EntityStatus, Estimation, Lead, Quotation } from "@/types";

const tabs = ["Overview", "Estimations", "Quotations", "Communication", "Notes", "Attachments", "Timeline"] as const;

const statusFlow: EntityStatus[] = [
  "new",
  "under_review",
  "qs_estimation_pending",
  "quotation_submitted",
  "client_discussion",
  "approved",
  "closed",
];

export function LeadDetailPage({ id }: { id: string }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { can } = usePermission();
  const { role } = useCurrentUser();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["lead-detail", id], queryFn: () => getLeadDetail(id) });
  const lead = data?.lead;

  const sendMutation = useMutation({
    mutationFn: () => sendLeadToQs(id),
    onSuccess: () => {
      setToast("Lead sent to QS.");
      queryClient.invalidateQueries({ queryKey: ["lead-detail", id] });
    },
  });
  const statusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: EntityStatus; reason?: string }) => updateLeadStatus(id, status, reason),
    onSuccess: () => {
      setToast("Lead status updated.");
      queryClient.invalidateQueries({ queryKey: ["lead-detail", id] });
    },
  });

  if (isLoading) return <LoadingSkeleton className="h-64 w-full" />;
  if (error || !lead || !data) return <EmptyState title="Lead not found" description="The requested lead could not be loaded." />;

  const roleIsMarketing = role === "super_admin" || role === "marketing_manager" || role === "marketing_executive";
  const roleIsManager = role === "super_admin" || role === "marketing_manager";
  const canSend = roleIsMarketing && lead.status !== "qs_estimation_pending" && lead.status !== "quotation_submitted" && lead.status !== "approved" && lead.status !== "closed";
  const nextStatus = getNextStatus(lead.status);

  return (
    <div className="grid gap-6">
      {toast ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{toast}</div> : null}
      <PageHeader
        title={`${lead.code} - ${lead.title}`}
        description={`${lead.customerName} / ${lead.projectLocation}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {can("edit", "lead") ? <ActionButton icon={Pencil} label="Edit" /> : null}
            {roleIsMarketing ? (
              <button type="button" disabled={!canSend} title={!canSend ? "Lead is already in QS, quotation, approved, or closed state." : undefined} onClick={() => sendMutation.mutate()} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45">
                <Send className="h-4 w-4" />
                Send to QS
              </button>
            ) : null}
            {roleIsManager && nextStatus ? (
              <button type="button" onClick={() => statusMutation.mutate({ status: nextStatus })} className="inline-flex h-10 items-center rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Change Status
              </button>
            ) : roleIsManager ? (
              <button type="button" disabled title="No valid forward transition is available." className="inline-flex h-10 items-center rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 opacity-45">
                Change Status
              </button>
            ) : null}
            <ActionButton icon={MessageSquarePlus} label="Add Note" />
            <ActionButton icon={FileUp} label="Upload Attachment" />
            {roleIsManager ? (
              <button type="button" onClick={() => setRejectOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50">
                <XCircle className="h-4 w-4" />
                Mark Rejected
              </button>
            ) : null}
          </div>
        }
      />
      <div className="flex flex-wrap gap-2">
        <StatusBadge status={lead.status} />
        <PriorityBadge priority={lead.priority} />
      </div>
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {tabs.map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={`border-b-2 px-3 py-2 text-sm font-semibold ${tab === item ? "border-cyan-700 text-cyan-800" : "border-transparent text-slate-500 hover:text-slate-950"}`}>
            {item}
          </button>
        ))}
      </div>
      {tab === "Overview" ? <Overview lead={lead} /> : null}
      {tab === "Estimations" ? <EstimationsTab rows={data.estimations} /> : null}
      {tab === "Quotations" ? <QuotationsTab rows={data.quotations} /> : null}
      {tab === "Communication" ? <CommunicationTab rows={data.communications} /> : null}
      {tab === "Notes" ? <ListCard title="Internal Notes" rows={data.notes.map((note) => `${note.createdAt} - ${note.author}: ${note.body}`)} /> : null}
      {tab === "Attachments" ? <ListCard title="Attachments" rows={data.attachments.map((item) => `${item.name} (${item.type}) uploaded by ${item.uploader} on ${item.date}`)} /> : null}
      {tab === "Timeline" ? <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"><ActivityTimeline items={data.timeline} /></section> : null}
      <ConfirmDialog
        open={rejectOpen}
        title="Reject lead"
        message="A rejection reason is required. This mock dialog records a standard rejection reason."
        destructive
        onCancel={() => setRejectOpen(false)}
        onConfirm={() => {
          setRejectOpen(false);
          statusMutation.mutate({ status: "rejected", reason: "Rejected by marketing manager." });
        }}
      />
    </div>
  );
}

function getNextStatus(status: EntityStatus) {
  const index = statusFlow.indexOf(status);
  if (index < 0 || index >= statusFlow.length - 1) return undefined;
  return statusFlow[index + 1];
}

function ActionButton({ icon: Icon, label }: { icon: typeof Pencil; label: string }) {
  return (
    <button type="button" className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function Overview({ lead }: { lead: Lead }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <InfoCard title="Lead Summary" items={[["Project Type", lead.projectType], ["Budget", lead.estimatedBudgetRange || formatCurrency(lead.value)], ["Source", lead.source], ["Tags", lead.tags.join(", ")]]} />
      <InfoCard title="Customer" items={[["Name", lead.customerName], ["Company", lead.companyName || "-"], ["Phone", lead.phone], ["Email", lead.email || "-"]]} />
      <InfoCard title="Assigned Owner" items={[["Owner", lead.owner], ["Priority", lead.priority], ["Created", lead.createdAt], ["Updated", lead.updatedAt]]} />
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
        <h2 className="text-base font-semibold text-slate-950">Requirements</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{lead.requirementDescription}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <p className="text-sm text-slate-600"><span className="font-semibold text-slate-800">Drawing:</span> {lead.drawingRequirements || "-"}</p>
          <p className="text-sm text-slate-600"><span className="font-semibold text-slate-800">Construction:</span> {lead.constructionRequirements || "-"}</p>
        </div>
      </section>
    </div>
  );
}

function InfoCard({ title, items }: { title: string; items: string[][] }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <dl className="mt-4 grid gap-3">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-medium uppercase text-slate-500">{label}</dt>
            <dd className="mt-1 text-sm text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function EstimationsTab({ rows }: { rows: Estimation[] }) {
  const columns: ColumnDef<Estimation>[] = [
    { accessorKey: "code", header: "Code", cell: ({ row }) => <Link className="font-medium text-cyan-800" href={`/qs/estimations/${row.original.id}`}>{row.original.code}</Link> },
    { accessorKey: "estimator", header: "Engineer" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "grandTotal", header: "Grand Total", cell: ({ row }) => formatCurrency(row.original.grandTotal) },
  ];
  return <DataTable columns={columns} data={rows} enableExport />;
}

function QuotationsTab({ rows }: { rows: Quotation[] }) {
  const columns: ColumnDef<Quotation>[] = [
    { accessorKey: "code", header: "Code", cell: ({ row }) => <Link className="font-medium text-cyan-800" href={`/quotations/${row.original.id}`}>{row.original.code}</Link> },
    { accessorKey: "version", header: "Version", cell: ({ row }) => `v${row.original.version}` },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "grandTotal", header: "Grand Total", cell: ({ row }) => formatCurrency(row.original.grandTotal) },
    { accessorKey: "sentDate", header: "Sent Date" },
  ];
  return <DataTable columns={columns} data={rows} enableExport />;
}

function CommunicationTab({ rows }: { rows: CommunicationEntry[] }) {
  const [summary, setSummary] = useState("");
  const iconMap = { call: Phone, email: Mail, meeting: Users, whatsapp: Phone, note: MessageSquarePlus };
  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Add communication</h2>
        <div className="mt-4 grid gap-3">
          <select className="h-10 rounded-md border border-slate-300 px-3 text-sm"><option>call</option><option>email</option><option>meeting</option><option>WhatsApp</option><option>note</option></select>
          <textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Summary" rows={4} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input type="date" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
          <input type="date" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
          <input placeholder="Next action owner" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
          <button type="button" className="h-10 rounded-md bg-cyan-700 px-3 text-sm font-semibold text-white">Add Entry</button>
        </div>
      </section>
      <section className="grid gap-3">
        {rows.map((row) => {
          const Icon = iconMap[row.type];
          const upcoming = row.nextActionDate && new Date(row.nextActionDate).getTime() >= Date.now();
          return (
            <article key={row.id} className={`rounded-md border bg-white p-4 shadow-sm ${upcoming ? "border-yellow-300" : "border-slate-200"}`}>
              <div className="flex items-start gap-3">
                <Icon className="mt-1 h-4 w-4 text-cyan-700" />
                <div>
                  <p className="line-clamp-2 text-sm font-medium text-slate-950">{row.summary}</p>
                  <p className="mt-1 text-xs text-slate-500">{row.discussedAt} / {row.owner}</p>
                  {row.nextActionDate ? <p className="mt-2 text-xs font-semibold text-yellow-700">Follow up {row.nextActionDate} with {row.nextActionOwner}</p> : null}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function ListCard({ title, rows }: { title: string; rows: string[] }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 grid gap-3">
        {rows.length ? rows.map((row) => <p key={row} className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">{row}</p>) : <EmptyState title="No records" description="Nothing has been added yet." />}
      </div>
    </section>
  );
}
