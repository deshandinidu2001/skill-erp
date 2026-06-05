import {
  attachments,
  clientAccessTokens,
  clientPayments,
  projectProgressUpdates,
  projects,
  quotations,
} from "@/services/mock/seed";
import { mockDelay } from "@/services/mock/utils";

export function validateClientPortalToken(token: string) {
  const access = clientAccessTokens.find((item) => item.token === token);
  if (!access || !access.active || new Date(access.expiresAt) < new Date()) {
    return { valid: false as const };
  }
  const project = projects.find((item) => item.project_id === access.project_id);
  if (!project) return { valid: false as const };
  return { valid: true as const, access, project };
}

export async function getClientPortal(token: string) {
  await mockDelay();
  const validation = validateClientPortalToken(token);
  if (!validation.valid) return { valid: false as const };
  const { access, project } = validation;
  const quotation = quotations.find((item) => item.id === project.quotationId || (item.leadCode && item.customerName === project.customer && item.active));
  return {
    valid: true as const,
    project: {
      name: project.name,
      code: project.code,
      status: project.status,
      location: project.siteName,
      manager: project.manager,
      managerContact: "+94 77 111 2222",
      startDate: project.startDate,
      expectedCompletion: project.endDate,
      progress: project.progress,
      lastUpdate: projectProgressUpdates.find((item) => item.project_id === project.project_id)?.date ?? project.startDate,
      contractValue: project.budget,
    },
    progress: projectProgressUpdates
      .filter((item) => item.project_id === project.project_id && item.clientVisible)
      .map((item) => ({
        date: item.date,
        title: item.title,
        summary: item.summary,
        percentComplete: item.percentComplete,
        photos: item.attachments.map((attachment) => attachment.name),
      })),
    documents: attachments
      .filter((item) => item.parentId === project.project_id || item.parentId === project.quotationId)
      .map((item) => ({ name: item.name, type: item.type, date: item.date, downloadUrl: `/api/client/files/${token}/${encodeURIComponent(item.name)}` })),
    quotation: quotation
      ? {
          code: quotation.code,
          version: quotation.version,
          status: quotation.status,
          grandTotal: quotation.grandTotal,
          validUntil: quotation.validUntil,
          paymentTerms: quotation.paymentTerms,
          boqLines: quotation.boqLines.map((line) => ({
            section: line.section,
            itemName: line.itemName,
            description: line.description,
            qty: line.qty,
            unit: line.unit,
          })),
        }
      : undefined,
    payments: clientPayments
      .filter((item) => item.project_id === project.project_id)
      .map((item) => ({ date: item.date, amount: item.amount, method: item.method, reference: item.referenceNo ?? "-", status: "received" })),
  };
}

export async function submitClientQuotationResponse(token: string, decision: "approved" | "rejected" | "revision_requested", reason?: string) {
  await mockDelay();
  const portal = await getClientPortal(token);
  if (!portal.valid || !portal.quotation) throw new Error("Invalid or expired portal token.");
  const quotation = quotations.find((item) => item.code === portal.quotation?.code && item.version === portal.quotation?.version);
  if (!quotation) throw new Error("Quotation not found.");
  quotation.status = decision === "approved" ? "approved" : decision;
  quotation.clientResponses.unshift({
    id: `resp_client_${Date.now()}`,
    quotationId: quotation.id,
    decision,
    reason,
    date: new Date().toISOString().slice(0, 10),
    owner: "CLIENT",
  });
  return quotation.status;
}
