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

type SnapshotArgs = Parameters<typeof rowsToSnapshot>[0];

const wallReadBatchSize = 250;
const minWallReadBatchSize = 25;

const memorySnapshotMb = () => {
  if (typeof process === "undefined" || typeof process.memoryUsage !== "function") {
    return null;
  }

  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / (1024 * 1024)),
    heapUsed: Math.round(usage.heapUsed / (1024 * 1024)),
    heapTotal: Math.round(usage.heapTotal / (1024 * 1024)),
  };
};

const logWallReadDiagnostic = (
  level: "info" | "warn" | "error",
  event: string,
  detail: Record<string, unknown>,
) => {
  const logger =
    level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  logger("[wall-read]", JSON.stringify({ event, ...detail }));
};

const fetchBatchedRowsByRecency = async <TRow extends { id: string; updated_at: string },>(
  fetchPage: (
    from: number,
    to: number,
    batchSize: number,
  ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>,
  batchSize = wallReadBatchSize,
) => {
  const rows: TRow[] = [];
  const batches: Array<{ index: number; count: number; durationMs: number; lastId: string | null }> = [];
  for (let batchIndex = 0; ; batchIndex += 1) {
    const from = batchIndex * batchSize;
    const to = from + batchSize - 1;
    const startedAt = Date.now();
    const result = await fetchPage(from, to, batchSize);
    const durationMs = Date.now() - startedAt;
    if (result.error) {
      if (isStatementTimeoutError(result.error.message) && batchSize > minWallReadBatchSize) {
        const nextBatchSize = Math.max(minWallReadBatchSize, Math.ceil(batchSize / 2));
        return fetchBatchedRowsByRecency(fetchPage, nextBatchSize);
      }
      return { data: null as TRow[] | null, error: result.error, batches, batchSize };
    }

    const page = (result.data ?? []) as TRow[];
    rows.push(...page);
    const lastId: string | null = page.length > 0 ? page[page.length - 1]?.id ?? null : null;
    batches.push({ index: batchIndex, count: page.length, durationMs, lastId });

    if (page.length < batchSize) {
      break;
    }
  }

  return { data: rows, error: null as { message: string } | null, batches, batchSize };
};

export const __test__ = {
  fetchBatchedRowsByRecency,
};

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
  const requestStartedAt = Date.now();

  logWallReadDiagnostic("info", "start", {
    wallId,
    batchSize: wallReadBatchSize,
    memoryMb: memorySnapshotMb(),
  });

  const [wallResult, groupsResult, noteGroupsResult, linksResult] = await Promise.all([
    auth.supabase
      .from("walls")
      .select("id,camera_x,camera_y,camera_zoom,last_color,updated_at,sync_version")
      .eq("id", wallId)
      .eq("owner_id", auth.user.id)
      .maybeSingle(),
    auth.supabase
      .from("zone_groups")
      .select("id,revision,label,color,zone_ids,collapsed,created_at,updated_at")
      .eq("wall_id", wallId)
      .eq("owner_id", auth.user.id)
      .is("deleted_at", null),
    auth.supabase
      .from("note_groups")
      .select("id,revision,label,color,note_ids,collapsed,created_at,updated_at")
      .eq("wall_id", wallId)
      .eq("owner_id", auth.user.id)
      .is("deleted_at", null),
    auth.supabase
      .from("links")
      .select("id,revision,from_note_id,to_note_id,type,label,created_at,updated_at")
      .eq("wall_id", wallId)
      .eq("owner_id", auth.user.id)
      .is("deleted_at", null),
  ]);

  if (wallResult.error || !wallResult.data) {
    return NextResponse.json({ error: "Wall not found" }, { status: 404 });
  }

  if (groupsResult.error || linksResult.error) {
    logWallReadDiagnostic("error", "base-query-failed", {
      wallId,
      groupsError: groupsResult.error?.message,
      linksError: linksResult.error?.message,
      durationMs: Date.now() - requestStartedAt,
      memoryMb: memorySnapshotMb(),
    });
    return NextResponse.json(
      {
        error: groupsResult.error?.message ?? linksResult.error?.message ?? "Query failed",
      },
      { status: 500 },
    );
  }

  let noteGroupsData = noteGroupsResult.data ?? [];
  if (noteGroupsResult.error) {
    if (!isMissingNoteGroupsTableError(noteGroupsResult.error.message)) {
      logWallReadDiagnostic("error", "note-groups-query-failed", {
        wallId,
        error: noteGroupsResult.error.message,
        durationMs: Date.now() - requestStartedAt,
        memoryMb: memorySnapshotMb(),
      });
      return NextResponse.json({ error: noteGroupsResult.error.message }, { status: 500 });
    }
    noteGroupsData = [];
  }

  const notesSelectWithFormatting =
    "id,revision,note_kind,text,quote_author,quote_source,private_note,image_url,text_align,text_v_align,text_font,text_color,pinned,highlighted,vocabulary,canon,eisenhower,bookmark,file,tags,text_size,x,y,w,h,color,created_at,updated_at";
  const notesSelectWithoutVocabulary =
    "id,revision,note_kind,text,quote_author,quote_source,private_note,image_url,text_align,text_v_align,text_font,text_color,pinned,highlighted,canon,eisenhower,bookmark,file,tags,text_size,x,y,w,h,color,created_at,updated_at";
  const notesSelectLegacy = "id,text,tags,text_size,x,y,w,h,color,created_at,updated_at,revision";
  const zonesSelectWithKind = "id,revision,label,kind,group_id,x,y,w,h,color,created_at,updated_at";
  const zonesSelectLegacy = "id,revision,label,group_id,x,y,w,h,color,created_at,updated_at";

  const notesWithFormattingResult = await fetchBatchedRowsByRecency<NonNullable<SnapshotArgs["notes"]>[number]>(async (from, to) => {
    return await auth.supabase
      .from("notes")
      .select(notesSelectWithFormatting)
      .eq("wall_id", wallId)
      .eq("owner_id", auth.user.id)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);
  });

  let notesData: SnapshotArgs["notes"] | null = notesWithFormattingResult.data as unknown as SnapshotArgs["notes"] | null;
  if (notesWithFormattingResult.error && isMissingNoteVocabularyColumnError(notesWithFormattingResult.error.message)) {
    const notesWithoutVocabularyResult = await fetchBatchedRowsByRecency<NonNullable<SnapshotArgs["notes"]>[number]>(async (from, to) => {
      return await auth.supabase
        .from("notes")
        .select(notesSelectWithoutVocabulary)
        .eq("wall_id", wallId)
        .eq("owner_id", auth.user.id)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to);
    });

    if (notesWithoutVocabularyResult.error && isMissingNoteFormattingColumnError(notesWithoutVocabularyResult.error.message)) {
      const notesLegacyResult = await fetchBatchedRowsByRecency<NonNullable<SnapshotArgs["notes"]>[number]>(async (from, to) => {
        return await auth.supabase
          .from("notes")
          .select(notesSelectLegacy)
          .eq("wall_id", wallId)
          .eq("owner_id", auth.user.id)
          .is("deleted_at", null)
          .order("updated_at", { ascending: false })
          .order("id", { ascending: false })
          .range(from, to);
      });
      if (notesLegacyResult.error) {
        logWallReadDiagnostic("error", "notes-legacy-query-failed", {
          wallId,
          error: notesLegacyResult.error.message,
          durationMs: Date.now() - requestStartedAt,
          memoryMb: memorySnapshotMb(),
        });
        return NextResponse.json({ error: notesLegacyResult.error.message }, { status: 500 });
      }
      notesData =
        (notesLegacyResult.data?.map((note) => ({
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
        })) as SnapshotArgs["notes"]) ?? [];
    } else if (notesWithoutVocabularyResult.error) {
      logWallReadDiagnostic("error", "notes-query-failed", {
        wallId,
        mode: "without-vocabulary",
        error: notesWithoutVocabularyResult.error.message,
        batches: notesWithoutVocabularyResult.batches,
        durationMs: Date.now() - requestStartedAt,
        memoryMb: memorySnapshotMb(),
      });
      return NextResponse.json({ error: notesWithoutVocabularyResult.error.message }, { status: 500 });
    } else {
      notesData = (((notesWithoutVocabularyResult.data as unknown as SnapshotArgs["notes"] | null) ?? []).map((note) => ({ ...note, vocabulary: null })) as SnapshotArgs["notes"]);
    }
  } else if (notesWithFormattingResult.error && isMissingNoteFormattingColumnError(notesWithFormattingResult.error.message)) {
    const notesLegacyResult = await fetchBatchedRowsByRecency<NonNullable<SnapshotArgs["notes"]>[number]>(async (from, to) => {
      return await auth.supabase
        .from("notes")
        .select(notesSelectLegacy)
        .eq("wall_id", wallId)
        .eq("owner_id", auth.user.id)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to);
    });
    if (notesLegacyResult.error) {
      logWallReadDiagnostic("error", "notes-legacy-query-failed", {
        wallId,
        error: notesLegacyResult.error.message,
        durationMs: Date.now() - requestStartedAt,
        memoryMb: memorySnapshotMb(),
      });
      return NextResponse.json({ error: notesLegacyResult.error.message }, { status: 500 });
    }
    notesData =
      (notesLegacyResult.data?.map((note) => ({
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
      })) as SnapshotArgs["notes"]) ?? [];
  } else if (notesWithFormattingResult.error) {
    logWallReadDiagnostic("error", "notes-query-failed", {
      wallId,
      mode: "full",
      error: notesWithFormattingResult.error.message,
      batches: notesWithFormattingResult.batches,
      durationMs: Date.now() - requestStartedAt,
      memoryMb: memorySnapshotMb(),
    });
    return NextResponse.json({ error: notesWithFormattingResult.error.message }, { status: 500 });
  }

  logWallReadDiagnostic("info", "rows-fetched", {
    wallId,
    notesCount: notesData?.length ?? 0,
    noteBatchSize: notesWithFormattingResult.batchSize,
    noteBatches: notesWithFormattingResult.batches,
    zoneGroupsCount: groupsResult.data?.length ?? 0,
    noteGroupsCount: noteGroupsData.length,
    linksCount: linksResult.data?.length ?? 0,
    durationMs: Date.now() - requestStartedAt,
    memoryMb: memorySnapshotMb(),
  });

  const zonesWithKindResult = await fetchBatchedRowsByRecency<NonNullable<SnapshotArgs["zones"]>[number]>(async (from, to) => {
    return await auth.supabase
      .from("zones")
      .select(zonesSelectWithKind)
      .eq("wall_id", wallId)
      .eq("owner_id", auth.user.id)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);
  });

  let zonesData: SnapshotArgs["zones"] | null = zonesWithKindResult.data as unknown as SnapshotArgs["zones"] | null;
  if (zonesWithKindResult.error && isMissingZoneKindColumnError(zonesWithKindResult.error.message)) {
    const zonesLegacyResult = await fetchBatchedRowsByRecency<NonNullable<SnapshotArgs["zones"]>[number]>(async (from, to) => {
      return await auth.supabase
        .from("zones")
        .select(zonesSelectLegacy)
        .eq("wall_id", wallId)
        .eq("owner_id", auth.user.id)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to);
    });
    if (zonesLegacyResult.error) {
      logWallReadDiagnostic("error", "zones-legacy-query-failed", {
        wallId,
        error: zonesLegacyResult.error.message,
        durationMs: Date.now() - requestStartedAt,
        memoryMb: memorySnapshotMb(),
      });
      return NextResponse.json({ error: zonesLegacyResult.error.message }, { status: 500 });
    }
    zonesData = (zonesLegacyResult.data?.map((zone) => ({ ...zone, kind: "frame" })) as SnapshotArgs["zones"]) ?? [];
  } else if (zonesWithKindResult.error) {
    logWallReadDiagnostic("error", "zones-query-failed", {
      wallId,
      error: zonesWithKindResult.error.message,
      batches: zonesWithKindResult.batches,
      durationMs: Date.now() - requestStartedAt,
      memoryMb: memorySnapshotMb(),
    });
    return NextResponse.json({ error: zonesWithKindResult.error.message }, { status: 500 });
  }

  logWallReadDiagnostic("info", "pre-snapshot-build", {
    wallId,
    notesCount: notesData?.length ?? 0,
    zonesCount: zonesData?.length ?? 0,
    zoneGroupsCount: groupsResult.data?.length ?? 0,
    noteGroupsCount: noteGroupsData.length,
    linksCount: linksResult.data?.length ?? 0,
    zonesBatchSize: zonesWithKindResult.batchSize,
    zonesBatches: zonesWithKindResult.batches,
    durationMs: Date.now() - requestStartedAt,
    memoryMb: memorySnapshotMb(),
  });

  try {
    const snapshot = rowsToSnapshot({
      wall: wallResult.data,
      notes: (notesData ?? []) as SnapshotArgs["notes"],
      zones: (zonesData ?? []) as SnapshotArgs["zones"],
      zoneGroups: (groupsResult.data ?? []) as SnapshotArgs["zoneGroups"],
      noteGroups: noteGroupsData as SnapshotArgs["noteGroups"],
      links: (linksResult.data ?? []) as SnapshotArgs["links"],
    });

    logWallReadDiagnostic("info", "success", {
      wallId,
      durationMs: Date.now() - requestStartedAt,
      memoryMb: memorySnapshotMb(),
    });

    return NextResponse.json({
      wall: wallResult.data,
      snapshot,
      syncVersion: wallResult.data.sync_version ?? 0,
    });
  } catch (error) {
    logWallReadDiagnostic("error", "snapshot-build-failed", {
      wallId,
      error: error instanceof Error ? error.message : "Unknown snapshot build error",
      durationMs: Date.now() - requestStartedAt,
      memoryMb: memorySnapshotMb(),
      notesCount: notesData?.length ?? 0,
      zonesCount: zonesData?.length ?? 0,
      zoneGroupsCount: groupsResult.data?.length ?? 0,
      noteGroupsCount: noteGroupsData.length,
      linksCount: linksResult.data?.length ?? 0,
    });
    return NextResponse.json({ error: "Unable to build wall snapshot" }, { status: 500 });
  }
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
