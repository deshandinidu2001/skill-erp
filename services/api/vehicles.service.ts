import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { auditLog, idSchema, resolveId } from "@/services/api/common";
import { mapVehicle } from "@/services/api/mappers";
import type { FilterParams, Vehicle } from "@/types";

const schema = z.object({
  registrationNumber: z.string().min(1),
  category: z.string().min(1),
  ownershipStatus: z.enum(["owned", "leased"]).default("owned"),
  insuranceExpiry: z.string().min(1),
  licenseExpiry: z.string().min(1),
  meterReading: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

export async function getVehicles(filters?: FilterParams) {
  const supabase = createAdminClient();
  let query = supabase.from("vehicles").select("*").order("registration_no");
  if (filters?.status) query = query.eq("status", filters.status === "maintenance" ? "under_maintenance" : filters.status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapVehicle(row));
}

export async function getVehicleById(id: string) {
  const supabase = createAdminClient();
  const numericId = await resolveId("vehicles", idSchema.parse(id), "registration_no");
  if (!numericId) return undefined;
  const { data, error } = await supabase.from("vehicles").select("*").eq("id", numericId).single();
  if (error) throw new Error(error.message);
  const vehicle = mapVehicle(data);
  const [{ data: assignments }, { data: meterLogs }, { data: maintenanceLogs }, { data: fuelLogs }] = await Promise.all([
    supabase.from("vehicle_assignments").select("*").eq("vehicle_id", numericId),
    supabase.from("vehicle_meter_logs").select("*").eq("vehicle_id", numericId),
    supabase.from("vehicle_maintenance_logs").select("*").eq("vehicle_id", numericId),
    supabase.from("vehicle_fuel_logs").select("*").eq("vehicle_id", numericId),
  ]);
  return { vehicle, assignments: assignments ?? [], meterLogs: meterLogs ?? [], maintenanceLogs: maintenanceLogs ?? [], fuelLogs: fuelLogs ?? [], timeline: [] };
}

export async function createVehicle(payload: unknown, userId: string) {
  const input = schema.parse(payload);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      registration_no: input.registrationNumber,
      make: input.category,
      model: input.notes,
      ownership: input.ownershipStatus,
      current_meter: input.meterReading ?? 0,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  await auditLog({ userId, action: "create", module: "vehicles", recordId: data.id, newValues: data });
  return mapVehicle(data);
}

export function requiresAssignmentWarning(vehicle: Vehicle) {
  return vehicle.status === "maintenance" || vehicle.status === "unavailable";
}
