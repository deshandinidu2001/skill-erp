import { estimations } from "@/services/mock/seed";
import { filterRecords, mockDelay } from "@/services/mock/utils";
import type { Estimation, FilterParams } from "@/types";

export async function getEstimations(params?: FilterParams): Promise<Estimation[]> {
  await mockDelay();
  return filterRecords(estimations, params, ["code", "leadCode", "leadTitle", "customerName", "projectType", "estimator"]);
}

export async function getEstimationById(id: string): Promise<Estimation | undefined> {
  await mockDelay();
  return estimations.find((item) => item.id === id || item.code === id);
}

export async function markEstimationReady(id: string) {
  await mockDelay();
  const estimation = estimations.find((item) => item.id === id || item.code === id);
  if (!estimation) throw new Error("Estimation not found.");
  estimation.status = "ready";
  estimation.updatedAt = new Date().toISOString().slice(0, 10);
  return estimation;
}
