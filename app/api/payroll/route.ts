import { NextRequest } from "next/server";
import { errorResponse, ok, queryParams, requireSession } from "@/app/api/_utils";
import { getPayrollBatches, getPayrollSummary } from "@/services/api/payroll.service";

export async function GET(req: NextRequest) {
  try {
    await requireSession(["super_admin", "hr_manager", "hr_executive"]);
    if (queryParams(req.url).summary) return ok(await getPayrollSummary());
    return ok(await getPayrollBatches());
  } catch (error) {
    return errorResponse(error);
  }
}
