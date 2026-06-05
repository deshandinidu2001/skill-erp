import { NextRequest } from "next/server";
import { errorResponse, ok, requireSession } from "@/app/api/_utils";
import { getLeadDetail, sendLeadToQs, updateLeadStatus } from "@/services/api/leads.service";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    return ok(await getLeadDetail(params.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession(["super_admin", "marketing_manager", "marketing_executive"]);
    const body = await req.json();
    if (body.action === "send_to_qs") return ok(await sendLeadToQs(params.id, session.user.id));
    return ok(await updateLeadStatus(params.id, body.status, session.user.id, body.reason ?? body.remarks));
  } catch (error) {
    return errorResponse(error);
  }
}
