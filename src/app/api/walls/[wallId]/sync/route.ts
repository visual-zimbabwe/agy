import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/api/auth";

const paramsSchema = z.object({
  wallId: z.string().uuid(),
});

const vocabularySchema = z.object({
  word: z.string(),
  sourceContext: z.string(),
  guessMeaning: z.string(),
  meaning: z.string(),
  ownSentence: z.string(),
  flipped: z.boolean().optional(),
  nextReviewAt: z.number(),
  lastReviewedAt: z.number().optional(),
  intervalDays: z.number(),
  reviewsCount: z.number(),
  lapses: z.number(),
  isFocus: z.boolean(),
  lastOutcome: z.enum(["again", "hard", "good", "easy"]).optional(),
});

const canonItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  text: z.string(),
  interpretation: z.string().optional().default(""),
});

const canonSchema = z.object({
  mode: z.enum(["single", "list"]),
  title: z.string(),
  statement: z.string(),
  interpretation: z.string(),
  example: z.string(),
  source: z.string(),
  items: z.array(canonItemSchema),
});

const eisenhowerQuadrantSchema = z.object({
  title: z.string(),
  content: z.string(),
});

const eisenhowerSchema = z.object({
  displayDate: z.string(),
  quadrants: z.object({
    doFirst: eisenhowerQuadrantSchema,
    schedule: eisenhowerQuadrantSchema,
    delegate: eisenhowerQuadrantSchema,
    delete: eisenhowerQuadrantSchema,
  }),
});

const currencySchema = z.object({
  status: z.enum(["idle", "locating", "loading", "ready", "error"]),
  detectedCountryCode: z.string().optional(),
  detectedCountryName: z.string().optional(),
  detectedCurrency: z.string().optional(),
  baseCurrency: z.string(),
  baseCurrencyMode: z.enum(["auto", "manual"]),
  manualBaseCurrency: z.string().optional(),
  amountInput: z.string(),
  usdRate: z.number(),
  previousUsdRate: z.number().optional(),
  thousandValueUsd: z.number(),
  rateUpdatedAt: z.number().optional(),
  rateSource: z.enum(["live", "cache", "default"]),
  detectionSource: z.enum(["geolocation", "ip", "manual", "default"]),
  trend: z.enum(["up", "down", "flat"]),
  error: z.string().optional(),
});

const bookmarkMetadataSchema = z.object({
  url: z.string(),
  finalUrl: z.string(),
  title: z.string(),
  description: z.string(),
  siteName: z.string(),
  domain: z.string(),
  faviconUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  kind: z.enum(["article", "video", "repo", "docs", "product", "post", "paper", "website"]),
  contentType: z.string().optional(),
});

const bookmarkSchema = z.object({
  url: z.string(),
  normalizedUrl: z.string(),
  metadata: bookmarkMetadataSchema.optional(),
  status: z.enum(["idle", "loading", "ready", "error"]),
  fetchedAt: z.number().optional(),
  lastSuccessAt: z.number().optional(),
  error: z.string().optional(),
});

const apodSchema = z.object({
  status: z.enum(["idle", "loading", "ready", "error"]),
  date: z.string().optional(),
  title: z.string().optional(),
  explanation: z.string().optional(),
  copyright: z.string().optional(),
  mediaType: z.enum(["image", "video", "other"]).optional(),
  imageUrl: z.string().optional(),
  fallbackImageUrl: z.string().optional(),
  pageUrl: z.string().optional(),
  fetchedAt: z.number().optional(),
  lastSuccessAt: z.number().optional(),
  error: z.string().optional(),
});

const privateNoteSchema = z.object({
  version: z.literal(1),
  salt: z.string(),
  iv: z.string(),
  ciphertext: z.string(),
  protectedAt: z.number(),
  updatedAt: z.number(),
});

const poetrySchema = z.object({
  status: z.enum(["idle", "loading", "ready", "error"]),
  dateKey: z.string().optional(),
  title: z.string().optional(),
  author: z.string().optional(),
  lines: z.array(z.string()),
  lineCount: z.number().optional(),
  sourceUrl: z.string().optional(),
  searchField: z.enum(["random", "author", "title", "lines", "linecount"]).optional(),
  searchQuery: z.string().optional(),
  matchType: z.enum(["partial", "exact"]).optional(),
  fetchedAt: z.number().optional(),
  lastSuccessAt: z.number().optional(),
  error: z.string().optional(),
});

const fileSchema = z.object({
  source: z.enum(["upload", "link"]),
  name: z.string(),
  url: z.string(),
  mimeType: z.string().optional(),
  extension: z.string().optional(),
  sizeBytes: z.number().optional(),
  uploadedAt: z.number().optional(),
});

