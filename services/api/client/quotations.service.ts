import { apiGet, apiPatch } from "@/services/api/client/http";
import type { FilterParams, Quotation } from "@/types";

export function getQuotations(params?: FilterParams): Promise<Quotation[]> {
  const qs = params ? `?${new URLSearchParams(params as Record<string, string>)}` : "";
  return apiGet(`/api/quotations${qs}`);
}

export function getQuotationById(id: string): Promise<Quotation | undefined> {
  return apiGet(`/api/quotations/${id}`);
}

export function duplicateQuotationVersion(id: string): Promise<Quotation> {
  return apiPatch(`/api/quotations/${id}`, { action: "duplicate" });
}

export function markQuotationStatus(id: string, status: "sent_to_client" | "approved" | "rejected" | "revision_requested", reason?: string) {
  return apiPatch(`/api/quotations/${id}`, { status, reason });
}
