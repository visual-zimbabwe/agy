import Dexie, { type Table } from "dexie";

import type { PageBlock, PersistedPageState } from "@/features/page/types";
import { appSlug, legacyAppSlug } from "@/lib/brand";

type PageDocRecord = {
  id: string;
  snapshot: PersistedPageState;
  updatedAt: number;
};

const pageDatabaseName = `${appSlug}-page-db`;
const legacyPageDatabaseName = `${legacyAppSlug}-page-db`;

class PageDatabase extends Dexie {
  pageDocs!: Table<PageDocRecord, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      pageDocs: "id, updatedAt",
    });
  }
}

export const defaultPageDocId = "default";
const db = new PageDatabase(pageDatabaseName);
const legacyDb = new PageDatabase(legacyPageDatabaseName);
const defaultCamera = { x: 0, y: 0, zoom: 1 } as const;
let migrationPromise: Promise<void> | null = null;

const migrateLegacyPageDatabaseIfNeeded = async () => {
  if (!migrationPromise) {
    migrationPromise = (async () => {
      const legacyExists = await Dexie.exists(legacyPageDatabaseName);
      if (!legacyExists) {
        return;
      }

      await Promise.all([db.open(), legacyDb.open()]);
      const [nextCount, legacyCount] = await Promise.all([db.pageDocs.count(), legacyDb.pageDocs.count()]);
      if (nextCount > 0 || legacyCount === 0) {
        return;
      }

      const docs = await legacyDb.pageDocs.toArray();
      if (docs.length > 0) {
        await db.pageDocs.bulkPut(docs);
      }
    })();
  }

  await migrationPromise;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const validBlockTypes = new Set<PageBlock["type"]>([
  "text",
  "h1",
  "h2",
  "h3",
  "todo",
  "bulleted",
  "numbered",
  "toggle",
  "table",
  "code",
  "quote",
  "callout",
  "image",
  "video",
  "audio",
  "bookmark",
  "embed",
  "divider",
  "google_doc",
  "pdf",
  "database",
  "markdown",
  "page",
  "file",
]);

const normalizeBlock = (value: unknown, index: number): PageBlock | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = typeof value.id === "string" && value.id.length > 0 ? value.id : `blk_${Math.random().toString(36).slice(2, 10)}`;
  const rawType = typeof value.type === "string" ? value.type : "text";
  const type = validBlockTypes.has(rawType as PageBlock["type"]) ? (rawType as PageBlock["type"]) : "text";
  const content = typeof value.content === "string" ? value.content : "";
  const x = typeof value.x === "number" && Number.isFinite(value.x) ? value.x : 80;
  const y = typeof value.y === "number" && Number.isFinite(value.y) ? value.y : 80 + index * 86;
  const w = typeof value.w === "number" && Number.isFinite(value.w) ? value.w : 360;
  const h = typeof value.h === "number" && Number.isFinite(value.h) ? value.h : 88;
  const pageId = typeof value.pageId === "string" ? value.pageId : undefined;
  const parentId = typeof value.parentId === "string" && value.parentId.length > 0 ? value.parentId : undefined;
  const indent = typeof value.indent === "number" && Number.isFinite(value.indent) ? Math.max(0, Math.floor(value.indent)) : undefined;
  const numberedFormat = value.numberedFormat === "letters" || value.numberedFormat === "roman" || value.numberedFormat === "numbers" ? value.numberedFormat : undefined;
  const numberedStart =
    typeof value.numberedStart === "number" && Number.isFinite(value.numberedStart) ? Math.max(1, Math.floor(value.numberedStart)) : undefined;
  const textColor = typeof value.textColor === "string" ? value.textColor : undefined;
  const backgroundColor = typeof value.backgroundColor === "string" ? value.backgroundColor : undefined;
  const checked = typeof value.checked === "boolean" ? value.checked : undefined;
  const expanded = typeof value.expanded === "boolean" ? value.expanded : undefined;
  const tableValue = value.table;
  const table =
    isRecord(tableValue) &&
    typeof tableValue.rows === "number" &&
    Number.isFinite(tableValue.rows) &&
    typeof tableValue.columns === "number" &&
    Number.isFinite(tableValue.columns)
      ? (() => {
          const rows = Math.max(1, Math.min(50, Math.floor(tableValue.rows)));
          const columns = Math.max(1, Math.min(20, Math.floor(tableValue.columns)));
          const rawCells = Array.isArray(tableValue.cells) ? tableValue.cells : [];
          const cells = Array.from({ length: rows }, (_, rowIndex) =>
            Array.from({ length: columns }, (_, columnIndex) => {
              const rawRow = Array.isArray(rawCells[rowIndex]) ? rawCells[rowIndex] : [];
              const rawCell = rawRow[columnIndex];
              return typeof rawCell === "string" ? rawCell : "";
            }),
          );
          return {
            rows,
            columns,
            cells,
            headerRow: typeof tableValue.headerRow === "boolean" ? tableValue.headerRow : undefined,
            headerColumn: typeof tableValue.headerColumn === "boolean" ? tableValue.headerColumn : undefined,
          };
        })()
      : undefined;
  const codeValue = value.code;
  const code =
    isRecord(codeValue)
      ? {
          language: typeof codeValue.language === "string" && codeValue.language.trim().length > 0 ? codeValue.language.trim() : undefined,
          wrap: typeof codeValue.wrap === "boolean" ? codeValue.wrap : undefined,
          caption: typeof codeValue.caption === "string" ? codeValue.caption : undefined,
        }
      : undefined;
  const bookmarkValue = value.bookmark;
  const bookmark =
    isRecord(bookmarkValue) && typeof bookmarkValue.url === "string" && bookmarkValue.url.trim().length > 0
      ? {
          url: bookmarkValue.url.trim(),
          title: typeof bookmarkValue.title === "string" ? bookmarkValue.title : undefined,
          hostname: typeof bookmarkValue.hostname === "string" ? bookmarkValue.hostname : undefined,
          description: typeof bookmarkValue.description === "string" ? bookmarkValue.description : undefined,
          imageUrl: typeof bookmarkValue.imageUrl === "string" ? bookmarkValue.imageUrl : undefined,
        }
      : undefined;
  const embedValue = value.embed;
  const embed =
    isRecord(embedValue)
      ? {
          url: typeof embedValue.url === "string" ? embedValue.url : undefined,
          embedUrl: typeof embedValue.embedUrl === "string" ? embedValue.embedUrl : undefined,
          provider: typeof embedValue.provider === "string" ? embedValue.provider : undefined,
          title: typeof embedValue.title === "string" ? embedValue.title : undefined,
        }
      : undefined;
  const richText = Array.isArray(value.richText)
    ? value.richText
        .filter((entry): entry is { text: string; marks?: string[]; href?: string; mention?: string } => isRecord(entry) && typeof entry.text === "string")
        .map((entry) => ({
          text: entry.text,
          marks: Array.isArray(entry.marks) ? entry.marks.filter((mark): mark is "bold" | "italic" | "code" | "link" | "mention" => ["bold", "italic", "code", "link", "mention"].includes(mark)) : undefined,
          href: typeof entry.href === "string" ? entry.href : undefined,
          mention: typeof entry.mention === "string" ? entry.mention : undefined,
        }))
        .filter((entry) => entry.text.length > 0)
    : undefined;
  const comments = Array.isArray(value.comments)
    ? value.comments
        .filter(
          (comment): comment is { id: string; text: string; createdAt: number; authorName?: string; attachments?: string[]; mentions?: string[] } =>
            isRecord(comment) && typeof comment.id === "string" && typeof comment.text === "string" && typeof comment.createdAt === "number",
        )
        .map((comment) => ({
          id: comment.id,
          authorName: typeof comment.authorName === "string" && comment.authorName.trim().length > 0 ? comment.authorName : "Bisvo",
          text: comment.text,
          createdAt: comment.createdAt,
          attachments: Array.isArray(comment.attachments) ? comment.attachments.filter((item) => typeof item === "string") : undefined,
          mentions: Array.isArray(comment.mentions) ? comment.mentions.filter((item) => typeof item === "string") : undefined,
        }))
    : undefined;

  const fileValue = value.file;
  const file = isRecord(fileValue) &&
    typeof fileValue.name === "string" &&
    typeof fileValue.size === "number" &&
    typeof fileValue.mimeType === "string"
      ? {
          path: typeof fileValue.path === "string" ? fileValue.path : undefined,
          name: fileValue.name,
          size: fileValue.size,
          mimeType: fileValue.mimeType,
          displayName: typeof fileValue.displayName === "string" && fileValue.displayName.trim().length > 0 ? fileValue.displayName : fileValue.name,
          source: fileValue.source === "embed" ? ("embed" as const) : ("upload" as const),
          externalUrl: typeof fileValue.externalUrl === "string" ? fileValue.externalUrl : undefined,
        }
      : undefined;

  return {
    id,
    type: type as PageBlock["type"],
    content,
    x,
    y,
    w,
    h,
    pageId,
    parentId,
    richText,
    indent,
    numberedFormat,
    numberedStart,
    textColor,
    backgroundColor,
    checked,
    expanded,
    table,
    code,
    bookmark,
    embed,
    comments,
    file,
  };
};

