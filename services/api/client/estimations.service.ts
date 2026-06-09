import { apiGet, apiPatch, asArray } from "@/services/api/client/http";
import type { Estimation, FilterParams } from "@/types";

export async function getEstimations(params?: FilterParams): Promise<Estimation[]> {
  const qs = params ? `?${new URLSearchParams(params as Record<string, string>)}` : "";
  return asArray<Estimation>(await apiGet(`/api/estimations${qs}`));
}

export function getEstimationById(id: string): Promise<Estimation | undefined> {
  return apiGet(`/api/estimations/${id}`);
}

export function markEstimationReady(id: string) {
  return apiPatch(`/api/estimations/${id}`, { action: "ready" });
}
