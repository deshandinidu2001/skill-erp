export const ROLES = [
  "super_admin",
  "hr_manager",
  "hr_executive",
  "marketing_manager",
  "marketing_executive",
  "qs_manager",
  "qs_engineer",
  "stock_manager",
  "store_keeper",
  "project_manager",
  "technical_officer",
  "accountant",
  "finance_manager",
  "vehicle_manager",
  "viewer",
  "client_user",
] as const;

export type Role = (typeof ROLES)[number];

export const INTERNAL_ROLES = ROLES.filter((role) => role !== "client_user");

export const roleLabels: Record<Role, string> = {
  super_admin: "Super Admin",
  hr_manager: "HR Manager",
  hr_executive: "HR Executive",
  marketing_manager: "Marketing Manager",
  marketing_executive: "Marketing Executive",
  qs_manager: "QS Manager",
  qs_engineer: "QS Engineer",
  stock_manager: "Stock Manager",
  store_keeper: "Store Keeper",
  project_manager: "Project Manager",
  technical_officer: "Technical Officer",
  accountant: "Accountant",
  finance_manager: "Finance Manager",
  vehicle_manager: "Vehicle Manager",
  viewer: "Viewer",
  client_user: "Client User",
};
