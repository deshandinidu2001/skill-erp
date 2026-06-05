import { NextRequest } from "next/server";
import { errorResponse, ok, requireSession } from "@/app/api/_utils";
import { getVehicleById } from "@/services/api/vehicles.service";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    return ok(await getVehicleById(params.id));
  } catch (error) {
    return errorResponse(error);
  }
}
