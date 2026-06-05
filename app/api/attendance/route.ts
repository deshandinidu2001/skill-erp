import { NextRequest } from "next/server";
import { errorResponse, ok, queryParams, requireSession } from "@/app/api/_utils";
import { getAttendance, getAttendanceSummary, saveAttendance } from "@/services/api/attendance.service";

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const params = queryParams(req.url);
    if (params.summary) return ok(await getAttendanceSummary());
    return ok(await getAttendance(params.site, params.date));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["super_admin", "hr_manager", "hr_executive"]);
    const body = await req.json();
    return ok(await saveAttendance(body.rows, body.override, session.user.id));
  } catch (error) {
    return errorResponse(error);
  }
}
