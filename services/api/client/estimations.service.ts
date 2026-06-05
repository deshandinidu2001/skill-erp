import { apiGet, apiPatch } from "@/services/api/client/http";
import type { Estimation, FilterParams } from "@/types";

export function getEstimations(params?: FilterParams): Promise<Estimation[]> {
  const qs = params ? `?${new URLSearchParams(params as Record<string, string>)}` : "";
  return apiGet(`/api/estimations${qs}`);
}

export function getEstimationById(id: string): Promise<Estimation | undefined> {
  return apiGet(`/api/estimations/${id}`);
}

export function markEstimationReady(id: string) {
  return apiPatch(`/api/estimations/${id}`, { action: "ready" });
}
