"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Copy, GripVertical, Plus, Save, Trash2 } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FormSection } from "@/components/forms/FormSection";
import { formatCurrency } from "@/lib/utils";
import { getEstimationById } from "@/services/api/client/estimations.service";
import { getLeads } from "@/services/api/client/leads.service";
import type { BoqLine, EstimationLine } from "@/types";

const costSchema = z.object({
  materialCostTotal: z.coerce.number().min(0),
  labourCostTotal: z.coerce.number().min(0),
  equipmentCostTotal: z.coerce.number().min(0),
  overheadCostTotal: z.coerce.number().min(0),
  profitMarginPercent: z.coerce.number().min(0, "Margin cannot be negative"),
  notes: z.string().optional(),
  revisionNotes: z.string().optional(),
});

type CostInput = z.input<typeof costSchema>;
type CostValues = z.output<typeof costSchema>;

export function EstimationFormPage({ id }: { id?: string }) {
  const { data: existing } = useQuery({ queryKey: ["estimation", id], queryFn: () => (id ? getEstimationById(id) : Promise.resolve(undefined)) });
  const { data: leads = [] } = useQuery({ queryKey: ["leads", "qs-pending"], queryFn: () => getLeads() });
  const lead = leads.find((item) => item.status === "qs_estimation_pending") ?? leads[0];
  const [boqOpen, setBoqOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [lines, setLines] = useState<EstimationLine[]>(
    existing?.lines ?? [{ id: "tmp_1", category: "Civil", description: "", qty: 1, unit: "m2", unitRate: 0, remarks: "" }],
  );
  const [boqLines, setBoqLines] = useState<BoqLine[]>(existing?.boqLines ?? [{ id: "boq_tmp_1", lineNo: 1, section: "General", itemName: "", description: "", qty: 1, unit: "m2", unitPrice: 0 }]);

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<CostInput, unknown, CostValues>({
    resolver: zodResolver(costSchema),
    values: {
      materialCostTotal: existing?.materialCostTotal ?? 0,
      labourCostTotal: existing?.labourCostTotal ?? 0,
      equipmentCostTotal: existing?.equipmentCostTotal ?? 0,
      overheadCostTotal: existing?.overheadCostTotal ?? 0,
      profitMarginPercent: existing?.profitMarginPercent ?? 15,
      notes: existing?.notes ?? "",
      revisionNotes: existing?.revisionNotes ?? "",
    },
  });

  const watched = watch();
  const lineTotal = lines.reduce((total, line) => total + Number(line.qty || 0) * Number(line.unitRate || 0), 0);
  const subtotal =
    Number(watched.materialCostTotal || 0) +
    Number(watched.labourCostTotal || 0) +
    Number(watched.equipmentCostTotal || 0) +
    Number(watched.overheadCostTotal || 0) +
    lineTotal;
  const profit = subtotal * (Number(watched.profitMarginPercent || 0) / 100);
  const grandTotal = subtotal + profit;
  const categoryTotals = useMemo(
    () =>
      Object.entries(
        lines.reduce<Record<string, number>>((acc, line) => {
          acc[line.category] = (acc[line.category] ?? 0) + Number(line.qty || 0) * Number(line.unitRate || 0);
          return acc;
        }, {}),
      ),
    [lines],
  );

  function onSubmit(values: CostValues) {
    const parsed = costSchema.parse(values);
    const hasLines = lines.some((line) => line.description.trim() && Number(line.qty) > 0);
    const hasCosts = subtotal > 0;
    if (!lead || lead.status !== "qs_estimation_pending" || (!hasLines && !hasCosts)) {
      setToast("Validation blocked: lead must be QS Estimation Pending and at least one line or cost component is required.");
      return;
    }
    setToast(`Draft saved. Grand total ${formatCurrency(grandTotal)}.`);
    return parsed;
  }

  return (
    <div className="grid gap-6">
      {toast ? <div className="rounded-md border border-cyan-200 bg-cyan-50 p-3 text-sm font-medium text-cyan-800">{toast}</div> : null}
      <PageHeader title={id ? "Edit Estimation" : "New Estimation"} description="Build costs, line items, BOQ rows, and revision notes." />
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Lead Reference</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="font-semibold text-slate-950">{lead?.code ?? "No lead selected"}</span>
            <span>{lead?.customerName ?? "-"}</span>
            <span>{lead?.projectType ?? "-"}</span>
            {lead ? <StatusBadge status={lead.status} /> : null}
          </div>
        </section>
        <FormSection title="Cost Summary Inputs">
          <div className="grid gap-4 md:grid-cols-5">
            <NumberField label="Material" error={errors.materialCostTotal?.message} {...register("materialCostTotal")} />
            <NumberField label="Labour" error={errors.labourCostTotal?.message} {...register("labourCostTotal")} />
            <NumberField label="Equipment" error={errors.equipmentCostTotal?.message} {...register("equipmentCostTotal")} />
            <NumberField label="Overhead" error={errors.overheadCostTotal?.message} {...register("overheadCostTotal")} />
            <NumberField label="Profit %" error={errors.profitMarginPercent?.message} {...register("profitMarginPercent")} />
          </div>
          <div className="grid gap-3 rounded-md bg-slate-50 p-4 text-sm md:grid-cols-3">
            <strong>Subtotal: {formatCurrency(subtotal)}</strong>
            <strong>Profit: {formatCurrency(profit)}</strong>
            <strong>Grand Total: {formatCurrency(grandTotal)}</strong>
          </div>
        </FormSection>
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-950">Estimation Lines</h2>
            <button type="button" onClick={() => setLines((prev) => [...prev, { id: `tmp_${Date.now()}`, category: "Civil", description: "", qty: 1, unit: "m2", unitRate: 0 }])} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold"><Plus className="h-4 w-4" />Add row</button>
          </div>
          <EditableLineTable lines={lines} onChange={setLines} />
          <div className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-3">
            {categoryTotals.map(([category, total]) => <p key={category} className="rounded-md bg-slate-50 p-2">{category}: {formatCurrency(total)}</p>)}
          </div>
        </section>
        <FormSection title="Notes and Revision Notes">
          <textarea {...register("notes")} rows={3} placeholder="Notes" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <textarea {...register("revisionNotes")} rows={3} placeholder="Revision notes" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </FormSection>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold"><Save className="h-4 w-4" />Save Draft</button>
          <button type="button" onClick={() => setToast("Marked ready for quotation in mock state.")} className="inline-flex h-10 items-center rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white">Mark Ready for Quotation</button>
          <button type="button" onClick={() => setBoqOpen(true)} className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-sm font-semibold">Open BOQ Builder</button>
          <Link href="/qs/estimations" className="inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold text-slate-600">Cancel</Link>
        </div>
      </form>
      {boqOpen ? <BoqBuilder lines={boqLines} onChange={setBoqLines} onClose={() => setBoqOpen(false)} /> : null}
    </div>
  );
}

function NumberField({ label, error, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return <label className="grid gap-1.5"><span className="text-sm font-medium text-slate-700">{label}</span><input type="number" step="0.01" {...props} className="h-10 rounded-md border border-slate-300 px-3 text-sm" />{error ? <span className="text-xs text-red-600">{error}</span> : null}</label>;
}

function EditableLineTable({ lines, onChange }: { lines: EstimationLine[]; onChange: (lines: EstimationLine[]) => void }) {
  const update = (id: string, patch: Partial<EstimationLine>) => onChange(lines.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr>{["Category", "Description", "Qty", "Unit", "Unit Rate", "Line Total", "Remarks", ""].map((head) => <th key={head} className="px-3 py-2">{head}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">
          {lines.map((line) => <tr key={line.id}>
            <td className="p-2"><input value={line.category} onChange={(event) => update(line.id, { category: event.target.value })} className="h-9 w-full rounded border border-slate-300 px-2" /></td>
            <td className="p-2"><input value={line.description} onChange={(event) => update(line.id, { description: event.target.value })} className="h-9 w-full rounded border border-slate-300 px-2" /></td>
            <td className="p-2"><input type="number" value={line.qty} onChange={(event) => update(line.id, { qty: Number(event.target.value) })} className="h-9 w-24 rounded border border-slate-300 px-2" /></td>
            <td className="p-2"><input value={line.unit} onChange={(event) => update(line.id, { unit: event.target.value })} className="h-9 w-24 rounded border border-slate-300 px-2" /></td>
            <td className="p-2"><input type="number" value={line.unitRate} onChange={(event) => update(line.id, { unitRate: Number(event.target.value) })} className="h-9 w-32 rounded border border-slate-300 px-2" /></td>
            <td className="p-2 font-semibold">{formatCurrency(Number(line.qty) * Number(line.unitRate))}</td>
            <td className="p-2"><input value={line.remarks ?? ""} onChange={(event) => update(line.id, { remarks: event.target.value })} className="h-9 w-full rounded border border-slate-300 px-2" /></td>
            <td className="p-2"><button type="button" onClick={() => onChange(lines.filter((item) => item.id !== line.id))} className="grid h-9 w-9 place-items-center rounded border border-slate-300"><Trash2 className="h-4 w-4" /></button></td>
          </tr>)}
        </tbody>
      </table>
    </div>
  );
}

function BoqBuilder({ lines, onChange, onClose }: { lines: BoqLine[]; onChange: (lines: BoqLine[]) => void; onClose: () => void }) {
  const subtotal = lines.reduce((total, line) => total + line.qty * line.unitPrice, 0);
  const update = (id: string, patch: Partial<BoqLine>) => onChange(lines.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
      <aside className="h-full w-full max-w-5xl overflow-y-auto bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-950">BOQ Builder</h2>
          <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-3 py-2 text-sm">Close</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr>{["", "Line No", "Group/Section", "Item Name", "Description", "Qty", "Unit", "Unit Price", "Amount", ""].map((head) => <th key={head} className="px-3 py-2">{head}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((line) => <tr key={line.id}>
                <td className="p-2 text-slate-400"><GripVertical className="h-4 w-4" /></td>
                <td className="p-2">{line.lineNo}</td>
                <td className="p-2"><input value={line.section} onChange={(event) => update(line.id, { section: event.target.value })} className="h-9 rounded border border-slate-300 px-2" /></td>
                <td className="p-2"><input value={line.itemName} onChange={(event) => update(line.id, { itemName: event.target.value })} className="h-9 rounded border border-slate-300 px-2" /></td>
                <td className="p-2"><input value={line.description} onChange={(event) => update(line.id, { description: event.target.value })} className="h-9 rounded border border-slate-300 px-2" /></td>
                <td className="p-2"><input type="number" value={line.qty} onChange={(event) => update(line.id, { qty: Number(event.target.value) })} className="h-9 w-20 rounded border border-slate-300 px-2" /></td>
                <td className="p-2"><input value={line.unit} onChange={(event) => update(line.id, { unit: event.target.value })} className="h-9 w-20 rounded border border-slate-300 px-2" /></td>
                <td className="p-2"><input type="number" value={line.unitPrice} onChange={(event) => update(line.id, { unitPrice: Number(event.target.value) })} className="h-9 w-28 rounded border border-slate-300 px-2" /></td>
                <td className="p-2 font-semibold">{formatCurrency(line.qty * line.unitPrice)}</td>
                <td className="p-2"><div className="flex gap-1"><button type="button" onClick={() => onChange([...lines, { ...line, id: `boq_${Date.now()}`, lineNo: lines.length + 1 }])} className="grid h-8 w-8 place-items-center rounded border border-slate-300"><Copy className="h-4 w-4" /></button><button type="button" onClick={() => onChange(lines.filter((item) => item.id !== line.id))} className="grid h-8 w-8 place-items-center rounded border border-slate-300"><Trash2 className="h-4 w-4" /></button></div></td>
              </tr>)}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button type="button" onClick={() => onChange([...lines, { id: `boq_${Date.now()}`, lineNo: lines.length + 1, section: "General", itemName: "", description: "", qty: 1, unit: "m2", unitPrice: 0 }])} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold"><Plus className="h-4 w-4" />Add Line</button>
          <strong>Subtotal: {formatCurrency(subtotal)}</strong>
        </div>
      </aside>
    </div>
  );
}
