import { NOTE_DEFAULTS } from "@/features/wall/constants";
import type { Link, Note, NoteGroup, PersistedWallState, VocabularyReviewOutcome, Zone, ZoneGroup } from "@/features/wall/types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asNumber = (value: unknown, fallback = 0) => (typeof value === "number" && Number.isFinite(value) ? value : fallback);
const asString = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);

const normalizeStringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];

const normalizeVocabulary = (value: unknown) => {
  if (!isRecord(value)) {
    return undefined;
  }

  const nextReviewAt = asNumber(value.nextReviewAt, Date.now());
  const intervalDays = Math.max(0, asNumber(value.intervalDays, 0));
  const lapses = Math.max(0, asNumber(value.lapses, 0));
  const lastOutcome: VocabularyReviewOutcome | undefined =
    value.lastOutcome === "again" || value.lastOutcome === "hard" || value.lastOutcome === "good" || value.lastOutcome === "easy"
      ? value.lastOutcome
      : undefined;

  return {
    word: asString(value.word),
    sourceContext: asString(value.sourceContext),
    guessMeaning: asString(value.guessMeaning),
    meaning: asString(value.meaning),
    ownSentence: asString(value.ownSentence),
    flipped: Boolean(value.flipped),
    nextReviewAt,
    lastReviewedAt: typeof value.lastReviewedAt === "number" ? asNumber(value.lastReviewedAt) : undefined,
    intervalDays,
    reviewsCount: Math.max(0, asNumber(value.reviewsCount, 0)),
    lapses,
    isFocus: typeof value.isFocus === "boolean" ? value.isFocus : lapses >= 3,
    lastOutcome,
  };
};

