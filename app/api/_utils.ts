import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Role } from "@/constants/roles";
import { authOptions } from "@/lib/auth";

import { createAdminClient } from "@/lib/supabase/server";

export async function requireSession(roles?: Role[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new ApiError("Unauthorized", 401);
  if (roles?.length && !roles.includes(session.user.role)) throw new ApiError("Forbidden", 403);

  // Resolve mock/demo ID to the actual database UUID from app_users
  if (session.user.email) {
    const supabase = createAdminClient();
    const { data: userRow } = await supabase
      .from("app_users")
      .select("id")
      .eq("email", session.user.email)
      .maybeSingle();
    if (userRow) {
      session.user.id = userRow.id;
    }
  }

  return session;
}

export class ApiError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function errorResponse(error: unknown) {
  console.error("[API ERROR LOG]:", error);
  if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
  return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
}

export function queryParams(url: string) {
  return Object.fromEntries(new URL(url).searchParams.entries());
}
