import { apiGet } from "@/services/api/client/http";

export function getReportsSummary() {
  return apiGet("/api/reports");
}
