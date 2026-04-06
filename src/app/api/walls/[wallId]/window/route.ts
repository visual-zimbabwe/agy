import { NextResponse } from "next/server";
import { z } from "zod";

import { rowsToSnapshot } from "@/features/wall/cloud";
import { buildWindowCandidateBounds, createWallWindowResponse } from "@/features/wall/spatial-read-model";
import type { WallWindowResponse } from "@/features/wall/types";
import { type WallBounds } from "@/features/wall/windowing";
import { requireApiUser } from "@/lib/api/auth";

const paramsSchema = z.object({
  wallId: z.string().uuid(),
});

const boundsSchema = z.object({
  minX: z.coerce.number().finite(),
  minY: z.coerce.number().finite(),
  maxX: z.coerce.number().finite(),
  maxY: z.coerce.number().finite(),
  candidateMargin: z.coerce.number().finite().min(0).max(5000).optional(),
});

type SnapshotArgs = Parameters<typeof rowsToSnapshot>[0];
type WallWindowRow = SnapshotArgs["wall"] & {
  id: string;
  title?: string | null;
  updated_at?: string | null;
  sync_version?: number | null;
};
type QueryErrorLike = { message: string };
type QueryRowsResult = { data: unknown[] | null; error: QueryErrorLike | null };
type QuerySingleResult = { data: Record<string, unknown> | null; error: QueryErrorLike | null };

type QueryBuilderLike = PromiseLike<QueryRowsResult | QuerySingleResult> & {
  eq: (column: string, value: unknown) => QueryBuilderLike;
  is: (column: string, value: null) => QueryBuilderLike;
  gte: (column: string, value: number) => QueryBuilderLike;
  lte: (column: string, value: number) => QueryBuilderLike;
  order: (column: string, options: { ascending: boolean }) => QueryBuilderLike;
  in: (column: string, values: string[]) => QueryBuilderLike;
  range: (from: number, to: number) => QueryBuilderLike;
  maybeSingle: () => Promise<QuerySingleResult>;
};

type QuerySourceLike = {
  select: (columns: string) => QueryBuilderLike;
};

type SupabaseLike = {
  from: (table: string) => QuerySourceLike;
};

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
        message.includes("column notes.bookmark does not exist") ||
        message.includes("column notes.file does not exist") ||
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
const isStatementTimeoutError = (message?: string) =>
  Boolean(message && message.includes("statement timeout"));

const wallReadBatchSize = 250;
const minWallReadBatchSize = 25;

const notesSelectWithFormatting =
    "id,revision,note_kind,text,quote_author,quote_source,private_note,image_url,text_align,text_v_align,text_font,text_color,pinned,highlighted,vocabulary,canon,eisenhower,bookmark,file,tags,text_size,x,y,w,h,color,created_at,updated_at";
const notesSelectWithoutVocabulary =
    "id,revision,note_kind,text,quote_author,quote_source,private_note,image_url,text_align,text_v_align,text_font,text_color,pinned,highlighted,canon,eisenhower,bookmark,file,tags,text_size,x,y,w,h,color,created_at,updated_at";
const notesSelectLegacy = "id,text,tags,text_size,x,y,w,h,color,created_at,updated_at,revision";
const zonesSelectWithKind = "id,revision,label,kind,group_id,x,y,w,h,color,created_at,updated_at";
const zonesSelectLegacy = "id,revision,label,group_id,x,y,w,h,color,created_at,updated_at";

