import { NextRequest } from "next/server";
import { errorResponse, ok, requireSession } from "@/app/api/_utils";
import { createStockRequest, getStockRequests } from "@/services/api/stock-requests.service";

export async function GET() {
  try {
    await requireSession();
    return ok(await getStockRequests());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["super_admin", "project_manager", "technical_officer", "stock_manager", "store_keeper"]);
    return ok(await createStockRequest(await req.json(), session.user.id), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
