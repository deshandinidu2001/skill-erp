import { apiGet, apiPatch, asArray } from "@/services/api/client/http";
import type { ActivityItem, Attachment, ClientPayment, EntityStatus, FilterParams, InventoryBalance, JournalEntry, PettyCash, Project, ProjectExpense, ProjectProgressUpdate, ProjectTeamAssignment, ProjectVehicleAssignment, PurchaseOrder, Quotation, StockRequest } from "@/types";

export type ProjectDetail = {
  project: Project;
  quotation?: Quotation;
  team: ProjectTeamAssignment[];
  progressUpdates: ProjectProgressUpdate[];
  expenses: ProjectExpense[];
  payments: ClientPayment[];
  stockRequests: StockRequest[];
  purchaseOrders: PurchaseOrder[];
  vehicles: ProjectVehicleAssignment[];
  documents: Attachment[];
  pettyCash: PettyCash[];
  journalEntries: JournalEntry[];
  inventory: InventoryBalance[];
  timeline: ActivityItem[];
};

export async function getProjects(params?: FilterParams): Promise<Project[]> {
  const qs = params ? `?${new URLSearchParams(params as Record<string, string>)}` : "";
  return asArray<Project>(await apiGet(`/api/projects${qs}`));
}

export function getProjectById(id: string): Promise<Project | undefined> {
  return apiGet<{ project?: Project } | Project | undefined>(`/api/projects/${id}`).then((detail) => ("project" in (detail ?? {}) ? (detail as { project?: Project }).project : (detail as Project | undefined)));
}

export function getProjectDetail(id: string) {
  return apiGet<ProjectDetail | undefined>(`/api/projects/${id}`);
}

export function changeProjectStatus(projectId: string, toStatus: EntityStatus, reason?: string) {
  return apiPatch(`/api/projects/${projectId}`, { status: toStatus, reason });
}

export function addProjectExpense(projectId: string, expense: Pick<ProjectExpense, "category" | "date" | "vendorOrPayee" | "amount" | "paymentMethod" | "notes">) {
  return apiPatch(`/api/projects/${projectId}`, { action: "add_expense", expense });
}

export function createFromQuotation(quotationId: string): Promise<Project> {
  return apiPostProjectFromQuotation(quotationId);
}

async function apiPostProjectFromQuotation(quotationId: string): Promise<Project> {
  const { apiPost } = await import("@/services/api/client/http");
  return apiPost("/api/projects", { quotationId });
}