const audioSchema = fileSchema.extend({
  durationSeconds: z.number().optional(),
});

const videoSchema = fileSchema.extend({
  durationSeconds: z.number().optional(),
  posterDataUrl: z.string().optional(),
});

const noteSchema = z.object({
  id: z.string().min(1),
  noteKind: z.enum(["standard", "quote", "canon", "journal", "eisenhower", "joker", "throne", "currency", "web-bookmark", "apod", "poetry", "economist", "image", "file", "audio", "video"]).optional(),
  text: z.string(),
  quoteAuthor: z.string().optional(),
  quoteSource: z.string().optional(),
  privateNote: privateNoteSchema.optional(),
  imageUrl: z.string().optional(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
  textVAlign: z.enum(["top", "middle", "bottom"]).optional(),
  textFont: z.string().optional(),
  textColor: z.string().optional(),
  pinned: z.boolean().optional(),
  highlighted: z.boolean().optional(),
  tags: z.array(z.string()),
  textSize: z.enum(["sm", "md", "lg"]).optional(),
  textSizePx: z.number().finite().min(8).max(72).transform((value) => Math.round(value)).optional(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  color: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  vocabulary: vocabularySchema.optional(),
  canon: canonSchema.optional(),
  eisenhower: eisenhowerSchema.optional(),
  currency: currencySchema.optional(),
  bookmark: bookmarkSchema.optional(),
  apod: apodSchema.optional(),
  poetry: poetrySchema.optional(),
  file: fileSchema.optional(),
  audio: audioSchema.optional(),
  video: videoSchema.optional(),
});

const zoneSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  kind: z.enum(["frame", "column", "swimlane"]).optional(),
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

const noteGroupSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  color: z.string(),
  noteIds: z.array(z.string()),
  collapsed: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const linkSchema = z.object({
  id: z.string().min(1),
  fromNoteId: z.string(),
  toNoteId: z.string(),
  type: z.enum(["cause_effect", "dependency", "idea_execution", "wiki"]),
  label: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const syncSchema = z.object({
  notes: z.record(z.string(), noteSchema),
  zones: z.record(z.string(), zoneSchema),
  zoneGroups: z.record(z.string(), zoneGroupSchema),
  noteGroups: z.record(z.string(), noteGroupSchema).default({}),
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
const toStoredTextSize = (note: { textSize?: "sm" | "md" | "lg"; textSizePx?: number }) =>
  typeof note.textSizePx === "number" ? `px:${Math.max(8, Math.min(72, Math.round(note.textSizePx)))}` : note.textSize ?? null;

const buildInFilter = (ids: string[]) =>
  `(${ids.map((id) => `"${id.replaceAll('"', '\\"')}"`).join(",")})`;

const isMissingZoneKindColumnError = (message?: string) =>
  Boolean(message && message.includes("column zones.kind does not exist"));
const isMissingNoteFormattingColumnError = (message?: string) =>
  Boolean(
    message &&
      (message.includes("column notes.note_kind does not exist") ||
        message.includes("column notes.quote_author does not exist") ||
        message.includes("column notes.quote_source does not exist") ||
        message.includes("column notes.private_note does not exist") ||
        message.includes("column notes.canon does not exist") ||
        message.includes("column notes.eisenhower does not exist") ||
        message.includes("column notes.currency does not exist") ||
        message.includes("column notes.bookmark does not exist") ||
        message.includes("column notes.apod does not exist") ||
        message.includes("column notes.poetry does not exist") ||
        message.includes("column notes.text_size does not exist") ||
        message.includes("column notes.image_url does not exist") ||
        message.includes("column notes.text_align does not exist") ||
        message.includes("column notes.text_v_align does not exist") ||
        message.includes("column notes.text_font does not exist") ||
        message.includes("column notes.text_color does not exist") ||
        message.includes("column notes.pinned does not exist") ||
        message.includes("column notes.highlighted does not exist")),
  );
const isMissingNoteVocabularyColumnError = (message?: string) =>
  Boolean(message && message.includes("column notes.vocabulary does not exist"));
const isMissingNoteGroupsTableError = (message?: string) =>
  Boolean(message && message.includes('relation "public.note_groups" does not exist'));

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
  const noteGroups = Object.values(snapshot.noteGroups);
  const links = Object.values(snapshot.links);

  const upsertNotes = async ({ includeFormatting, includeVocabulary }: { includeFormatting: boolean; includeVocabulary: boolean }) =>
    auth.supabase.from("notes").upsert(
      notes.map((note) => ({
        id: note.id,
        wall_id: wallId,
        owner_id: auth.user.id,
        text: note.text,
        ...(includeFormatting
          ? {
              note_kind: note.noteKind ?? "standard",
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
            }
          : {}),
        ...(includeVocabulary
          ? {
              vocabulary: note.vocabulary ?? null,
            }
          : {}),
        tags: note.tags,
        text_size: toStoredTextSize(note),
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
    );

  let notesUpsert = { error: null as { message: string } | null };
  if (notes.length) {
    const withFormattingAndVocabulary = await upsertNotes({ includeFormatting: true, includeVocabulary: true });
    if (withFormattingAndVocabulary.error) {
      if (isMissingNoteVocabularyColumnError(withFormattingAndVocabulary.error.message)) {
        const withFormatting = await upsertNotes({ includeFormatting: true, includeVocabulary: false });
        if (withFormatting.error && isMissingNoteFormattingColumnError(withFormatting.error.message)) {
          const legacy = await upsertNotes({ includeFormatting: false, includeVocabulary: false });
          notesUpsert = { error: legacy.error ? { message: legacy.error.message } : null };
        } else {
          notesUpsert = { error: withFormatting.error ? { message: withFormatting.error.message } : null };
        }
      } else if (isMissingNoteFormattingColumnError(withFormattingAndVocabulary.error.message)) {
        const legacy = await upsertNotes({ includeFormatting: false, includeVocabulary: false });
        notesUpsert = { error: legacy.error ? { message: legacy.error.message } : null };
      } else {
        notesUpsert = { error: { message: withFormattingAndVocabulary.error.message } };
      }
    } else {
      notesUpsert = { error: null };
    }
  }

  if (notesUpsert.error) {
    return NextResponse.json({ error: notesUpsert.error.message }, { status: 500 });
  }

  const upsertZones = async (includeKind: boolean) =>
    auth.supabase.from("zones").upsert(
      zones.map((zone) => ({
        id: zone.id,
        wall_id: wallId,
        owner_id: auth.user.id,
        label: zone.label,
        ...(includeKind ? { kind: zone.kind ?? "frame" } : {}),
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
    );

  let zonesUpsert = { error: null as { message: string } | null };
  if (zones.length) {
    const withKind = await upsertZones(true);
    if (withKind.error && isMissingZoneKindColumnError(withKind.error.message)) {
      const legacy = await upsertZones(false);
      zonesUpsert = { error: legacy.error ? { message: legacy.error.message } : null };
    } else {
      zonesUpsert = { error: withKind.error ? { message: withKind.error.message } : null };
    }
  }

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

  const noteGroupsUpsert = noteGroups.length
    ? await auth.supabase.from("note_groups").upsert(
        noteGroups.map((group) => ({
          id: group.id,
          wall_id: wallId,
          owner_id: auth.user.id,
          label: group.label,
          color: group.color,
          note_ids: group.noteIds,
          collapsed: group.collapsed,
          created_at: toIso(group.createdAt),
          updated_at: toIso(group.updatedAt),
          deleted_at: null,
        })),
        { onConflict: "id" },
      )
    : { error: null };

  if (noteGroupsUpsert.error && !isMissingNoteGroupsTableError(noteGroupsUpsert.error.message)) {
    return NextResponse.json({ error: noteGroupsUpsert.error.message }, { status: 500 });
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

  const deleteMissing = async (table: "notes" | "zones" | "zone_groups" | "note_groups" | "links", ids: string[]) => {
    const base = auth.supabase.from(table).delete().eq("wall_id", wallId).eq("owner_id", auth.user.id);
    if (ids.length === 0) {
      return base;
    }
    return base.not("id", "in", buildInFilter(ids));
  };

  const [notesDelete, zonesDelete, groupsDelete, noteGroupsDelete, linksDelete] = await Promise.all([
    deleteMissing("notes", notes.map((entity) => entity.id)),
    deleteMissing("zones", zones.map((entity) => entity.id)),
    deleteMissing("zone_groups", zoneGroups.map((entity) => entity.id)),
    deleteMissing("note_groups", noteGroups.map((entity) => entity.id)),
    deleteMissing("links", links.map((entity) => entity.id)),
  ]);

  const noteGroupsDeleteError =
    noteGroupsDelete.error && !isMissingNoteGroupsTableError(noteGroupsDelete.error.message)
      ? noteGroupsDelete.error
      : null;

  if (notesDelete.error || zonesDelete.error || groupsDelete.error || noteGroupsDeleteError || linksDelete.error) {
    return NextResponse.json(
      {
        error:
          notesDelete.error?.message ??
          zonesDelete.error?.message ??
          groupsDelete.error?.message ??
          noteGroupsDeleteError?.message ??
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
    noteGroups: snapshot.noteGroups,
    links: snapshot.links,
    camera: snapshot.camera,
    lastColor: snapshot.lastColor,
  };

  return NextResponse.json({
    serverSnapshot,
    serverTime: Date.now(),
  });
}




