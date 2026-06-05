import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Role } from "@/constants/roles";
import { authOptions } from "@/lib/auth";

export async function requireSession(roles?: Role[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new ApiError("Unauthorized", 401);
  if (roles?.length && !roles.includes(session.user.role)) throw new ApiError("Forbidden", 403);
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
  if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
  return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
}

export function queryParams(url: string) {
  return Object.fromEntries(new URL(url).searchParams.entries());
}
