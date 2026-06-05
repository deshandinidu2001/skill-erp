import {
  attachments,
  clientPayments,
  employees,
  inventoryBalances,
  journalEntries,
  pettyCash,
  projectExpenses,
  projectProgressUpdates,
  projects,
  projectStatusLogs,
  projectTeams,
  projectVehicles,
  purchaseOrders,
  quotations,
  stockRequests,
  vehicles,
} from "@/services/mock/seed";
import { filterRecords, mockDelay } from "@/services/mock/utils";
import type { EntityStatus, FilterParams, Project, ProjectExpense, ProjectTeamAssignment } from "@/types";

export async function getProjects(params?: FilterParams): Promise<Project[]> {
  await mockDelay();
  return filterRecords(projects, params, ["code", "name", "client", "manager", "site"]);
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  await mockDelay();
  return projects.find((item) => item.id === id || item.code === id);
}

export async function getProjectDetail(id: string) {
  await mockDelay();
  const project = projects.find((item) => item.id === id || item.project_id === id || item.code === id);
  if (!project) return undefined;
  return {
    project,
    quotation: quotations.find((item) => item.id === project.quotationId || item.code === project.quotationCode),
    team: projectTeams.filter((item) => item.project_id === project.project_id),
    progressUpdates: projectProgressUpdates.filter((item) => item.project_id === project.project_id),
    expenses: projectExpenses.filter((item) => item.project_id === project.project_id),
    payments: clientPayments.filter((item) => item.project_id === project.project_id),
    stockRequests: stockRequests.filter((item) => item.project_id === project.project_id),
    purchaseOrders: purchaseOrders.filter((item) => item.project_id === project.project_id),
    vehicles: projectVehicles.filter((item) => item.project_id === project.project_id),
    documents: attachments.filter((item) => item.parentId === project.project_id),
    pettyCash: pettyCash.filter((item) => item.project_id === project.project_id),
    journalEntries: journalEntries.filter((item) => item.project_id === project.project_id),
    inventory: inventoryBalances.filter((item) => item.project_id === project.project_id),
    timeline: [
      { actor: "System", action: "created project", timestamp: `${project.startDate}T08:00:00`, summary: project.name },
      ...projectStatusLogs
        .filter((item) => item.project_id === project.project_id)
        .map((item) => ({ actor: item.changedBy, action: "changed status", timestamp: `${item.changedAt}T10:00:00`, summary: `${item.fromStatus} to ${item.toStatus}` })),
      ...projectExpenses
        .filter((item) => item.project_id === project.project_id)
        .map((item) => ({ actor: "Accounting", action: "added expense", timestamp: `${item.date}T11:00:00`, summary: `${item.code} ${item.amount}` })),
      ...clientPayments
        .filter((item) => item.project_id === project.project_id)
        .map((item) => ({ actor: "Finance", action: "received payment", timestamp: `${item.date}T12:00:00`, summary: `${item.code} ${item.amount}` })),
    ],
  };
}

export async function changeProjectStatus(projectId: string, toStatus: EntityStatus, reason?: string) {
  await mockDelay();
  const project = projects.find((item) => item.id === projectId || item.project_id === projectId || item.code === projectId);
  if (!project) throw new Error("Project not found.");
  if (toStatus === "closed" && projectExpenses.some((item) => item.project_id === project.project_id && item.approvalStatus === "pending")) {
    throw new Error("Cannot close project with pending expenses.");
  }
  projectStatusLogs.unshift({
    id: `psl_${Date.now()}`,
    project_id: project.project_id,
    fromStatus: project.status,
    toStatus,
    reason,
    changedBy: "Current User",
    changedAt: new Date().toISOString().slice(0, 10),
  });
  project.status = toStatus;
  if (toStatus === "cancelled") project.cancellationReason = reason || "Cancelled by project manager.";
  return project;
}

export async function assignTeamMember(projectId: string, employeeId: string, roleOnProject: string): Promise<ProjectTeamAssignment> {
  await mockDelay();
  const project = projects.find((item) => item.id === projectId || item.project_id === projectId);
  const employee = employees.find((item) => item.id === employeeId);
  if (!project || !employee) throw new Error("Project or employee not found.");
  if (employee.status !== "active") throw new Error("Cannot assign inactive employee.");
  if (projectTeams.some((item) => item.project_id === project.project_id && item.employeeId === employeeId && item.status === "active")) {
    throw new Error("Employee is already assigned to this project.");
  }
  const assignment = {
    id: `pta_${Date.now()}`,
    project_id: project.project_id,
    employeeId,
    employeeName: employee.name,
    roleOnProject,
    assignedDate: new Date().toISOString().slice(0, 10),
    status: "active" as const,
  };
  projectTeams.unshift(assignment);
  return assignment;
}

export async function addProjectExpense(projectId: string, expense: Pick<ProjectExpense, "category" | "date" | "vendorOrPayee" | "amount" | "paymentMethod" | "notes">) {
  await mockDelay();
  const project = projects.find((item) => item.id === projectId || item.project_id === projectId);
  if (!project) throw new Error("Project not found.");
  if (!expense.category || expense.amount <= 0) throw new Error("Expense must have category and amount greater than 0.");
  const row: ProjectExpense = {
    id: `pex_${Date.now()}`,
    project_id: project.project_id,
    code: `EXP-${1000 + projectExpenses.length + 1}`,
    approvalStatus: "pending",
    ...expense,
  };
  projectExpenses.unshift(row);
  journalEntries.unshift({
    id: `je_${Date.now()}`,
    project_id: project.project_id,
    code: `JE-${1000 + journalEntries.length + 1}`,
    date: expense.date,
    description: `Expense ${row.code}`,
    debit: 0,
    credit: expense.amount,
  });
  return row;
}

export async function issuePettyCash(projectId: string, employeeId: string, amount: number, allocatedAmount: number, notes?: string) {
  await mockDelay();
  const project = projects.find((item) => item.id === projectId || item.project_id === projectId);
  const employee = employees.find((item) => item.id === employeeId);
  if (!project || !employee) throw new Error("Project or employee not found.");
  if (amount > allocatedAmount) throw new Error("Petty cash cannot exceed allocated amount.");
  const row = {
    id: `pc_${Date.now()}`,
    project_id: project.project_id,
    employeeId,
    employeeName: employee.name,
    amount,
    allocatedAmount,
    issued: new Date().toISOString().slice(0, 10),
    settled: 0,
    status: "issued" as const,
    notes,
  };
  pettyCash.unshift(row);
  return row;
}

export async function createFromQuotation(quotationId: string): Promise<Project> {
  await mockDelay();
  const quotation = quotations.find((item) => item.id === quotationId || item.code === quotationId);
  if (!quotation) throw new Error("Quotation not found.");

  const project: Project = {
    id: `prj_${Date.now()}`,
    project_id: `prj_${Date.now()}`,
    code: `PRJ-${4000 + projects.length + 1}`,
    name: `${quotation.leadCode} - Approved works`,
    client: quotation.customerName,
    customer: quotation.customerName,
    status: "ongoing",
    manager: "Kasun Jayasinghe",
    progress: 0,
    site: "To be assigned",
    siteName: "To be assigned",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString().slice(0, 10),
    budget: quotation.grandTotal,
    quotationId: quotation.id,
    quotationCode: quotation.code,
    quotationVersion: quotation.version,
  };
  project.project_id = project.id;
  projects.unshift(project);
  return project;
}
