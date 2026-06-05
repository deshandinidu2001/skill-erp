import { NextRequest } from "next/server";
import { errorResponse, ok, queryParams, requireSession } from "@/app/api/_utils";
import { createVehicle, getVehicles } from "@/services/api/vehicles.service";

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    return ok(await getVehicles(queryParams(req.url)));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["super_admin", "vehicle_manager"]);
    return ok(await createVehicle(await req.json(), session.user.id), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
