import { apiGet } from "@/services/api/client/http";
import type { Role } from "@/constants/roles";

export function getLedger(_role: Role) {
  return apiGet("/api/accounting");
}

export function getCashBook(_role: Role) {
  return apiGet("/api/accounting?view=cash-book");
}
