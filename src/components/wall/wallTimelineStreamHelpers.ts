import { resolveWallPreviewDimensions } from "@/components/wall/wallNotePreviewSizing";
import { getFileNoteTitle } from "@/features/wall/file-notes";
import { getImageNoteTitle } from "@/features/wall/image-notes";
import { getNoteWikiTitle } from "@/features/wall/wiki-links";
import type { Note } from "@/features/wall/types";

export type TimelineStreamDirection = "next" | "previous";
export type TimelineStreamSortMode = "created" | "updated";

export type TimelineStreamEntry = {
  id: string;
  note: Note;
  ts: number;
  side: "left" | "right" | "center";
  desktop: ReturnType<typeof resolveWallPreviewDimensions>;
  mobile: ReturnType<typeof resolveWallPreviewDimensions>;
};

export type TimelineStreamGroup = {
  key: string;
  label: string;
  entries: TimelineStreamEntry[];
};

export type TimelineStreamDayOption = {
  key: string;
  label: string;
};

export const normalizeTimelineStreamQuery = (query: string) => query.trim().toLowerCase();

export const timelineStreamDayKey = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

export const timelineStreamStartOfDay = (timestamp: number) => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

export const formatTimelineStreamDayLabel = (timestamp: number, latestDay: number) => {
  const deltaDays = Math.round((latestDay - timelineStreamStartOfDay(timestamp)) / 86_400_000);
  if (deltaDays === 0) {
    return "Today";
  }
  if (deltaDays === 1) {
    return "Yesterday";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(timestamp);
};

export const getTimelineStreamSearchHaystack = (note: Note): string[] => {
  const haystack: string[] = [getNoteWikiTitle(note), ...note.tags];

  if (note.file?.name) {
    haystack.push(getFileNoteTitle(note.file));
  }
  if (note.audio?.name) {
    haystack.push(note.audio.name);
  }
  if (note.video?.name) {
    haystack.push(note.video.name);
  }
  if (note.imageUrl) {
    haystack.push(getImageNoteTitle(note.file));
  }
  if (note.bookmark?.metadata?.title) {
    haystack.push(note.bookmark.metadata.title);
  }
  if (note.bookmark?.url) {
    haystack.push(note.bookmark.url);
  }
  if (note.canon?.title) {
    haystack.push(note.canon.title);
  }
  if (note.quoteAuthor) {
    haystack.push(note.quoteAuthor);
  }
  if (note.quoteSource) {
    haystack.push(note.quoteSource);
  }
  if (note.vocabulary?.word) {
    haystack.push(note.vocabulary.word);
  }

  return haystack.filter((value) => value.trim().length > 0);
};

export const matchesTimelineStreamSearch = (note: Note, query: string) => {
  const normalized = normalizeTimelineStreamQuery(query);
  if (!normalized) {
    return true;
  }

  return getTimelineStreamSearchHaystack(note).some((value) => value.toLowerCase().includes(normalized));
};

export const filterTimelineStreamNotes = (notes: readonly Note[], query: string) =>
  notes.filter((note) => !note.deletedAt && matchesTimelineStreamSearch(note, query));

const getNoteSortTimestamp = (note: Note, sortMode: TimelineStreamSortMode) =>
  sortMode === "updated" ? note.updatedAt : note.createdAt;

export const buildTimelineStreamGroups = (
  notes: readonly Note[],
  options?: {
    sortMode?: TimelineStreamSortMode;
    searchQuery?: string;
  },
): TimelineStreamGroup[] => {
  const sortMode = options?.sortMode ?? "created";
  const filtered = filterTimelineStreamNotes(notes, options?.searchQuery ?? "");

  const sorted = [...filtered].sort((left, right) => {
    const delta = getNoteSortTimestamp(right, sortMode) - getNoteSortTimestamp(left, sortMode);
    if (delta !== 0) {
      return delta;
    }
    return right.createdAt - left.createdAt;
  });

  if (sorted.length === 0) {
    return [];
  }

  const latestDay = timelineStreamStartOfDay(getNoteSortTimestamp(sorted[0]!, sortMode));
  let streamIndex = 0;
  const groupMap = new Map<string, TimelineStreamGroup>();

  for (const note of sorted) {
    const timestamp = getNoteSortTimestamp(note, sortMode);
    const key = timelineStreamDayKey(timestamp);
    const side = note.pinned ? "center" : streamIndex % 2 === 0 ? "left" : "right";

    if (!note.pinned) {
      streamIndex += 1;
    }

    const entry: TimelineStreamEntry = {
      id: note.id,
      note,
      ts: timestamp,
      side,
      desktop: resolveWallPreviewDimensions(note, { surface: "timeline-stream" }),
      mobile: resolveWallPreviewDimensions(note, { surface: "timeline-stream" }),
    };

    const current = groupMap.get(key);
    if (current) {
      current.entries.push(entry);
      continue;
    }

    groupMap.set(key, {
      key,
      label: formatTimelineStreamDayLabel(timestamp, latestDay),
      entries: [entry],
    });
  }

  return [...groupMap.values()];
};

export const getTimelineStreamDayOptions = (groups: readonly TimelineStreamGroup[]): TimelineStreamDayOption[] =>
  groups.map((group) => ({
    key: group.key,
    label: group.label,
  }));

export const moveTimelineStreamSelection = (
  entryIds: readonly string[],
  currentId: string | undefined,
  direction: TimelineStreamDirection,
): string | undefined => {
  if (entryIds.length === 0) {
    return undefined;
  }

  if (!currentId) {
    return direction === "next" ? entryIds[0] : entryIds[entryIds.length - 1];
  }

  const index = entryIds.indexOf(currentId);
  if (index < 0) {
    return entryIds[0];
  }

  if (direction === "next") {
    return entryIds[Math.min(index + 1, entryIds.length - 1)];
  }

  return entryIds[Math.max(index - 1, 0)];
};

export const resolveTimelineStreamSelection = (
  entryIds: readonly string[],
  selectedNoteId: string | undefined,
  localSelectedId: string | undefined,
) => {
  if (selectedNoteId && entryIds.includes(selectedNoteId)) {
    return selectedNoteId;
  }
  if (localSelectedId && entryIds.includes(localSelectedId)) {
    return localSelectedId;
  }
  return undefined;
};
