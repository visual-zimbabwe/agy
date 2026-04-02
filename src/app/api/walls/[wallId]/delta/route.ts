import { NextResponse } from "next/server";

import {
  deltaParamsSchema,
  deltaSyncRequestSchema,
  sinceVersionSchema,
  toIso,
  toStoredTextSize,
  type DeltaLink,
  type DeltaNote,
  type DeltaNoteGroup,
  type DeltaZone,
  type DeltaZoneGroup,
} from "@/features/wall/delta-sync";
import { requireApiUser } from "@/lib/api/auth";

const chunkSize = 100;

const chunkArray = <T,>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const runChunked = async <T,>(
  items: T[],
  task: (chunk: T[]) => Promise<{ error: { message: string } | null }>,
) => {
  for (const chunk of chunkArray(items, chunkSize)) {
    const result = await task(chunk);
    if (result.error) {
      return result;
    }
  }
  return { error: null as { message: string } | null };
};

type WallChangeInsert = {
  owner_id: string;
  wall_id: string;
  entity_type: string;
  entity_id: string;
  revision: number;
  deleted: boolean;
  payload: unknown;
};

export async function GET(request: Request, context: { params: Promise<{ wallId: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const parsedParams = deltaParamsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid wall id" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const parsedQuery = sinceVersionSchema.safeParse({ since: searchParams.get("since") ?? 0 });
  if (!parsedQuery.success) {
    return NextResponse.json({ error: "Invalid since version" }, { status: 400 });
  }

  const wallId = parsedParams.data.wallId;
  const since = parsedQuery.data.since;

  const { data: wall, error: wallError } = await auth.supabase
    .from("walls")
    .select("id,sync_version")
    .eq("id", wallId)
    .eq("owner_id", auth.user.id)
    .maybeSingle();

  if (wallError || !wall) {
    return NextResponse.json({ error: "Wall not found" }, { status: 404 });
  }

  const { data: changes, error: changesError } = await auth.supabase
    .from("wall_changes")
    .select("id,entity_type,entity_id,revision,deleted,payload,changed_at")
    .eq("wall_id", wallId)
    .eq("owner_id", auth.user.id)
    .gt("revision", since)
    .order("revision", { ascending: true });

  if (changesError) {
    return NextResponse.json({ error: changesError.message }, { status: 500 });
  }

  return NextResponse.json({
    wallId,
    fromVersion: since,
    currentVersion: wall.sync_version ?? 0,
    changes: changes ?? [],
  });
}

export async function POST(request: Request, context: { params: Promise<{ wallId: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const parsedParams = deltaParamsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid wall id" }, { status: 400 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsedBody = deltaSyncRequestSchema.safeParse(payload);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid delta sync payload", details: parsedBody.error.flatten() }, { status: 400 });
  }

  const wallId = parsedParams.data.wallId;
  const body = parsedBody.data;

  const { data: wall, error: wallError } = await auth.supabase
    .from("walls")
    .select("id,sync_version")
    .eq("id", wallId)
    .eq("owner_id", auth.user.id)
    .maybeSingle();

  if (wallError || !wall) {
    return NextResponse.json({ error: "Wall not found" }, { status: 404 });
  }

  const currentVersion = wall.sync_version ?? 0;
  if (body.baseVersion !== currentVersion) {
    return NextResponse.json(
      {
        error: "Cloud wall changed since your last delta sync. Reload and rebase before retrying.",
        code: "wall_delta_conflict",
        currentVersion,
      },
      { status: 409 },
    );
  }

  let nextVersion = currentVersion;
  const wallChanges: WallChangeInsert[] = [];

  const claimRevision = () => {
    nextVersion += 1;
    return nextVersion;
  };

  const registerChange = (entityType: string, entityId: string, revision: number, deleted: boolean, payloadValue: unknown) => {
    wallChanges.push({
      owner_id: auth.user.id,
      wall_id: wallId,
      entity_type: entityType,
      entity_id: entityId,
      revision,
      deleted,
      payload: payloadValue,
    });
  };

  const applyNoteChanges = async (changes: DeltaNote[]) =>
    runChunked(changes, async (chunk) =>
      auth.supabase.from("notes").upsert(
        chunk.map((note) => {
          const deleted = typeof note.deletedAt === "number";
          const revision = claimRevision();
          const payloadValue = { ...note, revision };
          registerChange("note", note.id, revision, deleted, payloadValue);
          return {
            id: note.id,
            wall_id: wallId,
            owner_id: auth.user.id,
            revision,
            note_kind: note.noteKind ?? "standard",
            text: note.text,
            quote_author: note.quoteAuthor?.trim() || null,
            quote_source: note.quoteSource?.trim() || null,
            private_note: note.privateNote ?? null,
            canon: note.canon ?? null,
            eisenhower: note.eisenhower ?? null,
            currency: note.currency ?? null,
            bookmark: note.bookmark ?? null,
            apod: note.apod ?? null,
            poetry: note.poetry ?? null,
            file: note.file ?? note.audio ?? note.video ?? null,
            image_url: note.imageUrl?.trim() || null,
            text_align: note.textAlign ?? null,
            text_v_align: note.textVAlign ?? null,
            text_font: note.textFont ?? null,
            text_color: note.textColor ?? null,
            pinned: note.pinned ?? false,
            highlighted: note.highlighted ?? false,
            vocabulary: note.vocabulary ?? null,
            tags: note.tags,
            text_size: toStoredTextSize(note),
            x: note.x,
            y: note.y,
            w: note.w,
            h: note.h,
            color: note.color,
            created_at: toIso(note.createdAt),
            updated_at: toIso(note.updatedAt),
            deleted_at: deleted ? toIso(note.deletedAt ?? note.updatedAt) : null,
          };
        }),
        { onConflict: "id" },
      ),
    );

  const applyZoneChanges = async (changes: DeltaZone[]) =>
    runChunked(changes, async (chunk) =>
      auth.supabase.from("zones").upsert(
        chunk.map((zone) => {
          const deleted = typeof zone.deletedAt === "number";
          const revision = claimRevision();
          const payloadValue = { ...zone, revision };
          registerChange("zone", zone.id, revision, deleted, payloadValue);
          return {
            id: zone.id,
            wall_id: wallId,
            owner_id: auth.user.id,
            revision,
            label: zone.label,
            kind: zone.kind ?? "frame",
            group_id: zone.groupId ?? null,
            x: zone.x,
            y: zone.y,
            w: zone.w,
            h: zone.h,
            color: zone.color,
            created_at: toIso(zone.createdAt),
            updated_at: toIso(zone.updatedAt),
            deleted_at: deleted ? toIso(zone.deletedAt ?? zone.updatedAt) : null,
          };
        }),
        { onConflict: "id" },
      ),
    );

  const applyZoneGroupChanges = async (changes: DeltaZoneGroup[]) =>
    runChunked(changes, async (chunk) =>
      auth.supabase.from("zone_groups").upsert(
        chunk.map((group) => {
          const deleted = typeof group.deletedAt === "number";
          const revision = claimRevision();
          const payloadValue = { ...group, revision };
          registerChange("zone_group", group.id, revision, deleted, payloadValue);
          return {
            id: group.id,
            wall_id: wallId,
            owner_id: auth.user.id,
            revision,
            label: group.label,
            color: group.color,
            zone_ids: group.zoneIds,
            collapsed: group.collapsed,
            created_at: toIso(group.createdAt),
            updated_at: toIso(group.updatedAt),
            deleted_at: deleted ? toIso(group.deletedAt ?? group.updatedAt) : null,
          };
        }),
        { onConflict: "id" },
      ),
    );

  const applyNoteGroupChanges = async (changes: DeltaNoteGroup[]) =>
    runChunked(changes, async (chunk) =>
      auth.supabase.from("note_groups").upsert(
        chunk.map((group) => {
          const deleted = typeof group.deletedAt === "number";
          const revision = claimRevision();
          const payloadValue = { ...group, revision };
          registerChange("note_group", group.id, revision, deleted, payloadValue);
          return {
            id: group.id,
            wall_id: wallId,
            owner_id: auth.user.id,
            revision,
            label: group.label,
            color: group.color,
            note_ids: group.noteIds,
            collapsed: group.collapsed,
            created_at: toIso(group.createdAt),
            updated_at: toIso(group.updatedAt),
            deleted_at: deleted ? toIso(group.deletedAt ?? group.updatedAt) : null,
          };
        }),
        { onConflict: "id" },
      ),
    );

  const applyLinkChanges = async (changes: DeltaLink[]) =>
    runChunked(changes, async (chunk) =>
      auth.supabase.from("links").upsert(
        chunk.map((link) => {
          const deleted = typeof link.deletedAt === "number";
          const revision = claimRevision();
          const payloadValue = { ...link, revision };
          registerChange("link", link.id, revision, deleted, payloadValue);
          return {
            id: link.id,
            wall_id: wallId,
            owner_id: auth.user.id,
            revision,
            from_note_id: link.fromNoteId,
            to_note_id: link.toNoteId,
            type: link.type,
            label: link.label,
            created_at: toIso(link.createdAt),
            updated_at: toIso(link.updatedAt),
            deleted_at: deleted ? toIso(link.deletedAt ?? link.updatedAt) : null,
          };
        }),
        { onConflict: "id" },
      ),
    );

  const changeResults = await Promise.all([
    applyNoteChanges(body.notes),
    applyZoneChanges(body.zones),
    applyZoneGroupChanges(body.zoneGroups),
    applyNoteGroupChanges(body.noteGroups),
    applyLinkChanges(body.links),
  ]);

  const firstError = changeResults.find((result) => result.error)?.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  if (body.camera || body.lastColor !== undefined) {
    const revision = claimRevision();
    const { error } = await auth.supabase
      .from("walls")
      .update({
        ...(body.camera
          ? {
              camera_x: body.camera.x,
              camera_y: body.camera.y,
              camera_zoom: body.camera.zoom,
            }
          : {}),
        ...(body.lastColor !== undefined ? { last_color: body.lastColor ?? null } : {}),
        sync_version: revision,
      })
      .eq("id", wallId)
      .eq("owner_id", auth.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    registerChange("wall", wallId, revision, false, {
      id: wallId,
      revision,
      camera: body.camera,
      lastColor: body.lastColor,
    });
  } else if (nextVersion !== currentVersion) {
    const { error } = await auth.supabase
      .from("walls")
      .update({ sync_version: nextVersion })
      .eq("id", wallId)
      .eq("owner_id", auth.user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (wallChanges.length > 0) {
    const { error } = await auth.supabase.from("wall_changes").insert(wallChanges);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    wallId,
    previousVersion: currentVersion,
    currentVersion: nextVersion,
    appliedChanges: wallChanges.length,
  });
}
