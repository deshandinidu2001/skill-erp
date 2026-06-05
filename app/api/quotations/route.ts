import { NextRequest } from "next/server";
import { errorResponse, ok, queryParams, requireSession } from "@/app/api/_utils";
import { createQuotation, getQuotations } from "@/services/api/quotations.service";

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    return ok(await getQuotations(queryParams(req.url)));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["super_admin", "marketing_manager", "qs_manager"]);
    return ok(await createQuotation(await req.json(), session.user.id), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
