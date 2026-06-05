import { apiGet, apiPatch } from "@/services/api/client/http";
import type { ActivityItem, Attachment, CommunicationEntry, EntityStatus, Estimation, FilterParams, Lead, Note, Quotation } from "@/types";

export type LeadDetail = {
  lead: Lead;
  estimations: Estimation[];
  quotations: Quotation[];
  communications: CommunicationEntry[];
  notes: Note[];
  attachments: Attachment[];
  timeline: ActivityItem[];
};

export function getLeads(params?: FilterParams): Promise<Lead[]> {
  const qs = params ? `?${new URLSearchParams(params as Record<string, string>)}` : "";
  return apiGet(`/api/leads${qs}`);
}

export function getLeadById(id: string): Promise<Lead | undefined> {
  return apiGet<{ lead?: Lead } | Lead | undefined>(`/api/leads/${id}`).then((detail) => ("lead" in (detail ?? {}) ? (detail as { lead?: Lead }).lead : (detail as Lead | undefined)));
}

export function getLeadDetail(id: string) {
  return apiGet<LeadDetail | undefined>(`/api/leads/${id}`);
}

export function sendLeadToQs(id: string) {
  return apiPatch(`/api/leads/${id}`, { action: "send_to_qs" });
}

export function updateLeadStatus(id: string, status: EntityStatus, reason?: string) {
  return apiPatch(`/api/leads/${id}`, { status, reason });
}
