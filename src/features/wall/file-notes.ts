import type { FileNote, Note } from "@/features/wall/types";

export const FILE_NOTE_DEFAULTS = {
  color: "#FFFFFF",
  width: 320,
  height: 112,
  textColor: "#1C1C19",
  textFont: "manrope" as const,
  textSizePx: 14,
};

const FILE_KIND_LABELS: Array<{ match: (mimeType: string, extension: string) => boolean; label: string }> = [
  { match: (mimeType, extension) => mimeType === "application/pdf" || extension === "pdf", label: "PDF Document" },
  {
    match: (mimeType, extension) =>
      mimeType.includes("wordprocessingml") || mimeType === "application/msword" || extension === "doc" || extension === "docx",
    label: "Word Document",
  },
  {
    match: (mimeType, extension) =>
      mimeType.includes("spreadsheetml") || mimeType.includes("excel") || extension === "xls" || extension === "xlsx" || extension === "csv",
    label: "Spreadsheet",
  },
  {
    match: (mimeType, extension) =>
      mimeType.includes("presentationml") || mimeType.includes("powerpoint") || extension === "ppt" || extension === "pptx",
    label: "Presentation",
  },
  { match: (mimeType) => mimeType.startsWith("image/"), label: "Image" },
  { match: (mimeType) => mimeType.startsWith("video/"), label: "Video" },
  { match: (mimeType) => mimeType.startsWith("audio/"), label: "Audio" },
  { match: (_, extension) => ["zip", "rar", "7z", "tar", "gz"].includes(extension), label: "Archive" },
  { match: (mimeType, extension) => mimeType.includes("markdown") || extension === "md", label: "Markdown" },
  { match: (mimeType, extension) => mimeType.startsWith("text/") || extension === "txt", label: "Text Document" },
];

const asString = (value: unknown) => (typeof value === "string" ? value : "");
const asNumber = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : undefined);

export const readFileExtension = (name?: string) => {
  const trimmed = name?.trim() ?? "";
  const lastDot = trimmed.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === trimmed.length - 1) {
    return "";
  }
  return trimmed.slice(lastDot + 1).toLowerCase();
};

export const inferMimeTypeFromFileName = (name?: string) => {
  const extension = readFileExtension(name);
  if (extension === "pdf") return "application/pdf";
  if (extension === "doc") return "application/msword";
  if (extension === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (extension === "xls") return "application/vnd.ms-excel";
  if (extension === "xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (extension === "csv") return "text/csv";
  if (extension === "ppt") return "application/vnd.ms-powerpoint";
  if (extension === "pptx") return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (extension === "txt") return "text/plain";
  if (extension === "md") return "text/markdown";
  if (extension === "zip") return "application/zip";
  if (extension === "json") return "application/json";
  if (extension === "png") return "image/png";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "gif") return "image/gif";
  if (extension === "webp") return "image/webp";
  if (extension === "mp4") return "video/mp4";
  if (extension === "mp3") return "audio/mpeg";
  return "";
};

export const normalizeFileUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    return "";
  }
  return "";
};

export const deriveFileNameFromUrl = (value: string) => {
  const normalized = normalizeFileUrl(value);
  if (!normalized) {
    return "";
  }
  try {
    const parsed = new URL(normalized);
    const lastSegment = parsed.pathname.split("/").filter(Boolean).pop() ?? "";
    return decodeURIComponent(lastSegment) || "";
  } catch {
    return "";
  }
};

export const formatFileSize = (sizeBytes?: number) => {
  if (typeof sizeBytes !== "number" || !Number.isFinite(sizeBytes) || sizeBytes < 0) {
    return "";
  }
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }
  const units = ["KB", "MB", "GB", "TB"];
  let value = sizeBytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 1 : 2).replace(/\.0$/, "")} ${units[unitIndex]}`;
};

export const getFileKindLabel = (file?: Partial<FileNote> | null) => {
  const mimeType = file?.mimeType?.trim().toLowerCase() ?? "";
  const extension = (file?.extension?.trim().toLowerCase() || readFileExtension(file?.name)) ?? "";
  const matched = FILE_KIND_LABELS.find((candidate) => candidate.match(mimeType, extension));
  if (matched) {
    return matched.label;
  }
  return extension ? `${extension.toUpperCase()} File` : "File";
};

export const getFileNoteTitle = (file?: Partial<FileNote> | null) => file?.name?.trim() || "Untitled file";

export const getFileNoteMeta = (file?: Partial<FileNote> | null) => {
  const kind = getFileKindLabel(file);
  const size = formatFileSize(file?.sizeBytes);
  const sourceLabel = file?.source === "link" && !size ? "Link" : "";
  return [kind, size || sourceLabel].filter(Boolean).join(" • ");
};

export const getFileNoteMetaCaps = (file?: Partial<FileNote> | null) => getFileNoteMeta(file).toUpperCase();

export const buildFileNoteSearchText = (file?: Partial<FileNote> | null) => {
  const title = getFileNoteTitle(file);
  const meta = getFileNoteMeta(file);
  return meta ? `${title}\n${meta}` : title;
};

export const createFileNoteState = (partial?: Partial<FileNote>): FileNote => {
  const source = partial?.source === "link" ? "link" : "upload";
  const normalizedUrl = source === "link" ? normalizeFileUrl(partial?.url ?? "") : partial?.url?.trim() ?? "";
  const derivedName = source === "link" ? deriveFileNameFromUrl(normalizedUrl) : "";
  const name = partial?.name?.trim() || derivedName || "Untitled file";
  const mimeType = partial?.mimeType?.trim() || inferMimeTypeFromFileName(name) || undefined;
  const extension = partial?.extension?.trim() || readFileExtension(name) || undefined;

  return {
    source,
    name,
    url: normalizedUrl,
    mimeType,
    extension,
    sizeBytes: partial?.sizeBytes,
    uploadedAt: partial?.uploadedAt,
  };
};

export const normalizeFileNote = (value: unknown): FileNote | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const raw = value as Record<string, unknown>;
  const candidate = createFileNoteState({
    source: raw.source === "link" ? "link" : "upload",
    name: asString(raw.name),
    url: asString(raw.url),
    mimeType: asString(raw.mimeType) || undefined,
    extension: asString(raw.extension) || undefined,
    sizeBytes: asNumber(raw.sizeBytes),
    uploadedAt: asNumber(raw.uploadedAt),
  });
  return candidate.url || candidate.name ? candidate : undefined;
};

export const isFileNote = (note?: Pick<Note, "noteKind" | "file"> | null): note is Pick<Note, "noteKind" | "file"> & { noteKind: "file"; file: FileNote } =>
  Boolean(note && note.noteKind === "file" && note.file?.url);

export const toFileNotePatch = (file: FileNote): Partial<Note> => ({
  noteKind: "file",
  text: buildFileNoteSearchText(file),
  quoteAuthor: undefined,
  quoteSource: undefined,
  canon: undefined,
  eisenhower: undefined,
  bookmark: undefined,
  apod: undefined,
  poetry: undefined,
  imageUrl: undefined,
  vocabulary: undefined,
  file,
  color: FILE_NOTE_DEFAULTS.color,
  textFont: FILE_NOTE_DEFAULTS.textFont,
  textColor: FILE_NOTE_DEFAULTS.textColor,
  textSizePx: FILE_NOTE_DEFAULTS.textSizePx,
  textAlign: "left",
  textVAlign: "top",
  w: FILE_NOTE_DEFAULTS.width,
  h: FILE_NOTE_DEFAULTS.height,
  tags: ["file"],
});

