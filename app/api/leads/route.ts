import { NextRequest } from "next/server";
import { errorResponse, ok, queryParams, requireSession } from "@/app/api/_utils";
import { createLead, getLeads } from "@/services/api/leads.service";

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    return ok(await getLeads(queryParams(req.url)));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["super_admin", "marketing_manager", "marketing_executive"]);
    return ok(await createLead(await req.json(), session.user.id), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
