import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { auditLog } from "@/services/api/common";

export const BUCKET_CONFIG: Record<string, { maxBytes: number; allowedTypes: string[] }> = {
  documents: { maxBytes: 50 * 1024 * 1024, allowedTypes: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"] },
  "boq-files": { maxBytes: 20 * 1024 * 1024, allowedTypes: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"] },
  "site-photos": { maxBytes: 10 * 1024 * 1024, allowedTypes: ["image/jpeg", "image/png", "image/webp"] },
  "employee-docs": { maxBytes: 10 * 1024 * 1024, allowedTypes: ["application/pdf", "image/jpeg", "image/png"] },
  "vehicle-docs": { maxBytes: 10 * 1024 * 1024, allowedTypes: ["application/pdf", "image/jpeg", "image/png"] },
  payslips: { maxBytes: 5 * 1024 * 1024, allowedTypes: ["application/pdf"] },
  avatars: { maxBytes: 2 * 1024 * 1024, allowedTypes: ["image/jpeg", "image/png", "image/webp"] },
};

const metadataSchema = z.object({
  bucket: z.string().min(1),
  entityType: z.string().min(1),
  entityId: z.number().int().positive(),
  title: z.string().optional(),
  isClientVisible: z.boolean().default(false),
});

export function validateUploadMetadata(payload: unknown, file: File) {
  const input = metadataSchema.parse(payload);
  const config = BUCKET_CONFIG[input.bucket];
  if (!config) throw new Error("Invalid bucket");
  if (!config.allowedTypes.includes(file.type)) throw new Error("File type not allowed");
  if (file.size > config.maxBytes) throw new Error("File too large");
  return input;
}

export async function saveUploadedFile(input: { file: File; bucket: string; entityType: string; entityId: number; title?: string; isClientVisible?: boolean; userId: string }) {
  validateUploadMetadata(input, input.file);
  const supabase = createAdminClient();
  const ext = input.file.name.split(".").pop();
  const path = `${input.entityType}/${input.entityId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from(input.bucket).upload(path, input.file);
  if (uploadError) throw new Error(uploadError.message);
  const { data, error } = await supabase
    .from("file_attachments")
    .insert({
      bucket_name: input.bucket,
      storage_path: path,
      original_name: input.file.name,
      mime_type: input.file.type,
      file_size_bytes: input.file.size,
      entity_type: input.entityType,
      entity_id: input.entityId,
      title: input.title ?? input.file.name,
      is_client_visible: input.isClientVisible ?? false,
      uploaded_by: input.userId,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await auditLog({ userId: input.userId, action: "create", module: "file_attachments", recordId: data.id, newValues: { path, bucket: input.bucket } });
  return { attachmentId: data.id, path };
}

export async function createSignedFileUrl(id: number) {
  const supabase = createAdminClient();
  const { data: attachment, error: attachmentError } = await supabase.from("file_attachments").select("bucket_name, storage_path, original_name").eq("id", id).single();
  if (attachmentError || !attachment) throw new Error("Not found");
  const { data, error } = await supabase.storage.from(attachment.bucket_name).createSignedUrl(attachment.storage_path, 3600);
  if (error) throw new Error(error.message);
  return { url: data.signedUrl, name: attachment.original_name };
}
