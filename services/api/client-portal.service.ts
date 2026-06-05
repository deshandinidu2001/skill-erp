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
    supabase.from("quotations").select("*, boq_items(*)").eq("id", project.quotation_id).maybeSingle(),
    supabase.from("client_payments").select("*").eq("project_id", project.id),
  ]);
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
          boqLines: [],
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