const normalizeNoteFont = (value: unknown) => {
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

const normalizeCamera = (value: unknown) => {
  if (!isRecord(value)) {
    return { x: 0, y: 0, zoom: 1 };
  }
  const zoom = asNumber(value.zoom, 1);
  return {
    x: asNumber(value.x),
    y: asNumber(value.y),
    zoom: zoom > 0 ? zoom : 1,
  };
};

const normalizeEntityRecord = <T>(
  value: unknown,
  normalize: (entry: Record<string, unknown>, id: string) => T | null,
): Record<string, T> | null => {
  if (isRecord(value)) {
    const entries = Object.entries(value);
    const normalized: Record<string, T> = {};
    for (const [id, raw] of entries) {
      if (!isRecord(raw)) {
        continue;
      }
      const item = normalize(raw, id);
      if (item) {
        normalized[id] = item;
      }
    }
    return normalized;
  }

  if (Array.isArray(value)) {
    const normalized: Record<string, T> = {};
    for (const raw of value) {
      if (!isRecord(raw)) {
        continue;
      }
      const candidateId = raw.id;
      if (typeof candidateId !== "string" || !candidateId) {
        continue;
      }
      const item = normalize(raw, candidateId);
      if (item) {
        normalized[candidateId] = item;
      }
    }
    return normalized;
  }

  return null;
};

const normalizeNote = (entry: Record<string, unknown>, fallbackId: string): Note | null => {
  const id = asString(entry.id, fallbackId);
  if (!id) {
    return null;
  }
  return {
    id,
    noteKind: entry.noteKind === "quote" ? "quote" : "standard",
    text: asString(entry.text),
    quoteAuthor: asString(entry.quoteAuthor).trim() || undefined,
    quoteSource: asString(entry.quoteSource).trim() || undefined,
    imageUrl: asString(entry.imageUrl).trim() || undefined,
    textAlign: entry.textAlign === "center" || entry.textAlign === "right" ? entry.textAlign : "left",
    textVAlign: entry.textVAlign === "middle" || entry.textVAlign === "bottom" ? entry.textVAlign : NOTE_DEFAULTS.textVAlign,
    textFont: normalizeNoteFont(entry.textFont),
    textColor: asString(entry.textColor, NOTE_DEFAULTS.textColor),
    textSizePx:
      typeof entry.textSizePx === "number" && Number.isFinite(entry.textSizePx) ? Math.max(8, Math.min(72, entry.textSizePx)) : NOTE_DEFAULTS.textSizePx,
    tags: normalizeStringList(entry.tags),
    textSize: entry.textSize === "sm" || entry.textSize === "md" || entry.textSize === "lg" ? entry.textSize : NOTE_DEFAULTS.textSize,
    pinned: Boolean(entry.pinned),
    highlighted: Boolean(entry.highlighted),
    x: asNumber(entry.x),
    y: asNumber(entry.y),
    w: asNumber(entry.w),
    h: asNumber(entry.h),
    color: asString(entry.color),
    createdAt: asNumber(entry.createdAt),
    updatedAt: asNumber(entry.updatedAt),
    vocabulary: normalizeVocabulary(entry.vocabulary),
  };
};

const normalizeZone = (entry: Record<string, unknown>, fallbackId: string): Zone | null => {
  const id = asString(entry.id, fallbackId);
  if (!id) {
    return null;
  }
  const groupId = typeof entry.groupId === "string" && entry.groupId ? entry.groupId : undefined;
  const kind = entry.kind === "column" || entry.kind === "swimlane" ? entry.kind : "frame";
  return {
    id,
    label: asString(entry.label),
    kind,
    groupId,
    x: asNumber(entry.x),
    y: asNumber(entry.y),
    w: asNumber(entry.w),
    h: asNumber(entry.h),
    color: asString(entry.color),
    createdAt: asNumber(entry.createdAt),
    updatedAt: asNumber(entry.updatedAt),
  };
};

const normalizeZoneGroup = (entry: Record<string, unknown>, fallbackId: string): ZoneGroup | null => {
  const id = asString(entry.id, fallbackId);
  if (!id) {
    return null;
  }
  return {
    id,
    label: asString(entry.label),
    color: asString(entry.color),
    zoneIds: normalizeStringList(entry.zoneIds),
    collapsed: Boolean(entry.collapsed),
    createdAt: asNumber(entry.createdAt),
    updatedAt: asNumber(entry.updatedAt),
  };
};

const normalizeLink = (entry: Record<string, unknown>, fallbackId: string): Link | null => {
  const id = asString(entry.id, fallbackId);
  if (!id) {
    return null;
  }

  const type = entry.type === "dependency" || entry.type === "idea_execution" ? entry.type : "cause_effect";
  return {
    id,
    fromNoteId: asString(entry.fromNoteId),
    toNoteId: asString(entry.toNoteId),
    type,
    label: asString(entry.label),
    createdAt: asNumber(entry.createdAt),
    updatedAt: asNumber(entry.updatedAt),
  };
};

const normalizeNoteGroup = (entry: Record<string, unknown>, fallbackId: string): NoteGroup | null => {
  const id = asString(entry.id, fallbackId);
  if (!id) {
    return null;
  }
  return {
    id,
    label: asString(entry.label),
    color: asString(entry.color),
    noteIds: normalizeStringList(entry.noteIds),
    collapsed: Boolean(entry.collapsed),
    createdAt: asNumber(entry.createdAt),
    updatedAt: asNumber(entry.updatedAt),
  };
};

export const normalizePersistedWallState = (value: unknown): PersistedWallState | null => {
  if (!isRecord(value)) {
    return null;
  }

  const notes = normalizeEntityRecord(value.notes, normalizeNote);
  const zones = normalizeEntityRecord(value.zones, normalizeZone);
  if (!notes || !zones) {
    return null;
  }

  const zoneGroups = normalizeEntityRecord(value.zoneGroups ?? {}, normalizeZoneGroup) ?? {};
  const noteGroups = normalizeEntityRecord(value.noteGroups ?? {}, normalizeNoteGroup) ?? {};
  const links = normalizeEntityRecord(value.links ?? {}, normalizeLink) ?? {};

  return {
    notes,
    zones,
    zoneGroups,
    noteGroups,
    links,
    camera: normalizeCamera(value.camera),
    lastColor: typeof value.lastColor === "string" ? value.lastColor : undefined,
  };
};

export const parseTimelinePayload = (payload: string): PersistedWallState | null => {
  try {
    const parsed = JSON.parse(payload) as unknown;
    return normalizePersistedWallState(parsed);
  } catch {
    return null;
  }
};
