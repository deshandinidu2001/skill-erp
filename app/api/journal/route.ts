import { NextRequest } from "next/server";
import { errorResponse, ok, requireSession } from "@/app/api/_utils";
import { postJournalEntry } from "@/services/api/journal.service";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["super_admin", "accountant", "finance_manager"]);
    const body = await req.json();
    return ok(await postJournalEntry({ ...body, createdBy: session.user.id }), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