const fetchBatchedRowsByRecency = async <TRow extends { id: string; updated_at: string },>(
  fetchPage: (
    from: number,
    to: number,
    batchSize: number,
  ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>,
  batchSize = wallReadBatchSize,
) => {
  const rows: TRow[] = [];

  for (let batchIndex = 0; ; batchIndex += 1) {
    const from = batchIndex * batchSize;
    const to = from + batchSize - 1;
    const result = await fetchPage(from, to, batchSize);

    if (result.error) {
      if (isStatementTimeoutError(result.error.message) && batchSize > minWallReadBatchSize) {
        const nextBatchSize = Math.max(minWallReadBatchSize, Math.ceil(batchSize / 2));
        return fetchBatchedRowsByRecency(fetchPage, nextBatchSize);
      }

      return { data: null as TRow[] | null, error: result.error, batchSize };
    }

    const page = (result.data ?? []) as TRow[];
    rows.push(...page);

    if (page.length < batchSize) {
      break;
    }
  }

  return { data: rows, error: null as { message: string } | null, batchSize };
};

export const __test__ = {
  fetchBatchedRowsByRecency,
  filterLinksToCandidateNoteIds: <TLink extends { from_note_id: string; to_note_id: string }>(
    links: TLink[],
    candidateNoteIds: Set<string>,
  ) =>
    links.filter(
      (link) =>
        candidateNoteIds.has(link.from_note_id) && candidateNoteIds.has(link.to_note_id),
    ),
};

const loadWindowNotes = async (
  supabase: SupabaseLike,
  ownerId: string,
  wallId: string,
  bounds: WallBounds,
) => {
  const baseQuery = (columns: string) =>
    async (from: number, to: number) =>
      (await supabase
        .from("notes")
        .select(columns)
        .eq("wall_id", wallId)
        .eq("owner_id", ownerId)
        .is("deleted_at", null)
        .gte("x", bounds.minX)
        .lte("x", bounds.maxX)
        .gte("y", bounds.minY)
        .lte("y", bounds.maxY)
        .order("updated_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to)) as QueryRowsResult;

  const fullResult = await fetchBatchedRowsByRecency<NonNullable<SnapshotArgs["notes"]>[number]>(
    baseQuery(notesSelectWithFormatting),
  );
  if (fullResult.error && isMissingNoteVocabularyColumnError(fullResult.error.message)) {
    const withoutVocabularyResult = await fetchBatchedRowsByRecency<NonNullable<SnapshotArgs["notes"]>[number]>(
      baseQuery(notesSelectWithoutVocabulary),
    );
    if (withoutVocabularyResult.error && isMissingNoteFormattingColumnError(withoutVocabularyResult.error.message)) {
      const legacyResult = await fetchBatchedRowsByRecency<NonNullable<SnapshotArgs["notes"]>[number]>(
        baseQuery(notesSelectLegacy),
      );
      if (legacyResult.error) {
        return { data: null as SnapshotArgs["notes"] | null, error: legacyResult.error };
      }
      return {
        data:
          ((legacyResult.data as Array<Record<string, unknown>> | null)?.map((note) => ({
            ...note,
            note_kind: "standard",
            quote_author: null,
            quote_source: null,
            private_note: null,
            image_url: null,
            text_align: null,
            text_v_align: null,
            text_font: null,
            text_color: null,
            pinned: false,
            highlighted: false,
            vocabulary: null,
            canon: null,
            eisenhower: null,
            bookmark: null,
            file: null,
          })) as SnapshotArgs["notes"]) ?? [],
        error: null,
      };
    }

    if (withoutVocabularyResult.error) {
      return { data: null as SnapshotArgs["notes"] | null, error: withoutVocabularyResult.error };
    }

    return {
      data: (((withoutVocabularyResult.data as unknown as SnapshotArgs["notes"] | null) ?? []).map((note) => ({ ...note, vocabulary: null })) as SnapshotArgs["notes"]),
      error: null,
    };
  }

  if (fullResult.error && isMissingNoteFormattingColumnError(fullResult.error.message)) {
    const legacyResult = await fetchBatchedRowsByRecency<NonNullable<SnapshotArgs["notes"]>[number]>(
      baseQuery(notesSelectLegacy),
    );
    if (legacyResult.error) {
      return { data: null as SnapshotArgs["notes"] | null, error: legacyResult.error };
    }
    return {
      data:
        ((legacyResult.data as Array<Record<string, unknown>> | null)?.map((note) => ({
          ...note,
          note_kind: "standard",
          quote_author: null,
          quote_source: null,
          private_note: null,
          image_url: null,
          text_align: null,
          text_v_align: null,
          text_font: null,
          text_color: null,
          pinned: false,
          highlighted: false,
          vocabulary: null,
          canon: null,
          eisenhower: null,
          bookmark: null,
          file: null,
        })) as SnapshotArgs["notes"]) ?? [],
      error: null,
    };
  }

  return {
    data: (fullResult.data as SnapshotArgs["notes"] | null) ?? [],
    error: fullResult.error,
  };
};

const loadWindowZones = async (
  supabase: SupabaseLike,
  ownerId: string,
  wallId: string,
  bounds: WallBounds,
) => {
  const baseQuery = (columns: string) =>
    async (from: number, to: number) =>
      (await supabase
        .from("zones")
        .select(columns)
        .eq("wall_id", wallId)
        .eq("owner_id", ownerId)
        .is("deleted_at", null)
        .gte("x", bounds.minX)
        .lte("x", bounds.maxX)
        .gte("y", bounds.minY)
        .lte("y", bounds.maxY)
        .order("updated_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to)) as QueryRowsResult;

  const withKindResult = await fetchBatchedRowsByRecency<NonNullable<SnapshotArgs["zones"]>[number]>(
    baseQuery(zonesSelectWithKind),
  );
  if (withKindResult.error && isMissingZoneKindColumnError(withKindResult.error.message)) {
    const legacyResult = await fetchBatchedRowsByRecency<NonNullable<SnapshotArgs["zones"]>[number]>(
      baseQuery(zonesSelectLegacy),
    );
    if (legacyResult.error) {
      return { data: null as SnapshotArgs["zones"] | null, error: legacyResult.error };
    }
    return {
      data: (((legacyResult.data as Array<Record<string, unknown>> | null)?.map((zone) => ({ ...zone, kind: "frame" })) as SnapshotArgs["zones"]) ?? []),
      error: null,
    };
  }

  return {
    data: (withKindResult.data as SnapshotArgs["zones"] | null) ?? [],
    error: withKindResult.error,
  };
};

const loadWindowLinks = async (
  supabase: SupabaseLike,
  ownerId: string,
  wallId: string,
  candidateNoteIds: Set<string>,
) => {
  if (candidateNoteIds.size === 0) {
    return { data: [] as SnapshotArgs["links"], error: null as QueryErrorLike | null };
  }

  const linksResult = await fetchBatchedRowsByRecency<NonNullable<SnapshotArgs["links"]>[number]>(
    async (from, to) =>
      (await supabase
        .from("links")
        .select("id,revision,from_note_id,to_note_id,type,label,created_at,updated_at")
        .eq("wall_id", wallId)
        .eq("owner_id", ownerId)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to)) as QueryRowsResult,
  );

  if (linksResult.error) {
    return { data: null as SnapshotArgs["links"] | null, error: linksResult.error };
  }

  return {
    data: __test__.filterLinksToCandidateNoteIds(
      (linksResult.data ?? []) as SnapshotArgs["links"],
      candidateNoteIds,
    ) as SnapshotArgs["links"],
    error: null as QueryErrorLike | null,
  };
};

export async function GET(request: Request, context: { params: Promise<{ wallId: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid wall id" }, { status: 400 });
  }

  const url = new URL(request.url);
  const parsedBounds = boundsSchema.safeParse({
    minX: url.searchParams.get("minX"),
    minY: url.searchParams.get("minY"),
    maxX: url.searchParams.get("maxX"),
    maxY: url.searchParams.get("maxY"),
    candidateMargin: url.searchParams.get("candidateMargin") ?? undefined,
  });

  if (!parsedBounds.success || parsedBounds.data.maxX < parsedBounds.data.minX || parsedBounds.data.maxY < parsedBounds.data.minY) {
    return NextResponse.json({ error: "Invalid window bounds" }, { status: 400 });
  }

  const wallId = parsedParams.data.wallId;
  const bounds: WallBounds = {
    minX: parsedBounds.data.minX,
    minY: parsedBounds.data.minY,
    maxX: parsedBounds.data.maxX,
    maxY: parsedBounds.data.maxY,
  };
  const candidateBounds = buildWindowCandidateBounds(bounds, parsedBounds.data.candidateMargin ?? 1200);

  const supabase = auth.supabase as unknown as SupabaseLike;

  const [wallResult, zoneGroupsResult, noteGroupsResult, notesResult, zonesResult] = await Promise.all([
    supabase
      .from("walls")
      .select("id,title,camera_x,camera_y,camera_zoom,last_color,updated_at,sync_version")
      .eq("id", wallId)
      .eq("owner_id", auth.user.id)
      .maybeSingle(),
    supabase
      .from("zone_groups")
      .select("id,revision,label,color,zone_ids,collapsed,created_at,updated_at")
      .eq("wall_id", wallId)
      .eq("owner_id", auth.user.id)
      .is("deleted_at", null),
    supabase
      .from("note_groups")
      .select("id,revision,label,color,note_ids,collapsed,created_at,updated_at")
      .eq("wall_id", wallId)
      .eq("owner_id", auth.user.id)
      .is("deleted_at", null),
    loadWindowNotes(supabase, auth.user.id, wallId, candidateBounds),
    loadWindowZones(supabase, auth.user.id, wallId, candidateBounds),
  ]);

  const wallRow = wallResult.data as WallWindowRow | null;

  if (wallResult.error || !wallRow) {
    return NextResponse.json({ error: "Wall not found" }, { status: 404 });
  }
  if (zoneGroupsResult.error) {
    return NextResponse.json({ error: zoneGroupsResult.error.message }, { status: 500 });
  }
  if (noteGroupsResult.error && !isMissingNoteGroupsTableError(noteGroupsResult.error.message)) {
    return NextResponse.json({ error: noteGroupsResult.error.message }, { status: 500 });
  }
  if (notesResult.error) {
    return NextResponse.json({ error: notesResult.error.message }, { status: 500 });
  }
  if (zonesResult.error) {
    return NextResponse.json({ error: zonesResult.error.message }, { status: 500 });
  }

  const candidateNoteIds = new Set(((notesResult.data ?? []) as Array<{ id: string }>).map((note) => note.id));

  const linksResult = await loadWindowLinks(
    supabase,
    auth.user.id,
    wallId,
    candidateNoteIds,
  );

  if (linksResult.error) {
    return NextResponse.json({ error: linksResult.error.message }, { status: 500 });
  }

  const payload: WallWindowResponse = createWallWindowResponse({
    shell: {
      id: wallRow.id,
      title: wallRow.title ?? undefined,
      camera: {
        x: wallRow.camera_x,
        y: wallRow.camera_y,
        zoom: wallRow.camera_zoom,
      },
      lastColor: wallRow.last_color ?? undefined,
      updatedAt: wallRow.updated_at ?? undefined,
      syncVersion: wallRow.sync_version ?? 0,
    },
    wall: wallRow,
    bounds,
    candidateBounds,
    notes: (notesResult.data ?? []) as SnapshotArgs["notes"],
    zones: (zonesResult.data ?? []) as SnapshotArgs["zones"],
    zoneGroups: (zoneGroupsResult.data ?? []) as SnapshotArgs["zoneGroups"],
    noteGroups: ((noteGroupsResult.data ?? []) as SnapshotArgs["noteGroups"]) ?? [],
    links: (linksResult.data ?? []) as SnapshotArgs["links"],
  });

  return NextResponse.json(payload);
}
