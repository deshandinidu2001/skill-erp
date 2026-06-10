import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { auditLog, idSchema, resolveId } from "@/services/api/common";
import { mapVehicle } from "@/services/api/mappers";
import type { FilterParams, Vehicle } from "@/types";

const schema = z.object({
  registrationNumber: z.string().min(1),
  vehicleCode: z.string().optional().nullable(),
  category: z.string().min(1),
  ownershipStatus: z.enum(["owned", "leased"]).default("owned"),
  currentStatus: z.string().optional().nullable(),
  insuranceExpiry: z.string().min(1),
  licenseExpiry: z.string().min(1),
  meterReading: z.number().nonnegative().optional(),
  notes: z.string().optional().nullable(),
});

async function resolveVehicleId(id: string) {
  const supabase = createAdminClient();
  const numericId = Number(id);
  if (Number.isFinite(numericId) && !isNaN(numericId)) {
    const { data } = await supabase.from("vehicles").select("id").eq("id", numericId).maybeSingle();
    if (data) return data.id;
  }
  // Try vehicle_code first
  const { data: byCode } = await supabase.from("vehicles").select("id").eq("vehicle_code", id).maybeSingle();
  if (byCode) return byCode.id;
  // Try registration_no as fallback
  const { data: byReg } = await supabase.from("vehicles").select("id").eq("registration_no", id).maybeSingle();
  if (byReg) return byReg.id;
  
  return undefined;
}

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
  const numericId = await resolveVehicleId(idSchema.parse(id));
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

  let code = input.vehicleCode;
  if (!code) {
    const { data: lastVeh } = await supabase
      .from("vehicles")
      .select("vehicle_code")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    let nextNum = 1;
    if (lastVeh?.vehicle_code?.startsWith("VEH-")) {
      const match = lastVeh.vehicle_code.match(/VEH-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    code = `VEH-${String(nextNum).padStart(3, "0")}`;
  }

  const rawStatus = input.currentStatus || "available";
  const dbStatus = rawStatus === "maintenance" ? "under_maintenance" : rawStatus;

  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      registration_no: input.registrationNumber,
      registration_number: input.registrationNumber,
      vehicle_code: code,
      make: input.category,
      model: input.notes || null,
      category: input.category,
      ownership: input.ownershipStatus,
      ownership_status: input.ownershipStatus,
      status: dbStatus,
      current_status: dbStatus,
      current_meter: input.meterReading ?? 0,
      current_meter_reading: input.meterReading ?? 0,
      insurance_expiry: input.insuranceExpiry,
      license_expiry: input.licenseExpiry,
      notes: input.notes || null,
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

export async function assignVehicle(id: string, data: any, userId: string) {
  const supabase = createAdminClient();
  const numericId = await resolveVehicleId(idSchema.parse(id));
  if (!numericId) throw new Error("Vehicle not found.");

  let projectId = data.projectId;
  if (projectId && isNaN(Number(projectId))) {
    projectId = await resolveId("projects", idSchema.parse(projectId), "project_code");
  }

  let employeeId = data.employeeId;
  if (employeeId && isNaN(Number(employeeId))) {
    employeeId = await resolveId("employees", idSchema.parse(employeeId), "employee_code");
  }

  const { data: assignment, error } = await supabase
    .from("vehicle_assignments")
    .insert({
      vehicle_id: numericId,
      project_id: projectId ? Number(projectId) : null,
      employee_id: employeeId ? Number(employeeId) : null,
      assigned_from: data.assignedDate || new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("vehicles").update({ status: "assigned", current_status: "assigned" }).eq("id", numericId);

  await auditLog({ userId, action: "create", module: "vehicle_assignments", recordId: assignment.id, newValues: assignment });
  return assignment;
}

export async function logMeter(id: string, data: any, userId: string) {
  const supabase = createAdminClient();
  const numericId = await resolveVehicleId(idSchema.parse(id));
  if (!numericId) throw new Error("Vehicle not found.");

  const { data: log, error } = await supabase
    .from("vehicle_meter_logs")
    .insert({
      vehicle_id: numericId,
      meter_reading: Number(data.reading),
      notes: data.notes || null,
      logged_at: data.date ? `${data.date}T12:00:00Z` : new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from("vehicles")
    .update({
      current_meter: Number(data.reading),
      current_meter_reading: Number(data.reading),
    })
    .eq("id", numericId);

  await auditLog({ userId, action: "create", module: "vehicle_meter_logs", recordId: log.id, newValues: log });
  return log;
}

export async function logFuel(id: string, data: any, userId: string) {
  const supabase = createAdminClient();
  const numericId = await resolveVehicleId(idSchema.parse(id));
  if (!numericId) throw new Error("Vehicle not found.");

  const { data: log, error } = await supabase
    .from("vehicle_fuel_logs")
    .insert({
      vehicle_id: numericId,
      fuel_date: data.date || new Date().toISOString().slice(0, 10),
      liters: Number(data.liters),
      cost: Number(data.cost),
      station: data.station || null,
      meter_reading: data.odometer ? Number(data.odometer) : null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (data.odometer) {
    const { data: vehicle } = await supabase.from("vehicles").select("current_meter").eq("id", numericId).single();
    if (vehicle && Number(data.odometer) > Number(vehicle.current_meter)) {
      await supabase
        .from("vehicles")
        .update({
          current_meter: Number(data.odometer),
          current_meter_reading: Number(data.odometer),
        })
        .eq("id", numericId);
    }
  }

  await auditLog({ userId, action: "create", module: "vehicle_fuel_logs", recordId: log.id, newValues: log });
  return log;
}

export async function logMaintenance(id: string, data: any, userId: string) {
  const supabase = createAdminClient();
  const numericId = await resolveVehicleId(idSchema.parse(id));
  if (!numericId) throw new Error("Vehicle not found.");

  const { data: log, error } = await supabase
    .from("vehicle_maintenance_logs")
    .insert({
      vehicle_id: numericId,
      service_date: data.date || new Date().toISOString().slice(0, 10),
      description: data.description,
      cost: Number(data.cost),
      next_service_date: data.nextDue || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await auditLog({ userId, action: "create", module: "vehicle_maintenance_logs", recordId: log.id, newValues: log });
  return log;
}

export async function updateVehicleStatus(id: string, status: string, userId: string) {
  const supabase = createAdminClient();
  const numericId = await resolveVehicleId(idSchema.parse(id));
  if (!numericId) throw new Error("Vehicle not found.");

  const dbStatus = status === "maintenance" ? "under_maintenance" : status;
  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .update({ status: dbStatus, current_status: dbStatus })
    .eq("id", numericId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await auditLog({ userId, action: "update", module: "vehicles", recordId: numericId, newValues: { status: dbStatus } });
  return mapVehicle(vehicle);
}
