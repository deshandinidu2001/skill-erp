import { NextRequest } from "next/server";
import { errorResponse, ok, requireSession } from "@/app/api/_utils";
import { assignEmployeeToSite, getUsers, upsertAppUser } from "@/services/api/users.service";

export async function GET() {
  try {
    await requireSession(["super_admin", "hr_manager", "hr_executive", "viewer"]);
    return ok(await getUsers());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["super_admin", "hr_manager"]);
    const body = await req.json();
    if (body.action === "assign_site") return ok(await assignEmployeeToSite(body.employeeId, body.site, session.user.id));
    return ok(await upsertAppUser(body, session.user.id), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
