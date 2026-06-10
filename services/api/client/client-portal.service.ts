import { apiGet, apiPost } from "@/services/api/client/http";

export type ClientPortalData =
  | { valid: false }
  | {
      valid: true;
      project: {
        name: string;
        code: string;
        status: string;
        location: string;
        manager: string;
        managerContact: string;
        startDate: string;
        expectedCompletion: string;
        progress: number;
        lastUpdate: string;
        contractValue: number;
      };
      progress: Array<{ date: string; title: string; summary: string; percentComplete: number; photos: string[] }>;
      documents: Array<{ name: string; type: string; date: string; downloadUrl: string }>;
      quotation?: { code: string; version: number; status: string; grandTotal: number; validUntil: string; paymentTerms: string; boqLines: Array<{ section: string; itemName: string; description: string; qty: number; unit: string }> };
      payments: Array<{ date: string; amount: number; method: string; reference: string; status: string }>;
    };

export function validateClientPortalToken(token: string) {
  return apiGet<{ valid: boolean }>(`/api/client/portal/${encodeURIComponent(token)}`).then((portal) => ({ valid: portal.valid }));
}

export function getClientPortal(token: string) {
  return apiGet<ClientPortalData>(`/api/client/portal/${encodeURIComponent(token)}`);
}

export function submitClientQuotationResponse(token: string, decision: "approved" | "rejected" | "revision_requested", reason?: string) {
  return apiPost(`/api/client/portal/${encodeURIComponent(token)}`, { decision, reason });
}

export type ClientQuotationPortalData =
  | { valid: false }
  | {
      valid: true;
      quotation: {
        id: number;
        code: string;
        version: number;
        status: string;
        grandTotal: number;
        subtotal: number;
        discount: number;
        taxTotal: number;
        validUntil: string;
        paymentTerms: string;
        notes: string;
        boqLines: Array<{ section: string; itemName: string; description: string; qty: number; unit: string }>;
      };
      client: {
        name: string;
        contactPerson: string;
        email: string;
        phone: string;
      };
    };

export function getClientQuotationPortal(token: string) {
  return apiGet<ClientQuotationPortalData>(`/api/client/portal/quotation/${encodeURIComponent(token)}`);
}

export function submitClientQuotationResponseDirect(token: string, decision: "approved" | "rejected" | "revision_requested", reason?: string) {
  return apiPost(`/api/client/portal/quotation/${encodeURIComponent(token)}`, { decision, reason });
}