const normalizeSnapshot = (value: unknown): PersistedPageState | null => {
  if (!isRecord(value)) {
    return null;
  }

  const blocksRaw = Array.isArray(value.blocks) ? value.blocks : [];
  const blocks = blocksRaw.map((entry, index) => normalizeBlock(entry, index)).filter((entry): entry is PageBlock => Boolean(entry));

  const cameraValue = value.camera;
  const camera =
    isRecord(cameraValue) &&
    typeof cameraValue.x === "number" &&
    typeof cameraValue.y === "number" &&
    typeof cameraValue.zoom === "number"
      ? { x: cameraValue.x, y: cameraValue.y, zoom: cameraValue.zoom }
      : defaultCamera;

  const updatedAt = typeof value.updatedAt === "number" ? value.updatedAt : Date.now();

  return {
    blocks,
    camera,
    updatedAt,
  };
};

export const loadPageSnapshot = async (docId = defaultPageDocId): Promise<PersistedPageState | null> => {
  await migrateLegacyPageDatabaseIfNeeded();
  const row = await db.pageDocs.get(docId);
  if (!row?.snapshot) {
    return null;
  }
  return normalizeSnapshot(row.snapshot);
};

export const savePageSnapshot = async (snapshot: PersistedPageState, docId = defaultPageDocId): Promise<void> => {
  await migrateLegacyPageDatabaseIfNeeded();
  await db.pageDocs.put({
    id: docId,
    snapshot,
    updatedAt: Date.now(),
  });
};

export const listPageDocIds = async (): Promise<string[]> => {
  await migrateLegacyPageDatabaseIfNeeded();
  const rows = await db.pageDocs.orderBy("updatedAt").reverse().toArray();
  return rows.map((row) => row.id);
};

export const createPageSnapshotSaver = (
  delayMs = 300,
  docId = defaultPageDocId,
  persist: (snapshot: PersistedPageState, docId: string) => Promise<void> = savePageSnapshot,
) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let latest: PersistedPageState | undefined;

  const flush = async () => {
    if (!latest) {
      return;
    }
    const snapshot = latest;
    latest = undefined;
    await persist(snapshot, docId);
  };

  const schedule = (snapshot: PersistedPageState) => {
    latest = snapshot;
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      void flush();
    }, delayMs);
  };

  return { schedule, flush };
};
