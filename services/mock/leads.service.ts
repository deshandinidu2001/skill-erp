import { attachments, communications, estimations, leads, notes, quotations } from "@/services/mock/seed";
import { filterRecords, mockDelay } from "@/services/mock/utils";
import type { EntityStatus, FilterParams, Lead } from "@/types";

export async function getLeads(params?: FilterParams): Promise<Lead[]> {
  await mockDelay();
  return filterRecords(leads, params, ["code", "customerName", "title", "owner"]);
}

export async function getLeadById(id: string): Promise<Lead | undefined> {
  await mockDelay();
  return leads.find((lead) => lead.id === id || lead.code === id);
}

export async function getLeadDetail(id: string) {
  await mockDelay();
  const lead = leads.find((item) => item.id === id || item.code === id);
  if (!lead) return undefined;
  return {
    lead,
    estimations: estimations.filter((item) => item.leadId === lead.id || item.leadCode === lead.code),
    quotations: quotations.filter((item) => item.leadId === lead.id || item.leadCode === lead.code),
    communications: communications.filter((item) => item.leadId === lead.id),
    notes: notes.filter((item) => item.parentId === lead.id),
    attachments: attachments.filter((item) => item.parentId === lead.id),
    timeline: [
      { actor: lead.owner, action: "created lead", timestamp: `${lead.createdAt}T09:00:00`, summary: lead.title },
      ...(lead.sentToQsAt
        ? [{ actor: lead.owner, action: "sent lead to QS", timestamp: `${lead.sentToQsAt}T10:30:00`, summary: "QS estimation requested." }]
        : []),
      { actor: "System", action: "updated status", timestamp: `${lead.updatedAt}T14:00:00`, summary: `Current status is ${lead.status}.` },
    ],
  };
}

export async function sendLeadToQs(id: string) {
  await mockDelay();
  const lead = leads.find((item) => item.id === id || item.code === id);
  if (!lead) throw new Error("Lead not found.");
  lead.status = "qs_estimation_pending";
  lead.sentToQsAt = new Date().toISOString().slice(0, 10);
  lead.updatedAt = lead.sentToQsAt;
  return lead;
}

export async function updateLeadStatus(id: string, status: EntityStatus, reason?: string) {
  await mockDelay();
  const lead = leads.find((item) => item.id === id || item.code === id);
  if (!lead) throw new Error("Lead not found.");
  lead.status = status;
  lead.updatedAt = new Date().toISOString().slice(0, 10);
  if (reason) lead.rejectedReason = reason;
  return lead;
}
