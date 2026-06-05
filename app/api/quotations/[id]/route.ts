import { NextRequest } from "next/server";
import { errorResponse, ok, requireSession } from "@/app/api/_utils";
import { duplicateQuotationVersion, getQuotationById, markQuotationStatus } from "@/services/api/quotations.service";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    return ok(await getQuotationById(params.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession(["super_admin", "marketing_manager", "qs_manager"]);
    const body = await req.json();
    if (body.action === "duplicate") return ok(await duplicateQuotationVersion(params.id, session.user.id));
    return ok(await markQuotationStatus(params.id, body.status, body.reason, session.user.id));
  } catch (error) {
    return errorResponse(error);
  }
}
