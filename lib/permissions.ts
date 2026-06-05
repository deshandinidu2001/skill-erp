import type { Role } from "@/constants/roles";

export type PermissionSet = {
  modules: string[];
  canCreate: string[];
  canEdit: string[];
  canApprove: string[];
  canDelete: string[];
  canViewFinancials: boolean;
  canManageUsers: boolean;
};

export const PERMISSIONS: Record<Role, PermissionSet> = {
  super_admin: {
    modules: ["*"],
    canCreate: ["*"],
    canEdit: ["*"],
    canApprove: ["*"],
    canDelete: ["*"],
    canViewFinancials: true,
    canManageUsers: true,
  },
  hr_manager: {
    modules: ["dashboard", "hr", "reports"],
    canCreate: ["employee", "attendance", "payroll"],
    canEdit: ["employee", "attendance", "payroll"],
    canApprove: ["leave", "payroll"],
    canDelete: [],
    canViewFinancials: false,
    canManageUsers: false,
  },
  hr_executive: {
    modules: ["dashboard", "hr", "reports"],
    canCreate: ["employee", "attendance"],
    canEdit: ["employee", "attendance"],
    canApprove: [],
    canDelete: [],
    canViewFinancials: false,
    canManageUsers: false,
  },
  marketing_manager: {
    modules: ["dashboard", "marketing", "quotations", "projects", "reports"],
    canCreate: ["lead", "lead_communication", "quotation"],
    canEdit: ["lead", "quotation"],
    canApprove: ["lead", "quotation"],
    canDelete: [],
    canViewFinancials: false,
    canManageUsers: false,
  },
  marketing_executive: {
    modules: ["dashboard", "marketing", "reports"],
    canCreate: ["lead", "lead_communication"],
    canEdit: ["lead"],
    canApprove: [],
    canDelete: [],
    canViewFinancials: false,
    canManageUsers: false,
  },
  qs_manager: {
    modules: ["dashboard", "qs", "quotations", "stock", "reports"],
    canCreate: ["estimation", "boq", "quotation"],
    canEdit: ["estimation", "boq", "quotation"],
    canApprove: ["estimation", "quotation"],
    canDelete: [],
    canViewFinancials: false,
    canManageUsers: false,
  },
  qs_engineer: {
    modules: ["dashboard", "qs", "quotations", "stock", "reports"],
    canCreate: ["estimation", "boq"],
    canEdit: ["estimation", "boq"],
    canApprove: [],
    canDelete: [],
    canViewFinancials: false,
    canManageUsers: false,
  },
  stock_manager: {
    modules: ["dashboard", "stock", "reports"],
    canCreate: ["stock_request", "purchase_order", "inventory_item"],
    canEdit: ["stock_request", "purchase_order", "inventory_item"],
    canApprove: ["stock_request", "purchase_order"],
    canDelete: [],
    canViewFinancials: false,
    canManageUsers: false,
  },
  store_keeper: {
    modules: ["dashboard", "stock", "reports"],
    canCreate: ["stock_request", "inventory_movement"],
    canEdit: ["inventory_item"],
    canApprove: [],
    canDelete: [],
    canViewFinancials: false,
    canManageUsers: false,
  },
  project_manager: {
    modules: ["dashboard", "projects", "stock", "reports"],
    canCreate: ["project_task", "stock_request"],
    canEdit: ["project", "project_task", "stock_request"],
    canApprove: ["stock_request", "work_order"],
    canDelete: [],
    canViewFinancials: false,
    canManageUsers: false,
  },
  technical_officer: {
    modules: ["dashboard", "projects", "reports"],
    canCreate: ["site_update", "measurement"],
    canEdit: ["site_update", "measurement"],
    canApprove: [],
    canDelete: [],
    canViewFinancials: false,
    canManageUsers: false,
  },
  accountant: {
    modules: ["dashboard", "projects", "accounting", "reports"],
    canCreate: ["ledger_entry", "cash_book_entry", "payment"],
    canEdit: ["ledger_entry", "cash_book_entry"],
    canApprove: [],
    canDelete: [],
    canViewFinancials: true,
    canManageUsers: false,
  },
  finance_manager: {
    modules: ["dashboard", "projects", "stock", "accounting", "reports"],
    canCreate: ["ledger_entry", "cash_book_entry", "payment"],
    canEdit: ["ledger_entry", "cash_book_entry", "payment"],
    canApprove: ["payment", "journal_entry"],
    canDelete: [],
    canViewFinancials: true,
    canManageUsers: false,
  },
  vehicle_manager: {
    modules: ["dashboard", "projects", "vehicles", "reports"],
    canCreate: ["vehicle", "vehicle_assignment", "maintenance"],
    canEdit: ["vehicle", "vehicle_assignment", "maintenance"],
    canApprove: ["maintenance"],
    canDelete: [],
    canViewFinancials: false,
    canManageUsers: false,
  },
  viewer: {
    modules: ["dashboard", "marketing", "qs", "quotations", "projects", "vehicles", "accounting", "reports"],
    canCreate: [],
    canEdit: [],
    canApprove: [],
    canDelete: [],
    canViewFinancials: false,
    canManageUsers: false,
  },
  client_user: {
    modules: ["client"],
    canCreate: [],
    canEdit: [],
    canApprove: [],
    canDelete: [],
    canViewFinancials: false,
    canManageUsers: false,
  },
};

export function hasModuleAccess(role: Role | undefined, module: string) {
  if (!role) return false;
  const permission = PERMISSIONS[role];
  return permission.modules.includes("*") || permission.modules.includes(module);
}

export function canPerform(
  role: Role | undefined,
  action: "create" | "edit" | "approve" | "delete" | "viewFinancials" | "manageUsers",
  resource = "",
) {
  if (!role) return false;
  const permission = PERMISSIONS[role];
  if (action === "viewFinancials") return permission.canViewFinancials;
  if (action === "manageUsers") return permission.canManageUsers;

  const key = {
    create: "canCreate",
    edit: "canEdit",
    approve: "canApprove",
    delete: "canDelete",
  }[action] as "canCreate" | "canEdit" | "canApprove" | "canDelete";

  return permission[key].includes("*") || permission[key].includes(resource);
}

export function moduleFromPath(pathname: string) {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment === "client") return "client";
  return segment || "dashboard";
}
