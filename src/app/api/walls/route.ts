import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/api/auth";

const createWallSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
});

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const { data, error } = await auth.supabase
    .from("walls")
    .select("id,title,updated_at,created_at")
    .eq("owner_id", auth.user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ walls: data });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = createWallSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data, error } = await auth.supabase
    .from("walls")
    .insert({
      owner_id: auth.user.id,
      title: parsed.data.title ?? "My Wall",
    })
    .select("id,title,updated_at,created_at,camera_x,camera_y,camera_zoom,last_color")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ wall: data }, { status: 201 });
}
