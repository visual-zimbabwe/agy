import { NOTE_DEFAULTS } from "@/features/wall/constants";
import type { CanonNote, PersistedWallState, VocabularyNote, VocabularyReviewOutcome } from "@/features/wall/types";

type WallRow = {
  camera_x: number;
  camera_y: number;
  camera_zoom: number;
  last_color: string | null;
};

type NoteRow = {
  id: string;
  note_kind?: string | null;
  text: string;
  quote_author?: string | null;
  quote_source?: string | null;
  image_url?: string | null;
  text_align?: string | null;
  text_v_align?: string | null;
  text_font?: string | null;
  text_color?: string | null;
  pinned?: boolean | null;
  highlighted?: boolean | null;
  vocabulary?: unknown;
  canon?: unknown;
  tags: unknown;
  text_size: string | null;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  created_at: string;
  updated_at: string;
};

const normalizeNoteFont = (value: string | null | undefined) => {
  if (
    value === "roboto" ||
    value === "open_sans" ||
    value === "lato" ||
    value === "montserrat" ||
    value === "poppins" ||
    value === "nunito" ||
    value === "source_sans_3" ||
    value === "inter" ||
    value === "raleway" ||
    value === "ubuntu" ||
    value === "playfair_display" ||
    value === "merriweather" ||
    value === "pt_sans" ||
    value === "noto_sans" ||
    value === "work_sans" ||
    value === "oswald" ||
    value === "rubik" ||
    value === "fira_sans" ||
    value === "josefin_sans" ||
    value === "quicksand"
  ) {
    return value;
  }
  return "nunito";
};

type ZoneRow = {
  id: string;
  label: string;
  kind: string | null;
  group_id: string | null;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  created_at: string;
  updated_at: string;
};

type ZoneGroupRow = {
  id: string;
  label: string;
  color: string;
  zone_ids: unknown;
  collapsed: boolean;
  created_at: string;
  updated_at: string;
};

type NoteGroupRow = {
  id: string;
  label: string;
  color: string;
  note_ids: unknown;
  collapsed: boolean;
  created_at: string;
  updated_at: string;
};

type LinkRow = {
  id: string;
  from_note_id: string;
  to_note_id: string;
  type: string;
  label: string;
  created_at: string;
  updated_at: string;
};

export const toIso = (timestampMs: number) => new Date(timestampMs).toISOString();

export const fromIso = (timestampIso: string) => new Date(timestampIso).getTime();

export const hasContent = (snapshot: PersistedWallState) =>
  Object.keys(snapshot.notes).length > 0 ||
  Object.keys(snapshot.zones).length > 0 ||
  Object.keys(snapshot.zoneGroups).length > 0 ||
  Object.keys(snapshot.noteGroups).length > 0 ||
  Object.keys(snapshot.links).length > 0;

export const mergeSnapshotsLww = (server: PersistedWallState, local: PersistedWallState): PersistedWallState => {
  const mergeByUpdatedAt = <
    T extends {
      id: string;
      updatedAt: number;
    },
  >(
    serverMap: Record<string, T>,
    localMap: Record<string, T>,
  ) => {
    const merged: Record<string, T> = { ...serverMap };

    for (const [id, localValue] of Object.entries(localMap)) {
      const serverValue = serverMap[id];
      if (!serverValue || localValue.updatedAt >= serverValue.updatedAt) {
        merged[id] = localValue;
      }
    }

    return merged;
  };

  return {
    notes: mergeByUpdatedAt(server.notes, local.notes),
    zones: mergeByUpdatedAt(server.zones, local.zones),
    zoneGroups: mergeByUpdatedAt(server.zoneGroups, local.zoneGroups),
    noteGroups: mergeByUpdatedAt(server.noteGroups, local.noteGroups),
    links: mergeByUpdatedAt(server.links, local.links),
    camera: local.camera,
    lastColor: local.lastColor ?? server.lastColor,
  };
};

const parseTextSize = (raw: string | null): { textSize?: "sm" | "md" | "lg"; textSizePx?: number } => {
  if (!raw) {
    return {};
  }
  if (raw === "sm" || raw === "md" || raw === "lg") {
    return { textSize: raw };
  }
  const numeric = raw.startsWith("px:") ? Number(raw.slice(3)) : Number(raw);
  if (Number.isFinite(numeric)) {
    return { textSizePx: Math.max(8, Math.min(72, Math.round(numeric))) };
  }
  return {};
};

const parseVocabulary = (raw: unknown): VocabularyNote | undefined => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }

  const value = raw as Record<string, unknown>;
  const asString = (entry: unknown) => (typeof entry === "string" ? entry : "");
  const asNumber = (entry: unknown, fallback = 0) => (typeof entry === "number" && Number.isFinite(entry) ? entry : fallback);
  const asBoolean = (entry: unknown, fallback = false) => (typeof entry === "boolean" ? entry : fallback);
  const outcome = value.lastOutcome;
  const lastOutcome: VocabularyReviewOutcome | undefined =
    outcome === "again" || outcome === "hard" || outcome === "good" || outcome === "easy" ? outcome : undefined;

  const lapses = Math.max(0, asNumber(value.lapses, 0));
  return {
    word: asString(value.word),
    sourceContext: asString(value.sourceContext),
    guessMeaning: asString(value.guessMeaning),
    meaning: asString(value.meaning),
    ownSentence: asString(value.ownSentence),
    flipped: asBoolean(value.flipped, false),
    nextReviewAt: asNumber(value.nextReviewAt, Date.now()),
    lastReviewedAt: typeof value.lastReviewedAt === "number" ? asNumber(value.lastReviewedAt) : undefined,
    intervalDays: Math.max(0, asNumber(value.intervalDays, 0)),
    reviewsCount: Math.max(0, asNumber(value.reviewsCount, 0)),
    lapses,
    isFocus: asBoolean(value.isFocus, lapses >= 3),
    lastOutcome,
  };
};

