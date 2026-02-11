import { NextResponse } from "next/server";
import { z } from "zod";

import { rowsToSnapshot } from "@/features/wall/cloud";
import { requireApiUser } from "@/lib/api/auth";

const paramsSchema = z.object({
  wallId: z.string().uuid(),
});

const patchWallSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  camera: z
    .object({
      x: z.number(),
      y: z.number(),
      zoom: z.number().positive().max(5),
    })
    .optional(),
  lastColor: z.string().trim().optional(),
});

export async function GET(_: Request, context: { params: Promise<{ wallId: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid wall id" }, { status: 400 });
  }

  const wallId = parsedParams.data.wallId;

  const [wallResult, notesResult, zonesResult, groupsResult, linksResult] = await Promise.all([
    auth.supabase
      .from("walls")
      .select("id,camera_x,camera_y,camera_zoom,last_color")
      .eq("id", wallId)
      .eq("owner_id", auth.user.id)
      .maybeSingle(),
    auth.supabase
      .from("notes")
      .select("id,text,tags,text_size,x,y,w,h,color,created_at,updated_at")
      .eq("wall_id", wallId)
      .eq("owner_id", auth.user.id)
      .is("deleted_at", null),
    auth.supabase
      .from("zones")
      .select("id,label,group_id,x,y,w,h,color,created_at,updated_at")
      .eq("wall_id", wallId)
      .eq("owner_id", auth.user.id)
      .is("deleted_at", null),
    auth.supabase
      .from("zone_groups")
      .select("id,label,color,zone_ids,collapsed,created_at,updated_at")
      .eq("wall_id", wallId)
      .eq("owner_id", auth.user.id)
      .is("deleted_at", null),
    auth.supabase
      .from("links")
      .select("id,from_note_id,to_note_id,type,label,created_at,updated_at")
      .eq("wall_id", wallId)
      .eq("owner_id", auth.user.id)
      .is("deleted_at", null),
  ]);

  if (wallResult.error || !wallResult.data) {
    return NextResponse.json({ error: "Wall not found" }, { status: 404 });
  }

  if (notesResult.error || zonesResult.error || groupsResult.error || linksResult.error) {
    return NextResponse.json(
      {
        error:
          notesResult.error?.message ??
          zonesResult.error?.message ??
          groupsResult.error?.message ??
          linksResult.error?.message ??
          "Query failed",
      },
      { status: 500 },
    );
  }

  const snapshot = rowsToSnapshot({
    wall: wallResult.data,
    notes: notesResult.data ?? [],
    zones: zonesResult.data ?? [],
    zoneGroups: groupsResult.data ?? [],
    links: linksResult.data ?? [],
  });

  return NextResponse.json({
    wall: wallResult.data,
    snapshot,
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ wallId: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid wall id" }, { status: 400 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = patchWallSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const next: {
    title?: string;
    camera_x?: number;
    camera_y?: number;
    camera_zoom?: number;
    last_color?: string;
  } = {};

  if (parsed.data.title !== undefined) {
    next.title = parsed.data.title;
  }
  if (parsed.data.camera) {
    next.camera_x = parsed.data.camera.x;
    next.camera_y = parsed.data.camera.y;
    next.camera_zoom = parsed.data.camera.zoom;
  }
  if (parsed.data.lastColor !== undefined) {
    next.last_color = parsed.data.lastColor;
  }

  const { data, error } = await auth.supabase
    .from("walls")
    .update(next)
    .eq("id", parsedParams.data.wallId)
    .eq("owner_id", auth.user.id)
    .select("id,title,camera_x,camera_y,camera_zoom,last_color,updated_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Wall not found" }, { status: 404 });
  }

  return NextResponse.json({ wall: data });
}

export async function DELETE(_: Request, context: { params: Promise<{ wallId: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid wall id" }, { status: 400 });
  }

  const { error } = await auth.supabase
    .from("walls")
    .delete()
    .eq("id", parsedParams.data.wallId)
    .eq("owner_id", auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
