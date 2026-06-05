import { NextRequest } from "next/server";
import { errorResponse, ok, requireSession } from "@/app/api/_utils";
import { getEmployeeById } from "@/services/api/employees.service";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    return ok(await getEmployeeById(params.id));
  } catch (error) {
    return errorResponse(error);
  }
}
