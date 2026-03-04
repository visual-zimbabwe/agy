import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const avatarBucket = "profile-images";

const sanitizeFileName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Select an image file first." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are allowed." }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: bucket } = await admin.storage.getBucket(avatarBucket);
  if (!bucket) {
    const { error: createBucketError } = await admin.storage.createBucket(avatarBucket, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    });
    if (createBucketError && !createBucketError.message.toLowerCase().includes("already")) {
      return NextResponse.json({ error: createBucketError.message ?? "Failed to prepare avatar bucket." }, { status: 500 });
    }
  }

  const extension = file.name.includes(".") ? `.${file.name.split(".").pop()?.toLowerCase() ?? "png"}` : ".png";
  const baseName = sanitizeFileName(file.name.replace(/\.[^/.]+$/, "")) || "avatar";
  const path = `${auth.user.id}/${Date.now()}-${baseName}${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage.from(avatarBucket).upload(path, bytes, {
    contentType: file.type,
    upsert: true,
  });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message ?? "Failed to upload avatar." }, { status: 500 });
  }

  const { data } = admin.storage.from(avatarBucket).getPublicUrl(path);
  return NextResponse.json({ avatarUrl: data.publicUrl });
}
