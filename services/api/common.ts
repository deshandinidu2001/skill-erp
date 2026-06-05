import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

export const idSchema = z.union([z.string().min(1), z.number().int().positive()]).transform(String);

export function asNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function toDate(value: unknown) {
  return typeof value === "string" ? value.slice(0, 10) : "";
}

export function generateCode(prefix: string, count: number) {
  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
}

export async function auditLog(input: {
  userId?: string;
  action: "create" | "update" | "delete";
  module: string;
  recordId?: string | number;
  oldValues?: unknown;
  newValues?: unknown;
}) {
  const supabase = createAdminClient();
  await supabase.from("audit_logs").insert({
    user_id: input.userId,
    action: input.action,
    module: input.module,
    record_id: input.recordId == null ? undefined : String(input.recordId),
    old_values: input.oldValues,
    new_values: input.newValues,
  });
}

export async function countRows(table: string) {
  const supabase = createAdminClient();
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export function getRelated(row: Record<string, unknown>, key: string) {
  const value = row[key];
  return Array.isArray(value) ? (value[0] as Record<string, unknown> | undefined) : (value as Record<string, unknown> | undefined);
}

export async function resolveId(table: string, idOrCode: string, codeColumn: string) {
  const supabase = createAdminClient();
  const numericId = Number(idOrCode);
  const query = Number.isFinite(numericId)
    ? supabase.from(table).select("id").eq("id", numericId).maybeSingle()
    : supabase.from(table).select("id").eq(codeColumn, idOrCode).maybeSingle();
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as { id: number } | null)?.id;
}
