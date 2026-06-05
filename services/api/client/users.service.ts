import { apiGet, apiPost } from "@/services/api/client/http";
import type { AppUser } from "@/types";

export function getUsers(): Promise<AppUser[]> {
  return apiGet("/api/users");
}

export function upsertAppUser(input: unknown) {
  return apiPost("/api/users", input);
}
