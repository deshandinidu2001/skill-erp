"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";

const rawRows = [
  { A: "Concrete paving", B: "120", C: "m2", D: "Concrete", E: "Civil" },
  { A: "Total", B: "", C: "", D: "", E: "" },
  { A: "Steel beams", B: "0", C: "tons", D: "Steel", E: "Steel" },
  { A: "Drain pipe", B: "45", C: "m", D: "PVC pipe", E: "Drainage" },
];

export function BoqImportPage() {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState("sample-boq.xlsx");
  const [mapping, setMapping] = useState({ description: "A", quantity: "B", unit: "C", material_name: "D", section: "E" });
  const rows = useMemo(
    () =>
      rawRows
        .filter((row) => !String(row[mapping.description as keyof typeof row]).toLowerCase().includes("total"))
        .map((row) => {
          const qty = Number(row[mapping.quantity as keyof typeof row]);
          const unit = row[mapping.unit as keyof typeof row];
          const material = row[mapping.material_name as keyof typeof row];
          const errors = [!material && "Material not found", !["m2", "m", "nos"].includes(unit) && "Invalid unit", !(qty > 0) && "Quantity must be > 0"].filter(Boolean);
          return { description: row[mapping.description as keyof typeof row], qty, unit, material, section: row[mapping.section as keyof typeof row], errors };
        }),
    [mapping],
  );
  const valid = rows.filter((row) => row.errors.length === 0);

  return (
    <div className="grid gap-6">
      <PageHeader title="BOQ Import" description="Upload, map, validate, and import BOQ rows using system BSR rates." />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((item) => <button key={item} onClick={() => setStep(item)} className={`h-9 rounded-md px-3 text-sm font-semibold ${step === item ? "bg-cyan-700 text-white" : "border border-slate-300 bg-white text-slate-600"}`}>Step {item}</button>)}
      </div>
      {step === 1 ? (
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Upload</h2>
          <input type="file" accept=".xlsx,.xls" onChange={(event) => setFileName(event.target.files?.[0]?.name || fileName)} className="mt-4 block text-sm" />
          <p className="mt-3 text-sm text-slate-600">{fileName} / 18 KB</p>
          <Preview rows={rawRows} />
        </section>
      ) : null}
      {step === 2 ? (
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Column Mapping</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            {Object.keys(mapping).map((field) => <label key={field} className="grid gap-1 text-sm font-medium">{field}<select value={mapping[field as keyof typeof mapping]} onChange={(event) => setMapping((prev) => ({ ...prev, [field]: event.target.value }))} className="h-10 rounded-md border border-slate-300 px-2">{["A", "B", "C", "D", "E"].map((col) => <option key={col}>{col}</option>)}</select></label>)}
          </div>
          <Preview rows={rows.slice(0, 5)} />
          <p className="mt-3 text-sm text-slate-500">Mapping template saved for current mock user.</p>
        </section>
      ) : null}
      {step === 3 ? (
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Validation Preview</h2>
          <Preview rows={rows.map((row) => ({ ...row, status: row.errors.length ? "ERR" : "OK", errors: row.errors.join(", ") }))} />
          <p className="mt-3 text-sm font-medium text-red-700">Import is blocked until invalid rows are fixed or removed.</p>
        </section>
      ) : null}
      {step === 4 ? (
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Confirm Import</h2>
          <p className="mt-2 text-sm text-slate-600">{valid.length} valid rows, {rows.length - valid.length} invalid rows. Totals rows were skipped and Excel rates were ignored.</p>
          <button disabled={valid.length !== rows.length} className="mt-4 h-10 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white disabled:opacity-45" onClick={() => alert("BOQ ID BOQ-MOCK-001 created and calculation engine triggered.")}>
            Import {valid.length} valid rows
          </button>
        </section>
      ) : null}
    </div>
  );
}

function Preview({ rows }: { rows: Array<Record<string, unknown>> }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full min-w-[640px] text-left text-sm">
        <tbody>
          {rows.map((row, index) => <tr key={index} className="border-b border-slate-100">{Object.entries(row).map(([key, value]) => <td key={key} className="px-3 py-2"><span className="text-xs font-semibold text-slate-400">{key}</span><br />{String(value)}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}
