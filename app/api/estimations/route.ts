import { NextRequest } from "next/server";
import { errorResponse, ok, queryParams, requireSession } from "@/app/api/_utils";
import { createEstimation, getEstimations } from "@/services/api/estimations.service";

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    return ok(await getEstimations(queryParams(req.url)));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["super_admin", "qs_manager", "qs_engineer"]);
    return ok(await createEstimation(await req.json(), session.user.id), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
