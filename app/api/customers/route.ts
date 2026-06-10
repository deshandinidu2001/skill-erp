import { NextRequest } from "next/server";
import { errorResponse, ok, requireSession } from "@/app/api/_utils";
import { getCustomers } from "@/services/api/customers.service";

export async function GET(_req: NextRequest) {
  try {
    await requireSession();
    return ok(await getCustomers());
  } catch (error) {
    return errorResponse(error);
  }
}
