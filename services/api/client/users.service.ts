import { apiGet, apiPost, asArray } from "@/services/api/client/http";
import type { AppUser } from "@/types";

export async function getUsers(): Promise<AppUser[]> {
  return asArray<AppUser>(await apiGet("/api/users"));
}

export function upsertAppUser(input: unknown) {
  return apiPost("/api/users", input);
}
