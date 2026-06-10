import { apiGet, apiPost, asArray } from "@/services/api/client/http";
import type { FuelLog, MaintenanceLog, MeterLog, Vehicle, VehicleAssignment, FilterParams } from "@/types";

export type VehicleDetail = {
  vehicle: Vehicle;
  assignments: VehicleAssignment[];
  meterLogs: MeterLog[];
  maintenanceLogs: MaintenanceLog[];
  fuelLogs: FuelLog[];
  timeline: Array<{ actor: string; action: string; timestamp: string; summary: string }>;
};

export async function getVehicles(params?: FilterParams): Promise<Vehicle[]> {
  const qs = params ? `?${new URLSearchParams(params as Record<string, string>)}` : "";
  return asArray<Vehicle>(await apiGet(`/api/vehicles${qs}`));
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

export function assignVehicle(id: string, payload: { projectId: string; employeeId?: string; assignedDate?: string }) {
  return apiPost(`/api/vehicles/${id}`, { action: "assign", ...payload });
}

export function logMeterReading(id: string, payload: { reading: number; notes?: string; date?: string }) {
  return apiPost(`/api/vehicles/${id}`, { action: "log_meter", ...payload });
}

export function logFuelUsage(id: string, payload: { liters: number; cost: number; odometer?: number; station?: string; date?: string }) {
  return apiPost(`/api/vehicles/${id}`, { action: "log_fuel", ...payload });
}

export function logMaintenanceRecord(id: string, payload: { description: string; cost: number; nextDue?: string; date?: string }) {
  return apiPost(`/api/vehicles/${id}`, { action: "log_maintenance", ...payload });
}

export function updateVehicleStatus(id: string, status: string) {
  return apiPost(`/api/vehicles/${id}`, { action: "update_status", status });
}
