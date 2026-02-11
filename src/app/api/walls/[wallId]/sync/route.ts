import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/api/auth";

const paramsSchema = z.object({
  wallId: z.string().uuid(),
});

const noteSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  tags: z.array(z.string()),
  textSize: z.enum(["sm", "md", "lg"]).optional(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  color: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const zoneSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  groupId: z.string().optional(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  color: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const zoneGroupSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  color: z.string(),
  zoneIds: z.array(z.string()),
  collapsed: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const linkSchema = z.object({
  id: z.string().min(1),
  fromNoteId: z.string(),
  toNoteId: z.string(),
  type: z.enum(["cause_effect", "dependency", "idea_execution"]),
  label: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const syncSchema = z.object({
  notes: z.record(z.string(), noteSchema),
  zones: z.record(z.string(), zoneSchema),
  zoneGroups: z.record(z.string(), zoneGroupSchema),
  links: z.record(z.string(), linkSchema),
  camera: z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number().positive().max(5),
  }),
  lastColor: z.string().optional(),
  clientSyncedAt: z.number().optional(),
});

const toIso = (value: number) => new Date(value).toISOString();

const buildInFilter = (ids: string[]) =>
  `(${ids.map((id) => `"${id.replaceAll('"', '\\"')}"`).join(",")})`;

export async function POST(request: Request, context: { params: Promise<{ wallId: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid wall id" }, { status: 400 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsedBody = syncSchema.safeParse(payload);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid sync payload", details: parsedBody.error.flatten() }, { status: 400 });
  }

  const wallId = parsedParams.data.wallId;
  const snapshot = parsedBody.data;

  const { data: wall, error: wallError } = await auth.supabase
    .from("walls")
    .select("id")
    .eq("id", wallId)
    .eq("owner_id", auth.user.id)
    .maybeSingle();

  if (wallError || !wall) {
    return NextResponse.json({ error: "Wall not found" }, { status: 404 });
  }

  const wallUpdate = await auth.supabase
    .from("walls")
    .update({
      camera_x: snapshot.camera.x,
      camera_y: snapshot.camera.y,
      camera_zoom: snapshot.camera.zoom,
      last_color: snapshot.lastColor ?? null,
    })
    .eq("id", wallId)
    .eq("owner_id", auth.user.id);

  if (wallUpdate.error) {
    return NextResponse.json({ error: wallUpdate.error.message }, { status: 500 });
  }

  const notes = Object.values(snapshot.notes);
  const zones = Object.values(snapshot.zones);
  const zoneGroups = Object.values(snapshot.zoneGroups);
  const links = Object.values(snapshot.links);

  const notesUpsert = notes.length
    ? await auth.supabase.from("notes").upsert(
      notes.map((note) => ({
        id: note.id,
        wall_id: wallId,
        owner_id: auth.user.id,
        text: note.text,
        tags: note.tags,
        text_size: note.textSize ?? null,
        x: note.x,
        y: note.y,
        w: note.w,
        h: note.h,
        color: note.color,
        created_at: toIso(note.createdAt),
        updated_at: toIso(note.updatedAt),
        deleted_at: null,
      })),
      { onConflict: "id" },
    )
    : { error: null };

  if (notesUpsert.error) {
    return NextResponse.json({ error: notesUpsert.error.message }, { status: 500 });
  }

  const zonesUpsert = zones.length
    ? await auth.supabase.from("zones").upsert(
      zones.map((zone) => ({
        id: zone.id,
        wall_id: wallId,
        owner_id: auth.user.id,
        label: zone.label,
        group_id: zone.groupId ?? null,
        x: zone.x,
        y: zone.y,
        w: zone.w,
        h: zone.h,
        color: zone.color,
        created_at: toIso(zone.createdAt),
        updated_at: toIso(zone.updatedAt),
        deleted_at: null,
      })),
      { onConflict: "id" },
    )
    : { error: null };

  if (zonesUpsert.error) {
    return NextResponse.json({ error: zonesUpsert.error.message }, { status: 500 });
  }

  const groupsUpsert = zoneGroups.length
    ? await auth.supabase.from("zone_groups").upsert(
      zoneGroups.map((group) => ({
        id: group.id,
        wall_id: wallId,
        owner_id: auth.user.id,
        label: group.label,
        color: group.color,
        zone_ids: group.zoneIds,
        collapsed: group.collapsed,
        created_at: toIso(group.createdAt),
        updated_at: toIso(group.updatedAt),
        deleted_at: null,
      })),
      { onConflict: "id" },
    )
    : { error: null };

  if (groupsUpsert.error) {
    return NextResponse.json({ error: groupsUpsert.error.message }, { status: 500 });
  }

  const linksUpsert = links.length
    ? await auth.supabase.from("links").upsert(
      links.map((link) => ({
        id: link.id,
        wall_id: wallId,
        owner_id: auth.user.id,
        from_note_id: link.fromNoteId,
        to_note_id: link.toNoteId,
        type: link.type,
        label: link.label,
        created_at: toIso(link.createdAt),
        updated_at: toIso(link.updatedAt),
        deleted_at: null,
      })),
      { onConflict: "id" },
    )
    : { error: null };

  if (linksUpsert.error) {
    return NextResponse.json({ error: linksUpsert.error.message }, { status: 500 });
  }

  const deleteMissing = async (table: "notes" | "zones" | "zone_groups" | "links", ids: string[]) => {
    const base = auth.supabase.from(table).delete().eq("wall_id", wallId).eq("owner_id", auth.user.id);
    if (ids.length === 0) {
      return base;
    }
    return base.not("id", "in", buildInFilter(ids));
  };

  const [notesDelete, zonesDelete, groupsDelete, linksDelete] = await Promise.all([
    deleteMissing("notes", notes.map((entity) => entity.id)),
    deleteMissing("zones", zones.map((entity) => entity.id)),
    deleteMissing("zone_groups", zoneGroups.map((entity) => entity.id)),
    deleteMissing("links", links.map((entity) => entity.id)),
  ]);

  if (notesDelete.error || zonesDelete.error || groupsDelete.error || linksDelete.error) {
    return NextResponse.json(
      {
        error:
          notesDelete.error?.message ??
          zonesDelete.error?.message ??
          groupsDelete.error?.message ??
          linksDelete.error?.message ??
          "Delete sync failed",
      },
      { status: 500 },
    );
  }

  const serverSnapshot = {
    notes: snapshot.notes,
    zones: snapshot.zones,
    zoneGroups: snapshot.zoneGroups,
    links: snapshot.links,
    camera: snapshot.camera,
    lastColor: snapshot.lastColor,
  };

  return NextResponse.json({
    serverSnapshot,
    serverTime: Date.now(),
  });
}
