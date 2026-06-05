import { apiGet, apiPost } from "@/services/api/client/http";
import type { FuelLog, MaintenanceLog, MeterLog, Vehicle, VehicleAssignment, FilterParams } from "@/types";

export type VehicleDetail = {
  vehicle: Vehicle;
  assignments: VehicleAssignment[];
  meterLogs: MeterLog[];
  maintenanceLogs: MaintenanceLog[];
  fuelLogs: FuelLog[];
  timeline: Array<{ actor: string; action: string; timestamp: string; summary: string }>;
};

export function getVehicles(params?: FilterParams): Promise<Vehicle[]> {
  const qs = params ? `?${new URLSearchParams(params as Record<string, string>)}` : "";
  return apiGet(`/api/vehicles${qs}`);
}

export function getVehicleById(id: string) {
  return apiGet<VehicleDetail | undefined>(`/api/vehicles/${id}`);
}

export function createVehicle(input: Vehicle) {
  return apiPost("/api/vehicles", input);
}

export function requiresAssignmentWarning(vehicle: Vehicle) {
  return vehicle.status === "maintenance" || vehicle.status === "unavailable";
}
