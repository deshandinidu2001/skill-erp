import { NextRequest } from "next/server";
import { errorResponse, ok, requireSession } from "@/app/api/_utils";
import { getPayrollBatch, updatePayrollStatus } from "@/services/api/payroll.service";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession(["super_admin", "hr_manager", "hr_executive"]);
    return ok(await getPayrollBatch(params.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession(["super_admin", "hr_manager"]);
    const body = await req.json();
    return ok(await updatePayrollStatus(params.id, body.status, session.user.role, body.override, session.user.id));
  } catch (error) {
    return errorResponse(error);
  }
}
