import { resolveWallPreviewDimensions, isBareAttachmentNote } from "@/components/wall/wallNotePreviewSizing";
import { getAudioNoteTitle } from "@/features/wall/audio-notes";
import { bookmarkDomainLabel } from "@/features/wall/bookmarks";
import { getFileNoteMeta, getFileNoteTitle } from "@/features/wall/file-notes";
import { getImageNoteTitle, isImageNote } from "@/features/wall/image-notes";
import { isPrivateNote, privateNoteTitle } from "@/features/wall/private-notes";
import { getVideoNoteTitle } from "@/features/wall/video-notes";
import { getNoteWikiTitle, isUntitledWikiTitle } from "@/features/wall/wiki-links";
import type { Note } from "@/features/wall/types";

const BARE_ATTACHMENT_PATTERN = /([\w-]+\.(pdf|docx?|txt|png|jpe?g|gif|webp|zip|csv|md|xlsx?|pptx?))/i;

const stripWikiLinkMarkup = (text: string) => text.replace(/\[\[([^\]\n]+?)\]\]/g, "$1");

const getNoteTextLines = (note: Pick<Note, "text">) =>
  stripWikiLinkMarkup(note.text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

export { isBareAttachmentNote } from "@/components/wall/wallNotePreviewSizing";

const getStructuredUserTitle = (note: Note) => {
  if (note.canon?.title?.trim()) {
    return note.canon.title.trim();
  }
  if (note.bookmark?.metadata?.title?.trim()) {
    return note.bookmark.metadata.title.trim();
  }
  if (note.noteKind === "audio" && note.audio) {
    return getAudioNoteTitle(note.audio);
  }
  if (note.noteKind === "video" && note.video) {
    return getVideoNoteTitle(note.video);
  }
  if (note.vocabulary?.word?.trim()) {
    return note.vocabulary.word.trim();
  }
  if (isPrivateNote(note)) {
    return privateNoteTitle(note);
  }
  return undefined;
};

const getAttachmentFilename = (note: Note) => {
  if (note.noteKind === "file" || note.file?.name) {
    return getFileNoteTitle(note.file);
  }
  if (isImageNote(note)) {
    return getImageNoteTitle(note.file);
  }
  const match = stripWikiLinkMarkup(note.text).match(BARE_ATTACHMENT_PATTERN);
  return match?.[1];
};

const isFilenameOnlyFirstLine = (note: Note, firstLine: string) => {
  const filename = getAttachmentFilename(note);
  if (!filename) {
    return false;
  }
  return firstLine.toLowerCase() === filename.toLowerCase();
};

export const getTimelineNoteLabel = (note: Note) => {
  const userTitle = getStructuredUserTitle(note);
  if (userTitle) {
    return userTitle;
  }

  const [firstLine] = getNoteTextLines(note);
  if (firstLine && !isFilenameOnlyFirstLine(note, firstLine)) {
    return firstLine;
  }

  const wikiTitle = getNoteWikiTitle(note);
  if (!isUntitledWikiTitle(wikiTitle)) {
    return wikiTitle;
  }

  if (note.noteKind === "file" || note.file?.name) {
    return getFileNoteTitle(note.file);
  }
  if (isImageNote(note)) {
    return getImageNoteTitle(note.file);
  }

  const bareFilename = getAttachmentFilename(note);
  if (bareFilename) {
    return bareFilename;
  }

  return firstLine || wikiTitle || "Untitled note";
};

const truncateTimelineSubtitle = (value: string, maxLength = 96) => {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
};

const formatTimelineTagSummary = (tags: readonly string[]) =>
  tags
    .slice(0, 3)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .join(" ");

export const getTimelineNoteSubtitle = (note: Note) => {
  if (note.noteKind === "file" || (isBareAttachmentNote(note) && !note.noteKind)) {
    const meta = getFileNoteMeta(note.file);
    return meta || undefined;
  }

  if (note.noteKind === "web-bookmark") {
    const metadata = note.bookmark?.metadata;
    const siteName = metadata?.siteName?.trim();
    const domain = bookmarkDomainLabel(metadata?.domain || note.bookmark?.normalizedUrl || note.bookmark?.url);
    const summary = [siteName, domain].filter(Boolean).join(" · ");
    return summary || note.bookmark?.url || undefined;
  }

  const lines = getNoteTextLines(note);
  const label = getTimelineNoteLabel(note);
  const secondaryLine = lines.find((line) => line !== label);
  if (secondaryLine) {
    return truncateTimelineSubtitle(secondaryLine);
  }

  if (note.tags.length > 0) {
    return formatTimelineTagSummary(note.tags);
  }

  return undefined;
};

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

export type TimelineStreamVirtualItem =
  | { type: "group-header"; dayKey: string; label: string }
  | { type: "entry"; entry: TimelineStreamEntry; dayKey: string };

export const TIMELINE_STREAM_ROW_METRICS = {
  groupHeader: { mobile: 110, desktop: 150 },
  entrySpacing: { mobile: 48, desktop: 64 },
  timeLabel: 28,
  revealButton: 36,
  centerPadding: 16,
} as const;

export const flattenTimelineStreamGroups = (groups: readonly TimelineStreamGroup[]): TimelineStreamVirtualItem[] => {
  const items: TimelineStreamVirtualItem[] = [];

  for (const group of groups) {
    items.push({ type: "group-header", dayKey: group.key, label: group.label });
    for (const entry of group.entries) {
      items.push({ type: "entry", entry, dayKey: group.key });
    }
  }

  return items;
};

export const getTimelineStreamVirtualEntryIndex = (items: readonly TimelineStreamVirtualItem[], noteId: string) =>
  items.findIndex((item) => item.type === "entry" && item.entry.id === noteId);

export const getTimelineStreamVirtualDayIndex = (items: readonly TimelineStreamVirtualItem[], dayKey: string) =>
  items.findIndex((item) => item.type === "group-header" && item.dayKey === dayKey);

export const getTimelineStreamEntryPreviewDimensions = (
  entry: TimelineStreamEntry,
  isDesktop: boolean,
): ReturnType<typeof resolveWallPreviewDimensions> =>
  isDesktop && entry.side !== "center" ? entry.desktop : entry.mobile;

export const estimateTimelineStreamRowHeight = (
  item: TimelineStreamVirtualItem,
  options?: { isDesktop?: boolean; isSelected?: boolean },
): number => {
  const isDesktop = options?.isDesktop ?? false;

  if (item.type === "group-header") {
    return isDesktop
      ? TIMELINE_STREAM_ROW_METRICS.groupHeader.desktop
      : TIMELINE_STREAM_ROW_METRICS.groupHeader.mobile;
  }

  const dims = getTimelineStreamEntryPreviewDimensions(item.entry, isDesktop);
  const spacing = isDesktop
    ? TIMELINE_STREAM_ROW_METRICS.entrySpacing.desktop
    : TIMELINE_STREAM_ROW_METRICS.entrySpacing.mobile;
  const revealExtra =
    options?.isSelected && !isDesktop ? TIMELINE_STREAM_ROW_METRICS.revealButton : 0;
  const centerExtra =
    item.entry.side === "center" ? TIMELINE_STREAM_ROW_METRICS.centerPadding : 0;

  return dims.height + TIMELINE_STREAM_ROW_METRICS.timeLabel + spacing + revealExtra + centerExtra;
};
