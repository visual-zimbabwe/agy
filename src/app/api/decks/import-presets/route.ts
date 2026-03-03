import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/api/auth";

const mappingSchema = z.object({
  deckId: z.string().uuid(),
  noteTypeId: z.string().uuid(),
  frontColumn: z.string().trim().min(1),
  backColumn: z.string().trim().min(1),
  tagsColumn: z.string().trim().optional(),
});

const createPresetSchema = z.object({
  name: z.string().trim().min(1).max(120),
  mapping: mappingSchema,
});

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const { data, error } = await auth.supabase
    .from("deck_import_presets")
    .select("id,name,mapping,created_at,updated_at")
    .eq("owner_id", auth.user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ presets: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = createPresetSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("deck_import_presets")
    .upsert(
      {
        owner_id: auth.user.id,
        name: parsed.data.name,
        mapping: parsed.data.mapping,
      },
      { onConflict: "owner_id,name" },
    )
    .select("id,name,mapping,created_at,updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ preset: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  const { error } = await auth.supabase.from("deck_import_presets").delete().eq("owner_id", auth.user.id).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
