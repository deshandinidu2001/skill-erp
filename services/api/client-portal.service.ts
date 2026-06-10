import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import { auditLog } from "@/services/api/common";

export async function validateClientPortalToken(token: string) {
  const supabase = createAdminClient();
  const { data: access, error } = await supabase.from("client_access_tokens").select("*, projects(*)").eq("token", token).eq("is_active", true).maybeSingle();
  if (error || !access || new Date(access.expires_at) < new Date()) return { valid: false as const };
  return { valid: true as const, access, project: access.projects };
}

export async function getClientPortal(token: string) {
  const supabase = createAdminClient();
  const validation = await validateClientPortalToken(token);
  if (!validation.valid) return { valid: false as const };
  const { project } = validation;
  const [{ data: progress }, { data: docs }, { data: quotation }, { data: payments }] = await Promise.all([
    supabase.from("site_progress_updates").select("*, file_attachments(*)").eq("project_id", project.id).eq("client_visible", true),
    supabase.from("file_attachments").select("*").eq("entity_type", "project").eq("entity_id", project.id).eq("is_client_visible", true),
    supabase.from("quotations").select("*").eq("id", project.quotation_id).maybeSingle(),
    supabase.from("client_payments").select("*").eq("project_id", project.id),
  ]);

  let boqLines: Array<{ section: string; itemName: string; description: string; qty: number; unit: string }> = [];
  if (quotation?.boq_id) {
    const { data: sections } = await supabase
      .from("boq_sections")
      .select("*, boq_items(*)")
      .eq("boq_id", quotation.boq_id);
    
    if (sections) {
      boqLines = sections.flatMap(sec => 
        (sec.boq_items ?? []).map((item: any) => ({
          section: sec.title,
          itemName: item.description,
          description: item.description,
          qty: Number(item.quantity ?? 0),
          unit: item.unit ?? "",
        }))
      );
    }
  }

  return {
    valid: true as const,
    project: {
      name: project.project_name,
      code: project.project_code,
      status: project.status,
      location: "",
      manager: "",
      managerContact: "",
      startDate: project.start_date,
      expectedCompletion: project.end_date,
      progress: Number(project.progress_percent ?? 0),
      lastUpdate: progress?.[0]?.update_date ?? project.start_date,
      contractValue: Number(project.budget_amount ?? 0),
    },
    progress: (progress ?? []).map((row) => ({ date: row.update_date, title: row.title, summary: row.work_summary, percentComplete: Number(row.percent_complete ?? 0), photos: [] })),
    documents: (docs ?? []).map((row) => ({ name: row.original_name, type: row.mime_type, date: String(row.created_at).slice(0, 10), downloadUrl: `/api/files/${row.id}` })),
    quotation: quotation
      ? {
          code: quotation.quotation_code,
          version: quotation.version_number,
          status: quotation.status,
          grandTotal: Number(quotation.grand_total ?? 0),
          validUntil: quotation.valid_until,
          paymentTerms: quotation.payment_terms_text,
          boqLines,
        }
      : undefined,
    payments: (payments ?? []).map((row) => ({ date: row.payment_date, amount: Number(row.amount ?? 0), method: row.payment_method, reference: row.reference_no ?? "-", status: "received" })),
  };
}

export async function submitClientQuotationResponse(token: string, decision: "approved" | "rejected" | "revision_requested", reason?: string) {
  const supabase = createAdminClient();
  const portal = await getClientPortal(token);
  if (!portal.valid || !portal.quotation) throw new Error("Invalid or expired portal token.");
  const { data: quotation } = await supabase.from("quotations").select("id, lead_id").eq("quotation_code", portal.quotation.code).single();
  if (!quotation) throw new Error("Quotation not found.");
  await supabase.from("client_responses").insert({ lead_id: quotation.lead_id, quotation_id: quotation.id, response: decision, source: "client", remarks: reason });
  await supabase.from("quotations").update({ status: decision === "approved" ? "approved" : decision }).eq("id", quotation.id);
  await auditLog({ action: "update", module: "quotations", recordId: quotation.id, newValues: { client_response: decision, reason } });
  return decision;
}

export async function validateClientQuotationToken(token: string) {
  const supabase = createAdminClient();
  const { data: access, error } = await supabase
    .from("client_access_tokens")
    .select("*, quotations(*)")
    .eq("token", token)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !access || new Date(access.expires_at) < new Date()) return { valid: false as const };
  return { valid: true as const, access, quotation: access.quotations };
}

export async function getClientQuotationPortal(token: string) {
  const supabase = createAdminClient();
  const validation = await validateClientQuotationToken(token);
  if (!validation.valid || !validation.quotation) return { valid: false as const };
  
  const quotation = validation.quotation;
  
  let boqLines: Array<{ section: string; itemName: string; description: string; qty: number; unit: string }> = [];
  if (quotation.boq_id) {
    const { data: sections } = await supabase
      .from("boq_sections")
      .select("*, boq_items(*)")
      .eq("boq_id", quotation.boq_id);
    
    if (sections) {
      boqLines = sections.flatMap(sec => 
        (sec.boq_items ?? []).map((item: any) => ({
          section: sec.title,
          itemName: item.description,
          description: item.description,
          qty: Number(item.quantity ?? 0),
          unit: item.unit ?? "",
        }))
      );
    }
  }

  const { data: lead } = await supabase
    .from("leads")
    .select("*, customers(*)")
    .eq("id", quotation.lead_id)
    .maybeSingle();

  return {
    valid: true as const,
    quotation: {
      id: quotation.id,
      code: quotation.quotation_no,
      version: quotation.version_number ?? 1,
      status: quotation.status,
      grandTotal: Number(quotation.grand_total ?? 0),
      subtotal: Number(quotation.subtotal ?? 0),
      discount: Number(quotation.discount ?? 0),
      taxTotal: Number(quotation.tax_total ?? 0),
      validUntil: quotation.valid_until,
      paymentTerms: quotation.payment_terms_text ?? "",
      notes: quotation.notes_and_exclusions ?? "",
      boqLines,
    },
    client: {
      name: lead?.customers?.company_name || lead?.client_name || "Client",
      contactPerson: lead?.customers?.contact_name || lead?.client_name || "",
      email: lead?.customers?.email || lead?.email || "",
      phone: lead?.customers?.phone || lead?.phone || "",
    }
  };
}

export async function submitClientQuotationResponseDirect(token: string, decision: "approved" | "rejected" | "revision_requested", reason?: string) {
  const supabase = createAdminClient();
  const validation = await validateClientQuotationToken(token);
  if (!validation.valid || !validation.quotation) throw new Error("Invalid or expired portal token.");
  
  const quotation = validation.quotation;
  
  await supabase.from("client_responses").insert({
    lead_id: quotation.lead_id,
    quotation_id: quotation.id,
    response: decision,
    response_type: decision,
    source: "client",
    remarks: reason,
    message: reason ?? `Quotation ${decision} by client`,
    token_id: validation.access.id,
  });

  await supabase.from("quotations").update({ status: decision === "approved" ? "approved" : decision }).eq("id", quotation.id);

  let newLeadStatus = "under_review";
  if (decision === "approved") newLeadStatus = "approved";
  if (decision === "rejected") newLeadStatus = "rejected";
  if (decision === "revision_requested") newLeadStatus = "revision_requested";
  await supabase.from("leads").update({ status: newLeadStatus }).eq("id", quotation.lead_id);

  await auditLog({ action: "update", module: "quotations", recordId: quotation.id, newValues: { client_response: decision, reason } });
  return decision;
}
