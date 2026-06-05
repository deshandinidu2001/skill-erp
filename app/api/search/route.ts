import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { hasModuleAccess } from "@/lib/permissions";
import { employees, leads, projects } from "@/services/mock/seed";

const searchSchema = z.object({
  q: z.string().trim().max(80).default(""),
});

export async function GET(request: Request) {
  const session = await getSession();
  const role = session?.user.role;

  if (!role || !hasModuleAccess(role, "dashboard")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const { q } = searchSchema.parse({ q: searchParams.get("q") ?? "" });
  const query = q.toLowerCase();

  const results = [
    ...leads.map((item) => ({ type: "lead", label: item.title, href: `/marketing/leads/${item.code}` })),
    ...projects.map((item) => ({ type: "project", label: item.name, href: `/projects/${item.code}` })),
    ...employees.map((item) => ({ type: "employee", label: item.name, href: "/hr/employees" })),
  ]
    .filter((item) => item.label.toLowerCase().includes(query))
    .slice(0, 10);

  return NextResponse.json({ results });
}
