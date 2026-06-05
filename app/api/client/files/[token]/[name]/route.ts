import { NextResponse } from "next/server";
import { validateClientPortalToken } from "@/services/mock/client-portal.service";

export async function GET(
  _request: Request,
  { params }: { params: { token: string; name: string } },
) {
  const validation = validateClientPortalToken(params.token);
  if (!validation.valid) {
    return NextResponse.json({ error: "Expired or invalid token" }, { status: 403 });
  }

  const fileName = decodeURIComponent(params.name).replace(/[^\w.\- ]/g, "");
  return new NextResponse(`Mock download for ${fileName}`, {
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
