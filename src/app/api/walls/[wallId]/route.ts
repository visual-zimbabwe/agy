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

const isMissingZoneKindColumnError = (message?: string) =>
  Boolean(message && message.includes("column zones.kind does not exist"));
const isMissingNoteFormattingColumnError = (message?: string) =>
  Boolean(
    message &&
      (message.includes("column notes.image_url does not exist") ||
        message.includes("column notes.text_align does not exist") ||
        message.includes("column notes.text_v_align does not exist") ||
        message.includes("column notes.text_font does not exist") ||
        message.includes("column notes.text_color does not exist") ||
        message.includes("column notes.pinned does not exist") ||
        message.includes("column notes.highlighted does not exist")),
  );
const isMissingNoteGroupsTableError = (message?: string) =>
  Boolean(message && message.includes('relation "public.note_groups" does not exist'));

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

  const [wallResult, groupsResult, noteGroupsResult, linksResult] = await Promise.all([
    auth.supabase
      .from("walls")
      .select("id,camera_x,camera_y,camera_zoom,last_color")
      .eq("id", wallId)
      .eq("owner_id", auth.user.id)
      .maybeSingle(),
    auth.supabase
      .from("zone_groups")
      .select("id,label,color,zone_ids,collapsed,created_at,updated_at")
      .eq("wall_id", wallId)
      .eq("owner_id", auth.user.id)
      .is("deleted_at", null),
    auth.supabase
      .from("note_groups")
      .select("id,label,color,note_ids,collapsed,created_at,updated_at")
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

  if (groupsResult.error || linksResult.error) {
    return NextResponse.json(
      {
        error:
          groupsResult.error?.message ?? linksResult.error?.message ?? "Query failed",
      },
      { status: 500 },
    );
  }

  let noteGroupsData = noteGroupsResult.data ?? [];
  if (noteGroupsResult.error) {
    if (!isMissingNoteGroupsTableError(noteGroupsResult.error.message)) {
      return NextResponse.json({ error: noteGroupsResult.error.message }, { status: 500 });
    }
    noteGroupsData = [];
  }

  const notesWithFormattingResult = await auth.supabase
    .from("notes")
    .select("id,text,image_url,text_align,text_v_align,text_font,text_color,pinned,highlighted,tags,text_size,x,y,w,h,color,created_at,updated_at")
    .eq("wall_id", wallId)
    .eq("owner_id", auth.user.id)
    .is("deleted_at", null);

  let notesData = notesWithFormattingResult.data;
  if (notesWithFormattingResult.error && isMissingNoteFormattingColumnError(notesWithFormattingResult.error.message)) {
    const notesLegacyResult = await auth.supabase
      .from("notes")
      .select("id,text,tags,text_size,x,y,w,h,color,created_at,updated_at")
      .eq("wall_id", wallId)
      .eq("owner_id", auth.user.id)
      .is("deleted_at", null);
    if (notesLegacyResult.error) {
      return NextResponse.json({ error: notesLegacyResult.error.message }, { status: 500 });
    }
    notesData = notesLegacyResult.data?.map((note) => ({
      ...note,
      image_url: null,
      text_align: null,
      text_v_align: null,
      text_font: null,
      text_color: null,
      pinned: false,
      highlighted: false,
    })) ?? [];
  } else if (notesWithFormattingResult.error) {
    return NextResponse.json({ error: notesWithFormattingResult.error.message }, { status: 500 });
  }

  const zonesWithKindResult = await auth.supabase
    .from("zones")
    .select("id,label,kind,group_id,x,y,w,h,color,created_at,updated_at")
    .eq("wall_id", wallId)
    .eq("owner_id", auth.user.id)
    .is("deleted_at", null);

  let zonesData = zonesWithKindResult.data;
  if (zonesWithKindResult.error && isMissingZoneKindColumnError(zonesWithKindResult.error.message)) {
    const zonesLegacyResult = await auth.supabase
      .from("zones")
      .select("id,label,group_id,x,y,w,h,color,created_at,updated_at")
      .eq("wall_id", wallId)
      .eq("owner_id", auth.user.id)
      .is("deleted_at", null);
    if (zonesLegacyResult.error) {
      return NextResponse.json({ error: zonesLegacyResult.error.message }, { status: 500 });
    }
    zonesData = zonesLegacyResult.data?.map((zone) => ({ ...zone, kind: "frame" })) ?? [];
  } else if (zonesWithKindResult.error) {
    return NextResponse.json({ error: zonesWithKindResult.error.message }, { status: 500 });
  }

  const snapshot = rowsToSnapshot({
    wall: wallResult.data,
    notes: notesData ?? [],
    zones: zonesData ?? [],
    zoneGroups: groupsResult.data ?? [],
    noteGroups: noteGroupsData,
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
