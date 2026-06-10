import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { auditLog, idSchema, resolveId } from "@/services/api/common";
import { mapEstimation } from "@/services/api/mappers";
import type { FilterParams } from "@/types";
import { createQuotation } from "@/services/api/quotations.service";

const estimationSchema = z.object({
  lead_id: z.number().int().positive(),
  assigned_qs_engineer: z.string().uuid().optional(),
  material_cost_total: z.number().nonnegative().default(0),
  labour_cost_total: z.number().nonnegative().default(0),
  equipment_cost_total: z.number().nonnegative().default(0),
  overhead_cost_total: z.number().nonnegative().default(0),
  profit_margin_pct: z.number().nonnegative().default(0),
  notes: z.string().optional(),
});

const transition: Record<string, string[]> = {
  draft: ["in_progress"],
  in_progress: ["ready_for_quotation", "revision_requested"],
  revision_requested: ["in_progress"],
  ready_for_quotation: ["quotation_submitted", "approved_baseline"],
  quotation_submitted: ["approved_baseline", "revision_requested"],
};

export async function getEstimations(filters?: FilterParams) {
  const supabase = createAdminClient();
  let query = supabase
    .from("estimations")
    .select("*, leads(*, customers(*)), app_users!prepared_by(full_name,id)")
    .order("updated_at", { ascending: false });
  if (filters?.status) query = query.eq("status", filters.status as never);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapEstimation(row));
}

const lineSchema = z.object({
  id: z.string().optional(),
  category: z.string().optional(),
  description: z.string(),
  qty: z.coerce.number().nonnegative(),
  unit: z.string().optional(),
  unitRate: z.coerce.number().nonnegative(),
  remarks: z.string().optional(),
});

const boqLineSchema = z.object({
  id: z.string().optional(),
  lineNo: z.coerce.number().int().positive(),
  section: z.string(),
  itemName: z.string(),
  description: z.string(),
  qty: z.coerce.number().nonnegative(),
  unit: z.string().optional(),
  unitPrice: z.coerce.number().nonnegative(),
});

const saveEstimationSchema = z.object({
  lead_id: z.coerce.number().int().positive(),
  assigned_qs_engineer: z.string().uuid().optional(),
  material_cost_total: z.coerce.number().nonnegative().default(0),
  labour_cost_total: z.coerce.number().nonnegative().default(0),
  equipment_cost_total: z.coerce.number().nonnegative().default(0),
  overhead_cost_total: z.coerce.number().nonnegative().default(0),
  profit_margin_pct: z.coerce.number().nonnegative().default(0),
  notes: z.string().optional().nullable(),
  revision_notes: z.string().optional().nullable(),
  lines: z.array(lineSchema).optional(),
  boqLines: z.array(boqLineSchema).optional(),
});

export async function getEstimationById(id: string) {
  const supabase = createAdminClient();
  const numericId = await resolveId("estimations", idSchema.parse(id), "estimation_code");
  if (!numericId) return undefined;
  const { data, error } = await supabase
    .from("estimations")
    .select("*, leads(*, customers(*)), app_users!prepared_by(full_name,id), estimation_lines(*)")
    .eq("id", numericId)
    .single();
  if (error) throw new Error(error.message);
  
  const mapped = mapEstimation(data);
  mapped.lines = (data.estimation_lines ?? []).map((line: Record<string, unknown>) => ({
    id: String(line.id),
    category: String(line.item_code ?? ""),
    description: String(line.description ?? line.item_description ?? ""),
    qty: Number(line.quantity ?? 0),
    unit: String(line.unit ?? ""),
    unitRate: Number(line.rate ?? line.unit_rate ?? 0),
    remarks: line.remarks ? String(line.remarks) : undefined,
  }));

  // Fetch BOQ linked to the estimation
  const { data: boq } = await supabase
    .from("boqs")
    .select("id")
    .eq("estimation_id", numericId)
    .maybeSingle();
    
  if (boq) {
    const { data: sections } = await supabase
      .from("boq_sections")
      .select("*, boq_items(*)")
      .eq("boq_id", boq.id)
      .order("sort_order", { ascending: true });
      
    if (sections) {
      let lineNo = 1;
      mapped.boqLines = sections.flatMap(sec => 
        (sec.boq_items ?? []).map((item: any) => ({
          id: String(item.id),
          lineNo: lineNo++,
          section: sec.title,
          itemName: item.description,
          description: item.description,
          qty: Number(item.quantity ?? 0),
          unit: item.unit ?? "",
          unitPrice: Number(item.rate ?? 0),
        }))
      );
    }
  }
  
  return mapped;
}

