import { NextRequest } from "next/server";
import { errorResponse, ok, queryParams, requireSession } from "@/app/api/_utils";
import { createFromQuotation, createProject, getProjects } from "@/services/api/projects.service";

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    return ok(await getProjects(queryParams(req.url)));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["super_admin", "project_manager", "marketing_manager"]);
    const body = await req.json();
    if (body.quotationId) return ok(await createFromQuotation(body.quotationId, session.user.id), { status: 201 });
    return ok(await createProject(body, session.user.id), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
