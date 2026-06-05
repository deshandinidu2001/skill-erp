import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveUploadedFile } from "@/services/api/files.service";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "File is required" }, { status: 400 });
    const result = await saveUploadedFile({
      file,
      bucket: String(form.get("bucket") ?? ""),
      entityType: String(form.get("entityType") ?? ""),
      entityId: Number(form.get("entityId")),
      title: form.get("title") ? String(form.get("title")) : undefined,
      isClientVisible: form.get("isClientVisible") === "true",
      userId: session.user.id,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 });
  }
}
