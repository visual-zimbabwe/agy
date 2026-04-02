import type { PageBlock, PageBookmarkData, PageFileMeta } from "@/features/page/types";
import type { Note, WebBookmarkMetadata, WebBookmarkNote } from "@/features/wall/types";
import { NOTE_COLORS, NOTE_DEFAULTS } from "@/features/wall/constants";
import { WEB_BOOKMARK_DEFAULTS, buildBookmarkFallbackMetadata, normalizeBookmarkUrl } from "@/features/wall/bookmarks";
import { createFileNoteState } from "@/features/wall/file-notes";
import { createAudioNoteState } from "@/features/wall/audio-notes";
import { createVideoNoteState } from "@/features/wall/video-notes";
import { createImageNoteState } from "@/features/wall/image-notes";

const DOC_WIDTH = 680;
const LINE_HEIGHT = 32;
const DEFAULT_PAGE_X = 72;
const DEFAULT_PAGE_Y = 284;
const DEFAULT_PAGE_GAP = 18;

const makeId = (prefix: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
};

const clampText = (value: string, max = 180) => {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, Math.max(0, max - 1)).trimEnd()}...`;
};

const firstMeaningfulLine = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0) ?? "";

const bookmarkDataFromUrl = (url: string, title: string, description: string): PageBookmarkData => {
  try {
    const parsed = new URL(url);
    return {
      url: parsed.toString(),
      title,
      description,
      hostname: parsed.hostname.replace(/^www\./i, ""),
      imageUrl: undefined,
    };
  } catch {
    return {
      url,
      title,
      description,
      hostname: "",
      imageUrl: undefined,
    };
  }
};

const wallBookmarkStateFromUrl = (url: string, title: string, description: string): WebBookmarkNote => {
  const normalizedUrl = normalizeBookmarkUrl(url);
  const metadata: WebBookmarkMetadata | undefined = normalizedUrl
    ? {
        ...buildBookmarkFallbackMetadata(normalizedUrl),
        title,
        description,
        siteName: "Agy",
        kind: "website",
      }
    : undefined;

  return {
    url,
    normalizedUrl,
    metadata,
    status: "ready",
    fetchedAt: Date.now(),
    lastSuccessAt: Date.now(),
  };
};

const pageTitleForNote = (note: Note) => {
  if (note.noteKind === "web-bookmark") {
    return note.bookmark?.metadata?.title?.trim() || note.bookmark?.url.trim() || "Wall reference";
  }
  if (note.noteKind === "image") {
    return firstMeaningfulLine(note.text) || note.file?.name?.trim() || "Image note";
  }
  if (note.noteKind === "file") {
    return note.file?.name?.trim() || "File note";
  }
  if (note.noteKind === "audio") {
    return note.audio?.name?.trim() || "Audio note";
  }
  if (note.noteKind === "video") {
    return note.video?.name?.trim() || "Video note";
  }
  return firstMeaningfulLine(note.text) || note.quoteAuthor?.trim() || "Wall note";
};

const noteDescriptionForReference = (note: Note) => {
  if (note.noteKind === "web-bookmark") {
    return note.bookmark?.metadata?.description?.trim() || "Reference back to a wall bookmark note.";
  }
  return clampText(note.text || note.quoteSource || note.quoteAuthor || "Reference back to a wall note.", 120);
};

export const pageBlockTitle = (block: PageBlock) => {
  if (block.type === "bookmark") {
    return block.bookmark?.title?.trim() || block.bookmark?.url.trim() || "Bookmark block";
  }
  if (block.type === "page") {
    return block.content.trim() || "Page block";
  }
  if (block.type === "file" || block.type === "image" || block.type === "video" || block.type === "audio") {
    return block.file?.displayName?.trim() || block.file?.name?.trim() || firstMeaningfulLine(block.content) || "Media block";
  }
  return firstMeaningfulLine(block.content) || block.type.replace(/_/g, " ");
};

const pageBlockDescription = (block: PageBlock) => {
  if (block.type === "bookmark") {
    return block.bookmark?.description?.trim() || "Reference back to a page bookmark block.";
  }
  return clampText(block.content || `Reference back to a ${block.type} block in the page editor.`, 120);
};

const noteTextToBlockType = (note: Note): PageBlock["type"] => {
  if (note.noteKind === "quote") {
    return "quote";
  }
  return "text";
};

const fileMetaToPageFile = (file: Note["file"] | Note["audio"] | Note["video"], fallbackUrl?: string): PageFileMeta => {
  const url = file?.url ?? fallbackUrl ?? "";
  return {
    name: file?.name?.trim() || "untitled",
    displayName: file?.name?.trim() || "untitled",
    size: file?.sizeBytes ?? 0,
    mimeType: file?.mimeType?.trim() || "application/octet-stream",
    source: file?.source === "link" ? "embed" : "upload",
    externalUrl: file?.source === "link" ? url : undefined,
    path: file?.source === "upload" ? url : undefined,
  };
};

export const buildPageDocUrl = (origin: string, docId: string, blockId?: string) => {
  const target = new URL("/page", origin);
  if (docId) {
    target.searchParams.set("doc", docId);
  }
  if (blockId) {
    target.hash = blockId;
  }
  return target.toString();
};

export const buildWallNoteUrl = (origin: string, noteId: string) => {
  const target = new URL("/wall", origin);
  target.searchParams.set("note", noteId);
  return target.toString();
};

export const buildPageReferenceBlock = (url: string, title: string, description: string, x: number, y: number): PageBlock => ({
  id: makeId("blk"),
  type: "bookmark",
  content: "",
  bookmark: bookmarkDataFromUrl(url, title, description),
  x,
  y,
  w: DOC_WIDTH,
  h: 122,
});

export const buildWallReferenceNote = (url: string, title: string, description: string, x: number, y: number): Note => {
  const now = Date.now();
  return {
    id: makeId("note"),
    noteKind: "web-bookmark",
    text: description,
    bookmark: wallBookmarkStateFromUrl(url, title, description),
    quoteAuthor: undefined,
    quoteSource: undefined,
    imageUrl: undefined,
    textAlign: "left",
    textVAlign: NOTE_DEFAULTS.textVAlign,
    textFont: WEB_BOOKMARK_DEFAULTS.textFont,
    textColor: WEB_BOOKMARK_DEFAULTS.textColor,
    textSizePx: WEB_BOOKMARK_DEFAULTS.textSizePx,
    tags: ["reference"],
    textSize: NOTE_DEFAULTS.textSize,
    pinned: false,
    highlighted: false,
    x,
    y,
    w: WEB_BOOKMARK_DEFAULTS.width,
    h: WEB_BOOKMARK_DEFAULTS.height,
    color: WEB_BOOKMARK_DEFAULTS.color,
    createdAt: now,
    updatedAt: now,
  };
};

export const createPageReferenceForWallNote = (note: Note, origin: string) =>
  buildPageReferenceBlock(
    buildWallNoteUrl(origin, note.id),
    `Wall: ${pageTitleForNote(note)}`,
    noteDescriptionForReference(note),
    DEFAULT_PAGE_X,
    DEFAULT_PAGE_Y,
  );

export const createWallReferenceForPageBlock = (block: PageBlock, docId: string, origin: string, x: number, y: number) =>
  buildWallReferenceNote(
    buildPageDocUrl(origin, docId, block.id),
    `Page: ${pageBlockTitle(block)}`,
    pageBlockDescription(block),
    x,
    y,
  );

export const estimatePageBlocksHeight = (blocks: PageBlock[]) =>
  blocks.reduce((total, block, index) => total + block.h + (index === blocks.length - 1 ? 0 : DEFAULT_PAGE_GAP), 0);

export const pageBlocksFromWallNote = (note: Note): PageBlock[] => {
  const created: PageBlock[] = [];
  const x = DEFAULT_PAGE_X;
  let y = DEFAULT_PAGE_Y;
  const push = (block: PageBlock) => {
    created.push(block);
    y += block.h + DEFAULT_PAGE_GAP;
  };

  if (note.noteKind === "web-bookmark" && note.bookmark?.url) {
    push({
      id: makeId("blk"),
      type: "bookmark",
      content: "",
      bookmark: bookmarkDataFromUrl(
        note.bookmark.metadata?.finalUrl ?? note.bookmark.normalizedUrl ?? note.bookmark.url,
        note.bookmark.metadata?.title?.trim() || note.bookmark.url.trim() || "Wall bookmark",
        note.bookmark.metadata?.description?.trim() || note.text.trim(),
      ),
      x,
      y,
      w: DOC_WIDTH,
      h: 122,
    });
    return created;
  }

  if (note.noteKind === "image" && (note.file?.url || note.imageUrl)) {
    push({
      id: makeId("blk"),
      type: "image",
      content: note.text,
      file: fileMetaToPageFile(note.file, note.imageUrl),
      x,
      y,
      w: DOC_WIDTH,
      h: Math.max(280, note.h),
    });
    return created;
  }

  if (note.noteKind === "file" && note.file?.url) {
    push({
      id: makeId("blk"),
      type: "file",
      content: note.text,
      file: fileMetaToPageFile(note.file),
      x,
      y,
      w: DOC_WIDTH,
      h: 88,
    });
    return created;
  }

  if (note.noteKind === "audio" && note.audio?.url) {
    push({
      id: makeId("blk"),
      type: "audio",
      content: note.text,
      file: fileMetaToPageFile(note.audio),
      x,
      y,
      w: DOC_WIDTH,
      h: 88,
    });
    return created;
  }

  if (note.noteKind === "video" && note.video?.url) {
    push({
      id: makeId("blk"),
      type: "video",
      content: note.text,
      file: fileMetaToPageFile(note.video),
      x,
      y,
      w: DOC_WIDTH,
      h: Math.max(220, Math.min(360, note.h)),
    });
    return created;
  }

  push({
    id: makeId("blk"),
    type: noteTextToBlockType(note),
    content: note.text,
    x,
    y,
    w: DOC_WIDTH,
    h: Math.max(LINE_HEIGHT + 18, Math.min(220, note.h)),
  });

  const sourceUrl = note.noteKind === "apod"
    ? note.apod?.pageUrl
    : note.noteKind === "economist"
      ? note.quoteAuthor
      : undefined;
  if (sourceUrl) {
    push(buildPageReferenceBlock(sourceUrl, "Source", "Original source linked from the converted wall note.", x, y));
  }

  return created;
};

export const wallNoteFromPageBlock = (block: PageBlock, x: number, y: number): Note => {
  const now = Date.now();
  const title = pageBlockTitle(block);
  const description = pageBlockDescription(block);

  if (block.type === "bookmark" && block.bookmark?.url) {
    return {
      id: makeId("note"),
      noteKind: "web-bookmark",
      text: description,
      bookmark: wallBookmarkStateFromUrl(block.bookmark.url, block.bookmark.title?.trim() || title, block.bookmark.description?.trim() || description),
      quoteAuthor: undefined,
      quoteSource: undefined,
      imageUrl: undefined,
      textAlign: "left",
      textVAlign: NOTE_DEFAULTS.textVAlign,
      textFont: WEB_BOOKMARK_DEFAULTS.textFont,
      textColor: WEB_BOOKMARK_DEFAULTS.textColor,
      textSizePx: WEB_BOOKMARK_DEFAULTS.textSizePx,
      tags: ["page"],
      textSize: NOTE_DEFAULTS.textSize,
      pinned: false,
      highlighted: false,
      x,
      y,
      w: WEB_BOOKMARK_DEFAULTS.width,
      h: WEB_BOOKMARK_DEFAULTS.height,
      color: WEB_BOOKMARK_DEFAULTS.color,
      createdAt: now,
      updatedAt: now,
    };
  }

  if ((block.type === "image" || block.type === "file" || block.type === "audio" || block.type === "video") && block.file) {
    const normalizedUrl = block.file.externalUrl || block.file.path || "";
    if (block.type === "image") {
      return {
        id: makeId("note"),
        noteKind: "image",
        text: block.content,
        file: createImageNoteState({
          source: block.file.externalUrl ? "link" : "upload",
          url: normalizedUrl,
          name: block.file.displayName || block.file.name,
          mimeType: block.file.mimeType,
          sizeBytes: block.file.size,
        }),
        imageUrl: normalizedUrl,
        quoteAuthor: undefined,
        quoteSource: undefined,
        textAlign: "center",
        textVAlign: "bottom",
        textFont: NOTE_DEFAULTS.textFont,
        textColor: NOTE_DEFAULTS.textColor,
        textSizePx: NOTE_DEFAULTS.textSizePx,
        tags: ["page", "image"],
        textSize: NOTE_DEFAULTS.textSize,
        pinned: false,
        highlighted: false,
        x,
        y,
        w: Math.max(NOTE_DEFAULTS.width, 360),
        h: Math.max(NOTE_DEFAULTS.height, 420),
        color: "#FFFFFF",
        createdAt: now,
        updatedAt: now,
      };
    }
    if (block.type === "audio") {
      return {
        id: makeId("note"),
        noteKind: "audio",
        text: block.content,
        audio: createAudioNoteState({
          source: block.file.externalUrl ? "link" : "upload",
          url: normalizedUrl,
          name: block.file.displayName || block.file.name,
          mimeType: block.file.mimeType,
          sizeBytes: block.file.size,
        }),
        quoteAuthor: undefined,
        quoteSource: undefined,
        imageUrl: undefined,
        textAlign: "left",
        textVAlign: "top",
        textFont: NOTE_DEFAULTS.textFont,
        textColor: NOTE_DEFAULTS.textColor,
        textSizePx: NOTE_DEFAULTS.textSizePx,
        tags: ["page", "audio"],
        textSize: NOTE_DEFAULTS.textSize,
        pinned: false,
        highlighted: false,
        x,
        y,
        w: Math.max(NOTE_DEFAULTS.width, 320),
        h: Math.max(NOTE_DEFAULTS.height, 220),
        color: "#FFFFFF",
        createdAt: now,
        updatedAt: now,
      };
    }
    if (block.type === "video") {
      return {
        id: makeId("note"),
        noteKind: "video",
        text: block.content,
        video: createVideoNoteState({
          source: block.file.externalUrl ? "link" : "upload",
          url: normalizedUrl,
          name: block.file.displayName || block.file.name,
          mimeType: block.file.mimeType,
          sizeBytes: block.file.size,
        }),
        quoteAuthor: undefined,
        quoteSource: undefined,
        imageUrl: undefined,
        textAlign: "left",
        textVAlign: "top",
        textFont: NOTE_DEFAULTS.textFont,
        textColor: NOTE_DEFAULTS.textColor,
        textSizePx: NOTE_DEFAULTS.textSizePx,
        tags: ["page", "video"],
        textSize: NOTE_DEFAULTS.textSize,
        pinned: false,
        highlighted: false,
        x,
        y,
        w: Math.max(NOTE_DEFAULTS.width, 360),
        h: Math.max(NOTE_DEFAULTS.height, 260),
        color: "#FFFFFF",
        createdAt: now,
        updatedAt: now,
      };
    }
    return {
      id: makeId("note"),
      noteKind: "file",
      text: block.content,
      file: createFileNoteState({
        source: block.file.externalUrl ? "link" : "upload",
        url: normalizedUrl,
        name: block.file.displayName || block.file.name,
        mimeType: block.file.mimeType,
        sizeBytes: block.file.size,
      }),
      quoteAuthor: undefined,
      quoteSource: undefined,
      imageUrl: undefined,
      textAlign: "left",
      textVAlign: "top",
      textFont: NOTE_DEFAULTS.textFont,
      textColor: NOTE_DEFAULTS.textColor,
      textSizePx: NOTE_DEFAULTS.textSizePx,
      tags: ["page", "file"],
      textSize: NOTE_DEFAULTS.textSize,
      pinned: false,
      highlighted: false,
      x,
      y,
      w: NOTE_DEFAULTS.width,
      h: Math.max(NOTE_DEFAULTS.height, 140),
      color: "#FFFFFF",
      createdAt: now,
      updatedAt: now,
    };
  }

  return {
    id: makeId("note"),
    noteKind: block.type === "quote" ? "quote" : "standard",
    text: block.content,
    quoteAuthor: undefined,
    quoteSource: undefined,
    imageUrl: undefined,
    textAlign: "left",
    textVAlign: NOTE_DEFAULTS.textVAlign,
    textFont: NOTE_DEFAULTS.textFont,
    textColor: NOTE_DEFAULTS.textColor,
    textSizePx: NOTE_DEFAULTS.textSizePx,
    tags: ["page"],
    textSize: NOTE_DEFAULTS.textSize,
    pinned: false,
    highlighted: false,
    x,
    y,
    w: NOTE_DEFAULTS.width,
    h: Math.max(NOTE_DEFAULTS.height, Math.min(280, block.h)),
    color: NOTE_COLORS[0] ?? "#FEEA89",
    createdAt: now,
    updatedAt: now,
  };
};
