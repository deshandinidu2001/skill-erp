"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable } from "@/components/tables/DataTable";
import { formatCurrency } from "@/lib/utils";
import { getClientPortal, submitClientQuotationResponse } from "@/services/api/client/client-portal.service";
import type { ColumnDef } from "@tanstack/react-table";

type ClientPortal = Awaited<ReturnType<typeof getClientPortal>>;

export function ClientPortalPage({ token }: { token: string }) {
  const [tab, setTab] = useState("Overview");
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["client-portal", token], queryFn: () => getClientPortal(token) });
  const responseMutation = useMutation({
    mutationFn: (decision: "approved" | "rejected" | "revision_requested") => submitClientQuotationResponse(token, decision, reason),
    onSuccess: (status) => {
      setToast(`Quotation response submitted. Status: ${status}.`);
      queryClient.invalidateQueries({ queryKey: ["client-portal", token] });
    },
    onError: (error) => setToast((error as Error).message),
  });
  if (isLoading) return <main className="min-h-screen bg-slate-100 p-6">Loading...</main>;
  if (!data?.valid) return <main className="grid min-h-screen place-items-center bg-slate-100 p-6"><div className="rounded-md border border-red-200 bg-white p-6 text-center shadow-sm"><h1 className="text-xl font-semibold">This link has expired</h1><p className="mt-2 text-sm text-slate-500">Please request a new portal link from Skill Engineering.</p></div></main>;
  const paid = data.payments.reduce((sum, payment) => sum + payment.amount, 0);
  return (
    <main className="min-h-screen bg-slate-100 p-4 lg:p-8">
      <div className="mx-auto grid max-w-6xl gap-6">
        {toast ? <div className="rounded-md border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-800">{toast}</div> : null}
        <PageHeader title={data.project.name} description={`${data.project.location} / Project Manager: ${data.project.manager} (${data.project.managerContact})`} />
        <div className="flex flex-wrap gap-2"><StatusBadge status={data.project.status} /><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{data.project.code}</span></div>
        <div className="flex flex-wrap gap-2 border-b border-slate-200">{["Overview", "Progress Updates", "Documents", "Quotation", "Payment Status"].map((item) => <button key={item} onClick={() => setTab(item)} className={`border-b-2 px-3 py-2 text-sm font-semibold ${tab === item ? "border-cyan-700 text-cyan-800" : "border-transparent text-slate-500"}`}>{item}</button>)}</div>
        {tab === "Overview" ? <Overview data={data} /> : null}
        {tab === "Progress Updates" ? <Progress data={data} /> : null}
        {tab === "Documents" ? <Docs data={data} /> : null}
        {tab === "Quotation" ? <Quotation data={data} reason={reason} setReason={setReason} submit={(decision) => responseMutation.mutate(decision)} /> : null}
        {tab === "Payment Status" ? <Payments data={data} paid={paid} /> : null}
      </div>
    </main>
  );
}

function Overview({ data }: { data: Extract<ClientPortal, { valid: true }> }) {
  return <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"><div className="grid gap-4 md:grid-cols-4"><Info label="Start Date" value={data.project.startDate} /><Info label="Expected Completion" value={data.project.expectedCompletion} /><Info label="Last Update" value={data.project.lastUpdate} /><Info label="Progress" value={`${data.project.progress}%`} /></div><div className="mt-5 h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-cyan-700" style={{ width: `${data.project.progress}%` }} /></div></section>;
}

function Progress({ data }: { data: Extract<ClientPortal, { valid: true }> }) {
  return <section className="grid gap-3">{data.progress.map((item) => <article key={`${item.date}-${item.title}`} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-semibold">{item.title}</h2><p className="mt-1 text-sm text-slate-600">{item.summary}</p><p className="mt-1 text-xs text-slate-500">{item.date} / {item.percentComplete}% complete</p></article>)}</section>;
}

function Docs({ data }: { data: Extract<ClientPortal, { valid: true }> }) {
  return <section className="grid gap-3 md:grid-cols-3">{data.documents.map((doc) => <article key={doc.name} className="rounded-md border border-slate-200 bg-white p-4 text-sm shadow-sm"><strong>{doc.name}</strong><p className="mt-1 text-slate-500">{doc.type} / {doc.date}</p><a href={doc.downloadUrl} className="mt-2 inline-block text-cyan-800">Download</a></article>)}</section>;
}

function Quotation({ data, reason, setReason, submit }: { data: Extract<ClientPortal, { valid: true }>; reason: string; setReason: (value: string) => void; submit: (decision: "approved" | "rejected" | "revision_requested") => void }) {
  if (!data.quotation) return <p>No active quotation is available.</p>;
  const columns: ColumnDef<(typeof data.quotation.boqLines)[number]>[] = [{ accessorKey: "section", header: "Section" }, { accessorKey: "itemName", header: "Item" }, { accessorKey: "description", header: "Description" }, { accessorKey: "qty", header: "Qty" }, { accessorKey: "unit", header: "Unit" }];
  const canRespond = data.quotation.status === "client_sent" || data.quotation.status === "sent_to_client";
  return <section className="grid gap-4"><div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">{data.quotation.code} v{data.quotation.version}</h2><p className="mt-2 text-sm text-slate-600">Grand total {formatCurrency(data.quotation.grandTotal)} / valid until {data.quotation.validUntil}</p><p className="mt-1 text-sm text-slate-600">{data.quotation.paymentTerms}</p>{canRespond ? <div className="mt-4 grid gap-2"><textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason or revision description" className="rounded-md border border-slate-300 px-3 py-2 text-sm" /><div className="flex flex-wrap gap-2"><button onClick={() => submit("approved")} className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">Approve</button><button onClick={() => submit("revision_requested")} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">Request Revision</button><button onClick={() => submit("rejected")} className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">Reject</button></div></div> : null}</div><DataTable columns={columns} data={data.quotation.boqLines} /></section>;
}

function Payments({ data, paid }: { data: Extract<ClientPortal, { valid: true }>; paid: number }) {
  const columns: ColumnDef<(typeof data.payments)[number]>[] = [{ accessorKey: "date", header: "Date" }, { accessorKey: "amount", header: "Amount", cell: ({ row }) => formatCurrency(row.original.amount) }, { accessorKey: "method", header: "Method" }, { accessorKey: "reference", header: "Reference" }, { accessorKey: "status", header: "Status" }];
  return <section className="grid gap-4"><div className="rounded-md border border-slate-200 bg-white p-4 text-sm shadow-sm">Paid {formatCurrency(paid)} / Contract {formatCurrency(data.project.contractValue)} / Outstanding {formatCurrency(data.project.contractValue - paid)}</div><DataTable columns={columns} data={data.payments} /></section>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-medium uppercase text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-950">{value}</p></div>;
}
