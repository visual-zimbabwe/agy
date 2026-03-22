import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const pageFilesBucket = "page-files";

const sanitizeFileName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const ensureBucket = async () => {
  const admin = createSupabaseAdminClient();
  const { data: bucket } = await admin.storage.getBucket(pageFilesBucket);
  if (bucket) {
    return admin;
  }

  const { error } = await admin.storage.createBucket(pageFilesBucket, {
    public: false,
  });
  if (error && !error.message.toLowerCase().includes("already")) {
    throw new Error(error.message ?? "Failed to prepare page files bucket.");
  }
  return admin;
};

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const formData = await request.formData();
  const files = formData.getAll("files").filter((value): value is File => value instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "Select at least one file first." }, { status: 400 });
  }

  try {
    const admin = await ensureBucket();
    const uploaded: Array<{ path: string; name: string; size: number; mimeType: string }> = [];
    const stamp = Date.now();

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index]!;
      const extension = file.name.includes(".") ? `.${file.name.split(".").pop()?.toLowerCase() ?? "bin"}` : "";
      const baseName = sanitizeFileName(file.name.replace(/\.[^/.]+$/, "")) || "file";
      const path = `${auth.user.id}/${stamp}-${index}-${baseName}${extension}`;
      const bytes = new Uint8Array(await file.arrayBuffer());

      const { error } = await admin.storage.from(pageFilesBucket).upload(path, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
      if (error) {
        return NextResponse.json({ error: error.message ?? "Failed to upload file." }, { status: 500 });
      }

      uploaded.push({
        path,
        name: file.name,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
      });
    }

    return NextResponse.json({ files: uploaded });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload files." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  let path = "";
  try {
    const body = (await request.json()) as { path?: string };
    path = body.path ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!path || !path.startsWith(`${auth.user.id}/`)) {
    return NextResponse.json({ error: "Invalid file path." }, { status: 400 });
  }

  try {
    const admin = await ensureBucket();
    const { error } = await admin.storage.from(pageFilesBucket).remove([path]);
    if (error) {
      return NextResponse.json({ error: error.message ?? "Failed to delete file." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete file." },
      { status: 500 },
    );
  }
}

