import { NextRequest } from "next/server";
import { errorResponse, ok, requireSession } from "@/app/api/_utils";
import {
  assignVehicle,
  getVehicleById,
  logFuel,
  logMaintenance,
  logMeter,
  updateVehicleStatus,
} from "@/services/api/vehicles.service";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    return ok(await getVehicleById(params.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession(["super_admin", "vehicle_manager", "project_manager", "technical_officer"]);
    const body = await req.json();
    const { action, ...data } = body;
    if (action === "assign") {
      return ok(await assignVehicle(params.id, data, session.user.id));
    }
    if (action === "log_meter") {
      return ok(await logMeter(params.id, data, session.user.id));
    }
    if (action === "log_fuel") {
      return ok(await logFuel(params.id, data, session.user.id));
    }
    if (action === "log_maintenance") {
      return ok(await logMaintenance(params.id, data, session.user.id));
    }
    if (action === "update_status") {
      return ok(await updateVehicleStatus(params.id, data.status, session.user.id));
    }
    throw new Error("Invalid action");
  } catch (error) {
    return errorResponse(error);
  }
}
