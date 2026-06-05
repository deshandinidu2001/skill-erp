import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import { mapInventory, mapStockItem, mapSupplier } from "@/services/api/mappers";

export async function getInventory() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("site_inventory").select("*, sites(*), materials(*, units_of_measure(*))").order("last_updated", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapInventory(row));
}

export async function getStockItems() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("materials").select("*, units_of_measure(*), suppliers!preferred_supplier_id(*)").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapStockItem(row));
}

export async function getSuppliers() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("suppliers").select("*, supplier_performance(*)").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapSupplier(row));
}
