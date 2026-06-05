import { NextRequest } from "next/server";
import { errorResponse, ok, requireSession } from "@/app/api/_utils";
import { getEstimationById, markEstimationReady, updateEstimationStatus } from "@/services/api/estimations.service";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    return ok(await getEstimationById(params.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession(["super_admin", "qs_manager", "qs_engineer"]);
    const body = await req.json();
    if (body.action === "ready") return ok(await markEstimationReady(params.id, session.user.id));
    return ok(await updateEstimationStatus(params.id, body.status, session.user.id));
  } catch (error) {
    return errorResponse(error);
  }
}
