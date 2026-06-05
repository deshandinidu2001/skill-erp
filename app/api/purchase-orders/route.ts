import { NextRequest } from "next/server";
import { errorResponse, ok, requireSession } from "@/app/api/_utils";
import { approvePurchaseOrder, createPurchaseOrder, getPurchaseOrders } from "@/services/api/purchase-orders.service";

export async function GET() {
  try {
    await requireSession();
    return ok(await getPurchaseOrders());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["super_admin", "stock_manager", "store_keeper"]);
    return ok(await createPurchaseOrder(await req.json(), session.user.id), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession(["super_admin", "stock_manager", "finance_manager"]);
    const body = await req.json();
    return ok(await approvePurchaseOrder(body.id, session.user.role, session.user.id));
  } catch (error) {
    return errorResponse(error);
  }
}