export async function createEstimation(payload: unknown, userId: string) {
  const input = saveEstimationSchema.parse(payload);
  const supabase = createAdminClient();
  
  const lineTotal = (input.lines ?? []).reduce((total, line) => total + line.qty * line.unitRate, 0);
  const subtotal = input.material_cost_total + input.labour_cost_total + input.equipment_cost_total + input.overhead_cost_total + lineTotal;
  const profit_margin_value = subtotal * (input.profit_margin_pct / 100);
  
  const { data: lead } = await supabase.from("leads").select("title").eq("id", input.lead_id).maybeSingle();
  const { count } = await supabase.from("estimations").select("*", { count: "exact", head: true });
  const code = `EST-${String((count ?? 0) + 2004).padStart(4, "0")}`;
  
  const { data, error } = await supabase
    .from("estimations")
    .insert({
      lead_id: input.lead_id,
      estimation_code: code,
      title: lead?.title ? `${lead.title} Estimate` : `Estimate ${new Date().toISOString().slice(0, 10)}`,
      prepared_by: userId,
      assigned_qs_engineer: input.assigned_qs_engineer ?? userId,
      material_cost_total: input.material_cost_total,
      labour_cost_total: input.labour_cost_total,
      equipment_cost_total: input.equipment_cost_total,
      overhead_cost_total: input.overhead_cost_total,
      profit_margin_pct: input.profit_margin_pct,
      subtotal,
      profit_margin_value: profit_margin_value,
      grand_total: subtotal + profit_margin_value,
      notes: input.notes,
      revision_notes: input.revision_notes,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  // Save lines if present
  if (input.lines && input.lines.length > 0) {
    const dbLines = input.lines.map((line, idx) => ({
      estimation_id: data.id,
      item_code: line.category,
      description: line.description,
      category: line.category,
      unit: line.unit,
      quantity: line.qty,
      rate: line.unitRate,
      sort_order: idx,
      remarks: line.remarks,
    }));
    const { error: insError } = await supabase
      .from("estimation_lines")
      .insert(dbLines);
    if (insError) throw new Error(insError.message);
  }

  // Save BOQ lines if present
  if (input.boqLines && input.boqLines.length > 0) {
    const { count: boqCount } = await supabase.from("boqs").select("*", { count: "exact", head: true });
    const boqCode = `BOQ-${String((boqCount ?? 0) + 1).padStart(4, "0")}`;
    const { data: boq, error: boqErr } = await supabase
      .from("boqs")
      .insert({
        estimation_id: data.id,
        title: `BOQ for Estimate ${code}`,
        boq_code: boqCode,
      })
      .select()
      .single();
    if (boqErr) throw new Error(boqErr.message);
    
    // Group boqLines by section and insert them
    const sections = Array.from(new Set(input.boqLines.map(l => l.section)));
    for (let i = 0; i < sections.length; i++) {
      const sectTitle = sections[i];
      const { data: sectionRecord, error: sectErr } = await supabase
        .from("boq_sections")
        .insert({
          boq_id: boq.id,
          title: sectTitle,
          sort_order: i,
        })
        .select()
        .single();
      if (sectErr) throw new Error(sectErr.message);
      
      const sectItems = input.boqLines
        .filter(l => l.section === sectTitle)
        .map(l => ({
          boq_section_id: sectionRecord.id,
          description: l.description || l.itemName,
          unit: l.unit || "m2",
          quantity: l.qty,
          rate: l.unitPrice,
        }));
        
      if (sectItems.length > 0) {
        const { error: itemErr } = await supabase
          .from("boq_items")
          .insert(sectItems);
        if (itemErr) throw new Error(itemErr.message);
      }
    }
  }

  await auditLog({ userId, action: "create", module: "estimations", recordId: data.id, newValues: data });
  return mapEstimation(data);
}

export async function updateEstimation(id: string, payload: unknown, userId: string) {
  const input = saveEstimationSchema.parse(payload);
  const supabase = createAdminClient();
  const numericId = await resolveId("estimations", idSchema.parse(id), "estimation_code");
  if (!numericId) throw new Error("Estimation not found.");
  
  const lineTotal = (input.lines ?? []).reduce((total, line) => total + line.qty * line.unitRate, 0);
  const subtotal = input.material_cost_total + input.labour_cost_total + input.equipment_cost_total + input.overhead_cost_total + lineTotal;
  const profit_margin_value = subtotal * (input.profit_margin_pct / 100);
  
  const { data, error } = await supabase
    .from("estimations")
    .update({
      material_cost_total: input.material_cost_total,
      labour_cost_total: input.labour_cost_total,
      equipment_cost_total: input.equipment_cost_total,
      overhead_cost_total: input.overhead_cost_total,
      profit_margin_pct: input.profit_margin_pct,
      subtotal,
      profit_margin_value: profit_margin_value,
      grand_total: subtotal + profit_margin_value,
      notes: input.notes,
      revision_notes: input.revision_notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", numericId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  
  // Update lines
  if (input.lines) {
    const { error: delError } = await supabase
      .from("estimation_lines")
      .delete()
      .eq("estimation_id", numericId);
    if (delError) throw new Error(delError.message);
    
    if (input.lines.length > 0) {
      const dbLines = input.lines.map((line, idx) => ({
        estimation_id: numericId,
        item_code: line.category,
        description: line.description,
        category: line.category,
        unit: line.unit,
        quantity: line.qty,
        rate: line.unitRate,
        sort_order: idx,
        remarks: line.remarks,
      }));
      const { error: insError } = await supabase
        .from("estimation_lines")
        .insert(dbLines);
      if (insError) throw new Error(insError.message);
    }
  }

  // Update BOQ
  if (input.boqLines) {
    let { data: boq } = await supabase
      .from("boqs")
      .select("id")
      .eq("estimation_id", numericId)
      .maybeSingle();
      
    if (!boq) {
      const { count: boqCount } = await supabase.from("boqs").select("*", { count: "exact", head: true });
      const boqCode = `BOQ-${String((boqCount ?? 0) + 1).padStart(4, "0")}`;
      const { data: newBoq, error: boqErr } = await supabase
        .from("boqs")
        .insert({
          estimation_id: numericId,
          title: `BOQ for Estimate ${data.estimation_code}`,
          boq_code: boqCode,
        })
        .select()
        .single();
      if (boqErr) throw new Error(boqErr.message);
      boq = newBoq;
    }
    
    if (boq) {
      const { error: sectDelErr } = await supabase
        .from("boq_sections")
        .delete()
        .eq("boq_id", boq.id);
      if (sectDelErr) throw new Error(sectDelErr.message);
      
      const sections = Array.from(new Set(input.boqLines.map(l => l.section)));
      for (let i = 0; i < sections.length; i++) {
        const sectTitle = sections[i];
        const { data: sectionRecord, error: sectErr } = await supabase
          .from("boq_sections")
          .insert({
            boq_id: boq.id,
            title: sectTitle,
            sort_order: i,
          })
          .select()
          .single();
        if (sectErr) throw new Error(sectErr.message);
        
        const sectItems = input.boqLines
          .filter(l => l.section === sectTitle)
          .map(l => ({
            boq_section_id: sectionRecord.id,
            description: l.description || l.itemName,
            unit: l.unit || "m2",
            quantity: l.qty,
            rate: l.unitPrice,
          }));
          
        if (sectItems.length > 0) {
          const { error: itemErr } = await supabase
            .from("boq_items")
            .insert(sectItems);
          if (itemErr) throw new Error(itemErr.message);
        }
      }
    }
  }

  await auditLog({ userId, action: "update", module: "estimations", recordId: numericId, oldValues: {}, newValues: data });
  return mapEstimation(data);
}

export async function updateEstimationStatus(id: string, status: string, userId?: string) {
  const supabase = createAdminClient();
  const numericId = await resolveId("estimations", idSchema.parse(id), "estimation_code");
  if (!numericId) throw new Error("Estimation not found.");
  const { data: current, error: currentError } = await supabase.from("estimations").select("status").eq("id", numericId).single();
  if (currentError) throw new Error(currentError.message);
  if (!transition[String(current.status)]?.includes(status)) throw new Error(`Invalid transition: ${current.status} to ${status}`);
  const { data, error } = await supabase.from("estimations").update({ status }).eq("id", numericId).select().single();
  if (error) throw new Error(error.message);
  await auditLog({ userId, action: "update", module: "estimations", recordId: numericId, oldValues: current, newValues: { status } });
  return mapEstimation(data);
}

export async function markEstimationReady(id: string, userId?: string) {
  const supabase = createAdminClient();
  const numericId = await resolveId("estimations", idSchema.parse(id), "estimation_code");
  if (!numericId) throw new Error("Estimation not found.");
  
  // 1. Update estimation status to "ready_for_quotation"
  const estimation = await updateEstimationStatus(id, "ready_for_quotation", userId);
  
  // 2. Fetch estimation details along with the lead
  const { data: estData, error: estError } = await supabase
    .from("estimations")
    .select("*, leads(*)")
    .eq("id", numericId)
    .single();
  if (estError) throw new Error(estError.message);
  
  // 3. Check if a quotation already exists for this estimation
  const { data: existingQuo } = await supabase
    .from("quotations")
    .select("id")
    .eq("estimation_id", numericId)
    .maybeSingle();
    
  if (!existingQuo) {
    const subtotal = Number(estData.subtotal || 0);
    const tax_total = Number(estData.profit_margin_value || 0);
    const grand_total = subtotal + tax_total;
    
    // Find linked BOQ
    const { data: boq } = await supabase
      .from("boqs")
      .select("id")
      .eq("estimation_id", numericId)
      .maybeSingle();
      
    const newQuotation = await createQuotation({
      lead_id: Number(estData.lead_id),
      estimation_id: Number(numericId),
      boq_id: boq?.id ? Number(boq.id) : undefined,
      issue_date: new Date().toISOString().slice(0, 10),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 30 days valid
      subtotal,
      discount_value: 0,
      tax_value: tax_total,
      grand_total,
      payment_terms_text: "40% advance, 50% progress, 10% handover",
    }, userId ?? "");
    
    // Update boq with quotation relation if it exists
    if (boq) {
      await supabase.from("boqs").update({ quotation_id: Number(newQuotation.id) }).eq("id", boq.id);
    }
    
    // 4. Update lead status to "qs_estimation_pending" if it's currently new or under_review
    if (estData.leads && ["new", "under_review"].includes(estData.leads.status)) {
      await supabase.from("leads").update({ status: "qs_estimation_pending" }).eq("id", estData.lead_id);
    }
  }
  
  return estimation;
}
