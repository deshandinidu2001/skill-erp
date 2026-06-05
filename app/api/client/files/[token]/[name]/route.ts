import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { validateClientPortalToken } from "@/services/api/client-portal.service";

export async function GET(
  _request: Request,
  { params }: { params: { token: string; name: string } },
) {
  const validation = await validateClientPortalToken(params.token);
  if (!validation.valid) {
    return NextResponse.json({ error: "Expired or invalid token" }, { status: 403 });
  }

  const fileName = decodeURIComponent(params.name).replace(/[^\w.\- ]/g, "");
  const supabase = createAdminClient();
  const { data: attachment } = await supabase
    .from("file_attachments")
    .select("bucket_name, storage_path, original_name")
    .eq("entity_type", "project")
    .eq("entity_id", validation.project.id)
    .eq("original_name", fileName)
    .eq("is_client_visible", true)
    .maybeSingle();
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase.storage.from(String(attachment.bucket_name)).createSignedUrl(String(attachment.storage_path), 3600);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
