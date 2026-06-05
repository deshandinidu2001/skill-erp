import { NextRequest } from "next/server";
import { errorResponse, ok, requireSession } from "@/app/api/_utils";
import { createGoodsReceipt, getGoodsReceipts } from "@/services/api/goods-receipts.service";

export async function GET() {
  try {
    await requireSession();
    return ok(await getGoodsReceipts());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["super_admin", "stock_manager", "store_keeper"]);
    return ok(await createGoodsReceipt(await req.json(), session.user.id), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
