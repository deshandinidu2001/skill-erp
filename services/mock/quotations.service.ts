import { leads, quotations } from "@/services/mock/seed";
import { filterRecords, mockDelay } from "@/services/mock/utils";
import type { FilterParams, Quotation } from "@/types";

export async function getQuotations(params?: FilterParams): Promise<Quotation[]> {
  await mockDelay();
  return filterRecords(quotations, params, ["code", "leadCode", "customerName", "owner"]);
}

export async function getQuotationById(id: string): Promise<Quotation | undefined> {
  await mockDelay();
  return quotations.find((item) => item.id === id || item.code === id);
}

export async function duplicateQuotationVersion(id: string): Promise<Quotation> {
  await mockDelay();
  const quotation = quotations.find((item) => item.id === id || item.code === id);
  if (!quotation) throw new Error("Quotation not found.");
  quotations.forEach((item) => {
    if (item.leadId === quotation.leadId) item.active = false;
  });
  const nextVersion = Math.max(...quotations.filter((item) => item.leadId === quotation.leadId).map((item) => item.version)) + 1;
  const duplicate: Quotation = {
    ...quotation,
    id: `quo_${Date.now()}`,
    version: nextVersion,
    status: "draft",
    active: true,
    sentDate: undefined,
    clientResponses: [],
  };
  quotations.unshift(duplicate);
  return duplicate;
}

export async function markQuotationStatus(
  id: string,
  status: "sent_to_client" | "approved" | "rejected" | "revision_requested",
  reason?: string,
) {
  await mockDelay();
  const quotation = quotations.find((item) => item.id === id || item.code === id);
  if (!quotation) throw new Error("Quotation not found.");
  quotation.status = status;
  if (status === "sent_to_client") quotation.sentDate = new Date().toISOString().slice(0, 10);
  if (status === "approved") {
    const lead = leads.find((item) => item.id === quotation.leadId);
    if (lead) lead.status = "approved";
  }
  if (status === "rejected" || status === "revision_requested") {
    quotation.clientResponses.unshift({
      id: `resp_${Date.now()}`,
      quotationId: quotation.id,
      decision: status,
      reason,
      date: new Date().toISOString().slice(0, 10),
      owner: "Marketing",
    });
  }
  return quotation;
}
