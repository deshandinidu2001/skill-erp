"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { FileText, FolderPlus } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { ActivityTimeline } from "@/components/shared/ActivityTimeline";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable } from "@/components/tables/DataTable";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermission } from "@/hooks/usePermission";
import { formatCurrency } from "@/lib/utils";
import { createFromQuotation } from "@/services/api/client/projects.service";
import { getQuotationById, getQuotations, markQuotationStatus } from "@/services/api/client/quotations.service";
import type { Attachment, BoqLine, ClientResponse, Quotation } from "@/types";

const tabs = ["Summary", "BOQ", "Versions", "Client Response", "Attachments", "Timeline"] as const;

export function QuotationDetailPage({ id }: { id: string }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Summary");
  const [approveOpen, setApproveOpen] = useState(false);
  const [toast, setToast] = useState<ReactNode>(null);
  const { can } = usePermission();
  const { role } = useCurrentUser();
  const queryClient = useQueryClient();
  const { data: quotation, isLoading } = useQuery({ queryKey: ["quotation", id], queryFn: () => getQuotationById(id) });
  const { data: allQuotations = [] } = useQuery({ queryKey: ["quotations"], queryFn: () => getQuotations() });
  const statusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: "sent_to_client" | "approved" | "rejected" | "revision_requested"; reason?: string }) => markQuotationStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotation", id] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      setToast("Quotation status updated.");
    },
  });
  const projectMutation = useMutation({
    mutationFn: () => createFromQuotation(id),
    onSuccess: (project) => {
      statusMutation.mutate({ status: "approved" });
      setToast(<span>Project created: <Link className="font-semibold text-cyan-800 underline" href={`/projects/${project.id}`}>{project.code}</Link></span>);
    },
  });

  if (isLoading) return <LoadingSkeleton className="h-64 w-full" />;
  if (!quotation) return <EmptyState title="Quotation not found" description="The quotation could not be loaded." />;

  const isQs = role === "super_admin" || role === "qs_manager" || role === "qs_engineer";
  const isMarketing = role === "super_admin" || role === "marketing_manager" || role === "marketing_executive";
  const isMarketingManager = role === "super_admin" || role === "marketing_manager";
  const versions = allQuotations.filter((item) => item.leadId === quotation.leadId);

  return (
    <div className="grid gap-6">
      {toast ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{toast}</div> : null}
      <PageHeader
        title={`${quotation.code} v${quotation.version}`}
        description={`${quotation.customerName} / ${quotation.leadCode}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {isQs && can("edit", "quotation") && quotation.status === "draft" ? <Button label="Edit Draft" /> : null}
            {isMarketingManager && quotation.status !== "sent_to_client" ? <Button label="Send to Client" onClick={() => statusMutation.mutate({ status: "sent_to_client" })} /> : null}
            {isMarketing ? <Button label="Mark Revision Requested" onClick={() => statusMutation.mutate({ status: "revision_requested", reason: "Client requested revision." })} /> : null}
            {isMarketingManager ? <Button label="Mark Approved" onClick={() => setApproveOpen(true)} /> : null}
            {isMarketingManager ? <Button label="Mark Rejected" destructive onClick={() => statusMutation.mutate({ status: "rejected", reason: "Rejected by client." })} /> : null}
            <Button label="Preview PDF" icon={FileText} />
            {quotation.status === "approved" ? <Button label="Create Project" icon={FolderPlus} onClick={() => setApproveOpen(true)} /> : null}
          </div>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={quotation.status} />
        {quotation.active ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Active version</span> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">Inactive version</span>}
      </div>
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`border-b-2 px-3 py-2 text-sm font-semibold ${tab === item ? "border-cyan-700 text-cyan-800" : "border-transparent text-slate-500"}`}>{item}</button>)}
      </div>
      {tab === "Summary" ? <Summary quotation={quotation} /> : null}
      {tab === "BOQ" ? <BoqTab rows={quotation.boqLines} /> : null}
      {tab === "Versions" ? <VersionsTab rows={versions} /> : null}
      {tab === "Client Response" ? <ResponsesTab rows={quotation.clientResponses} /> : null}
      {tab === "Attachments" ? <AttachmentsTab rows={quotation.attachments} /> : null}
      {tab === "Timeline" ? <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"><ActivityTimeline items={[{ actor: quotation.owner, action: "created quotation", timestamp: "2026-05-22T10:00:00", summary: `${quotation.code} v${quotation.version}` }, ...(quotation.sentDate ? [{ actor: "Marketing", action: "sent to client", timestamp: `${quotation.sentDate}T12:00:00`, summary: "Quotation sent to client." }] : [])]} /></section> : null}
      <ConfirmDialog
        open={approveOpen}
        title="Create project"
        message="This will mark the quotation approved and create a project. Confirm?"
        onCancel={() => setApproveOpen(false)}
        onConfirm={() => {
          setApproveOpen(false);
          projectMutation.mutate();
        }}
      />
    </div>
  );
}

function Button({ label, onClick, destructive, icon: Icon }: { label: string; onClick?: () => void; destructive?: boolean; icon?: typeof FileText }) {
  return <button type="button" onClick={onClick} className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold ${destructive ? "border-red-200 text-red-700 hover:bg-red-50" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>{Icon ? <Icon className="h-4 w-4" /> : null}{label}</button>;
}

function Summary({ quotation }: { quotation: Quotation }) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const portalUrl = quotation.clientToken ? `${origin}/client/quotation/${quotation.clientToken}` : "";

  const handleCopy = () => {
    if (!portalUrl) return;
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Commercial Summary</h2>
        <dl className="mt-4 grid gap-4 md:grid-cols-3">
          <Item label="Linked Lead" value={quotation.leadCode} />
          <Item label="Customer" value={quotation.customerName} />
          <Item label="Grand Total" value={formatCurrency(quotation.grandTotal)} />
          <Item label="Payment Terms" value={quotation.paymentTerms} />
          <Item label="Valid Until" value={quotation.validUntil} />
          <Item label="Owner" value={quotation.owner} />
        </dl>
      </section>

      {quotation.clientToken ? (
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Client Portal Link</h2>
          <p className="mt-1 text-xs text-slate-500">
            Share this secure link with the client to let them review, approve, or reject this quotation.
          </p>
          <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <span className="select-all rounded bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 break-all flex-1">
              {portalUrl}
            </span>
            <button
              onClick={handleCopy}
              className="rounded-md bg-cyan-700 hover:bg-cyan-800 text-xs font-semibold text-white px-4 py-2 transition-colors cursor-pointer shrink-0"
            >
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <a
              href={`/client/quotation/${quotation.clientToken}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 px-4 py-2 transition-colors shrink-0 text-center"
            >
              Open Viewer
            </a>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-medium uppercase text-slate-500">{label}</dt><dd className="mt-1 text-sm text-slate-800">{value}</dd></div>;
}

function BoqTab({ rows }: { rows: BoqLine[] }) {
  const columns: ColumnDef<BoqLine>[] = [
    { accessorKey: "lineNo", header: "Line No" },
    { accessorKey: "section", header: "Section" },
    { accessorKey: "itemName", header: "Item" },
    { accessorKey: "description", header: "Description" },
    { accessorKey: "qty", header: "Qty" },
    { accessorKey: "unit", header: "Unit" },
    { accessorKey: "unitPrice", header: "Unit Price", cell: ({ row }) => formatCurrency(row.original.unitPrice) },
    { id: "amount", header: "Amount", cell: ({ row }) => formatCurrency(row.original.qty * row.original.unitPrice) },
  ];
  return <DataTable columns={columns} data={rows} />;
}

function VersionsTab({ rows }: { rows: Quotation[] }) {
  const columns: ColumnDef<Quotation>[] = [
    { accessorKey: "code", header: "Code" },
    { accessorKey: "version", header: "Version", cell: ({ row }) => <span className={row.original.active ? "font-semibold text-emerald-700" : row.original.status === "rejected" ? "text-slate-400 line-through" : ""}>v{row.original.version}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "grandTotal", header: "Grand Total", cell: ({ row }) => formatCurrency(row.original.grandTotal) },
    { accessorKey: "sentDate", header: "Sent" },
  ];
  return <DataTable columns={columns} data={rows} />;
}

function ResponsesTab({ rows }: { rows: ClientResponse[] }) {
  return <section className="grid gap-3">{rows.length ? rows.map((row) => <article key={row.id} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"><StatusBadge status={row.decision} /><p className="mt-2 text-sm text-slate-700">{row.reason || "No reason captured."}</p><p className="mt-1 text-xs text-slate-500">{row.date} / {row.owner}</p></article>) : <EmptyState title="No client response" description="No approval, rejection, or revision decision has been recorded." />}</section>;
}

function AttachmentsTab({ rows }: { rows: Attachment[] }) {
  return <section className="grid gap-3">{rows.length ? rows.map((row) => <article key={row.id} className="rounded-md border border-slate-200 bg-white p-4 text-sm shadow-sm">{row.name} / {row.type} / {row.uploader} / {row.date}</article>) : <EmptyState title="No attachments" description="No documents are attached to this quotation version." />}</section>;
}
