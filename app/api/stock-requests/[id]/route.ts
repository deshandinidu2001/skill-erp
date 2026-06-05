import { NextRequest } from "next/server";
import { errorResponse, ok, requireSession } from "@/app/api/_utils";
import { getStockRequestById, updateStockRequestStatus } from "@/services/api/stock-requests.service";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    return ok(await getStockRequestById(params.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession(["super_admin", "qs_manager", "qs_engineer", "stock_manager", "store_keeper", "project_manager"]);
    const body = await req.json();
    return ok(await updateStockRequestStatus(params.id, body.status, body.reason, session.user.id));
  } catch (error) {
    return errorResponse(error);
  }
}
