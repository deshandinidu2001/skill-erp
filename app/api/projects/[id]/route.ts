import { NextRequest } from "next/server";
import { errorResponse, ok, requireSession } from "@/app/api/_utils";
import { addProjectExpense, changeProjectStatus, getProjectDetail } from "@/services/api/projects.service";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    return ok(await getProjectDetail(params.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession(["super_admin", "project_manager", "technical_officer"]);
    const body = await req.json();
    if (body.action === "add_expense") return ok(await addProjectExpense(params.id, body.expense, session.user.id));
    return ok(await changeProjectStatus(params.id, body.status, body.reason, session.user.id));
  } catch (error) {
    return errorResponse(error);
  }
}
