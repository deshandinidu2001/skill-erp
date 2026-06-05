import { NextRequest } from "next/server";
import { errorResponse, ok, requireSession } from "@/app/api/_utils";
import { createEmployee, getEmployees } from "@/services/api/employees.service";

export async function GET() {
  try {
    await requireSession();
    return ok(await getEmployees());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["super_admin", "hr_manager", "hr_executive"]);
    return ok(await createEmployee(await req.json(), session.user.id), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
