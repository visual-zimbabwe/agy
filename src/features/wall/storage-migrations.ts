import { NOTE_DEFAULTS } from "@/features/wall/constants";
import type { Link, Note, NoteGroup, PersistedWallState, Zone, ZoneGroup } from "@/features/wall/types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asNumber = (value: unknown, fallback = 0) => (typeof value === "number" && Number.isFinite(value) ? value : fallback);
const asString = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);

const normalizeStringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];

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
    text: asString(entry.text),
    tags: normalizeStringList(entry.tags),
    textSize: entry.textSize === "sm" || entry.textSize === "lg" ? entry.textSize : NOTE_DEFAULTS.textSize,
    x: asNumber(entry.x),
    y: asNumber(entry.y),
    w: asNumber(entry.w),
    h: asNumber(entry.h),
    color: asString(entry.color),
    createdAt: asNumber(entry.createdAt),
    updatedAt: asNumber(entry.updatedAt),
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