const parseCanon = (raw: unknown): CanonNote | undefined => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }

  const value = raw as Record<string, unknown>;
  const asString = (entry: unknown) => (typeof entry === "string" ? entry : "");
  const items = Array.isArray(value.items)
    ? value.items
        .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null && !Array.isArray(entry))
        .map((entry, index) => ({
          id: asString(entry.id) || `canon-item-${index + 1}`,
          title: asString(entry.title),
          text: asString(entry.text),
          interpretation: asString(entry.interpretation),
        }))
    : [];

  const mode: CanonNote["mode"] = value.mode === "list" ? "list" : "single";
  return {
    mode,
    title: asString(value.title),
    statement: asString(value.statement),
    interpretation: asString(value.interpretation),
    example: asString(value.example),
    source: asString(value.source),
    items: items.length > 0 ? items : [{ id: "canon-item-1", title: "", text: "", interpretation: "" }],
  };
};

export const rowsToSnapshot = (rows: {
  wall: WallRow;
  notes: NoteRow[];
  zones: ZoneRow[];
  zoneGroups: ZoneGroupRow[];
  noteGroups: NoteGroupRow[];
  links: LinkRow[];
}): PersistedWallState => ({
  notes: Object.fromEntries(
    rows.notes.map((note) => [
      note.id,
      {
        ...parseTextSize(note.text_size),
        id: note.id,
        noteKind: note.note_kind === "quote" || note.note_kind === "canon" ? note.note_kind : "standard",
        text: note.text,
        quoteAuthor: note.quote_author?.trim() || undefined,
        quoteSource: note.quote_source?.trim() || undefined,
        imageUrl: note.image_url?.trim() || undefined,
        textAlign: note.text_align === "center" || note.text_align === "right" ? note.text_align : "left",
        textVAlign: note.text_v_align === "middle" || note.text_v_align === "bottom" ? note.text_v_align : NOTE_DEFAULTS.textVAlign,
        textFont: normalizeNoteFont(note.text_font),
        textColor: typeof note.text_color === "string" && note.text_color ? note.text_color : NOTE_DEFAULTS.textColor,
        pinned: Boolean(note.pinned),
        highlighted: Boolean(note.highlighted),
        vocabulary: parseVocabulary(note.vocabulary),
        canon: parseCanon(note.canon),
        tags: Array.isArray(note.tags) ? (note.tags as string[]) : [],
        x: note.x,
        y: note.y,
        w: note.w,
        h: note.h,
        color: note.color,
        createdAt: fromIso(note.created_at),
        updatedAt: fromIso(note.updated_at),
      },
    ]),
  ),
  zones: Object.fromEntries(
    rows.zones.map((zone) => [
      zone.id,
      {
        id: zone.id,
        label: zone.label,
        kind: zone.kind === "column" || zone.kind === "swimlane" ? zone.kind : "frame",
        groupId: zone.group_id ?? undefined,
        x: zone.x,
        y: zone.y,
        w: zone.w,
        h: zone.h,
        color: zone.color,
        createdAt: fromIso(zone.created_at),
        updatedAt: fromIso(zone.updated_at),
      },
    ]),
  ),
  zoneGroups: Object.fromEntries(
    rows.zoneGroups.map((group) => [
      group.id,
      {
        id: group.id,
        label: group.label,
        color: group.color,
        zoneIds: Array.isArray(group.zone_ids) ? (group.zone_ids as string[]) : [],
        collapsed: group.collapsed,
        createdAt: fromIso(group.created_at),
        updatedAt: fromIso(group.updated_at),
      },
    ]),
  ),
  noteGroups: Object.fromEntries(
    rows.noteGroups.map((group) => [
      group.id,
      {
        id: group.id,
        label: group.label,
        color: group.color,
        noteIds: Array.isArray(group.note_ids) ? (group.note_ids as string[]) : [],
        collapsed: group.collapsed,
        createdAt: fromIso(group.created_at),
        updatedAt: fromIso(group.updated_at),
      },
    ]),
  ),
  links: Object.fromEntries(
    rows.links.map((link) => [
      link.id,
      {
        id: link.id,
        fromNoteId: link.from_note_id,
        toNoteId: link.to_note_id,
        type:
          link.type === "cause_effect" || link.type === "dependency" || link.type === "idea_execution"
            ? link.type
            : "dependency",
        label: link.label,
        createdAt: fromIso(link.created_at),
        updatedAt: fromIso(link.updated_at),
      },
    ]),
  ),
  camera: {
    x: rows.wall.camera_x,
    y: rows.wall.camera_y,
    zoom: rows.wall.camera_zoom,
  },
  lastColor: rows.wall.last_color ?? undefined,
});
