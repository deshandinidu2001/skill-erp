import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { auditLog } from "@/services/api/common";
import { mapAttendance } from "@/services/api/mappers";

const rowSchema = z.object({
  employeeId: z.string().min(1),
  site_id: z.number().int().positive().optional(),
  date: z.string().min(1),
  status: z.enum(["present", "absent", "leave", "unpaid"]),
  shift: z.string().optional(),
  remarks: z.string().optional(),
});

export async function getAttendance(site?: string, date?: string) {
  const supabase = createAdminClient();
  let query = supabase.from("attendance").select("*, employees(*), sites(*)").order("attendance_date", { ascending: false });
  if (site) query = query.eq("site_id", Number(site));
  if (date) query = query.eq("attendance_date", date);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapAttendance(row));
}

export async function saveAttendance(rows: unknown, override = false, userId?: string) {
  const parsed = z.array(rowSchema).parse(rows);
  if (!override && parsed.some((row) => Date.now() - new Date(row.date).getTime() > 2 * 24 * 60 * 60 * 1000)) throw new Error("Cannot edit attendance more than two days past without HR manager override.");
  const supabase = createAdminClient();
  const upserts = parsed.map((row) => ({ employee_id: Number(row.employeeId), site_id: row.site_id, attendance_date: row.date, status: row.status, shift: row.shift, remarks: row.remarks, recorded_by: userId }));
  const { data, error } = await supabase.from("attendance").upsert(upserts, { onConflict: "employee_id,attendance_date" }).select("*, employees(*), sites(*)");
  if (error) throw new Error(error.message);
  await auditLog({ userId, action: "update", module: "attendance", newValues: upserts });
  return (data ?? []).map((row) => mapAttendance(row));
}

export async function getAttendanceSummary() {
  const rows = await getAttendance(undefined, new Date().toISOString().slice(0, 10));
  return {
    present: rows.filter((row) => row.status === "present").length,
    absent: rows.filter((row) => row.status === "absent").length,
    late: 0,
  };
}
