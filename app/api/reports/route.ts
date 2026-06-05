import { errorResponse, ok, requireSession } from "@/app/api/_utils";
import { getReportsSummary } from "@/services/api/reports.service";

export async function GET() {
  try {
    await requireSession(["super_admin", "viewer", "marketing_manager", "hr_manager", "finance_manager", "stock_manager", "project_manager"]);
    return ok(await getReportsSummary());
  } catch (error) {
    return errorResponse(error);
  }
}
