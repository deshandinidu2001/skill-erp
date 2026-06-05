import {
  fuelLogs,
  maintenanceLogs,
  meterLogs,
  vehicleAssignments,
  vehicles,
} from "@/services/mock/seed";
import { filterRecords, mockDelay } from "@/services/mock/utils";
import type { FilterParams, Vehicle } from "@/types";

export async function getVehicles(params?: FilterParams): Promise<Vehicle[]> {
  await mockDelay();
  return filterRecords(vehicles, params, ["code", "registrationNo", "type"]);
}

export async function getVehicleById(id: string) {
  await mockDelay();
  const vehicle = vehicles.find((item) => item.id === id || item.code === id || item.registrationNo === id);
  if (!vehicle) return undefined;
  return {
    vehicle,
    assignments: vehicleAssignments.filter((item) => item.vehicleId === vehicle.id),
    meterLogs: meterLogs.filter((item) => item.vehicleId === vehicle.id),
    maintenanceLogs: maintenanceLogs.filter((item) => item.vehicleId === vehicle.id),
    fuelLogs: fuelLogs.filter((item) => item.vehicleId === vehicle.id),
    timeline: [
      ...vehicleAssignments.filter((item) => item.vehicleId === vehicle.id).map((item) => ({ actor: "Vehicle Manager", action: "assigned vehicle", timestamp: `${item.from}T09:00:00`, summary: item.project })),
      ...maintenanceLogs.filter((item) => item.vehicleId === vehicle.id).map((item) => ({ actor: "Fleet", action: "logged maintenance", timestamp: `${item.date}T10:00:00`, summary: item.description })),
      ...fuelLogs.filter((item) => item.vehicleId === vehicle.id).map((item) => ({ actor: "Fleet", action: "logged fuel", timestamp: `${item.date}T11:00:00`, summary: `${item.liters}L` })),
    ],
  };
}

export async function createVehicle(input: Vehicle) {
  await mockDelay();
  if (!input.registrationNumber && !input.registrationNo) throw new Error("Registration number is required.");
  if (vehicles.some((item) => item.registrationNo === input.registrationNo || item.registrationNumber === input.registrationNumber)) {
    throw new Error("Registration number must be unique.");
  }
  if (!input.insuranceExpiry || !input.licenseExpiry) throw new Error("Insurance and license expiry are required.");
  vehicles.unshift(input);
  return input;
}

export function requiresAssignmentWarning(vehicle: Vehicle) {
  return vehicle.status === "maintenance" || vehicle.status === "unavailable";
}
