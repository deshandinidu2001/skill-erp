import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSignedFileUrl } from "@/services/api/files.service";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await createSignedFileUrl(Number(params.id)));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "File not found" }, { status: 404 });
  }
}
