import { createFileNoteState, deriveFileNameFromUrl, getFileNoteMeta, getFileNoteTitle, normalizeFileUrl, readFileExtension } from "@/features/wall/file-notes";
import type { FileNote, Note } from "@/features/wall/types";

export const IMAGE_NOTE_DEFAULTS = {
  color: "#FFFFFF",
  width: 360,
  height: 420,
  textColor: "#1C1C19",
  textFont: "manrope" as const,
  textSizePx: 18,
};

export const createImageNoteState = (partial?: Partial<FileNote>): FileNote => {
  const candidate = createFileNoteState({
    ...partial,
    name: partial?.name?.trim() || deriveFileNameFromUrl(partial?.url ?? "") || partial?.name,
  });

  const fallbackName =
    candidate.name.trim() ||
    (() => {
      const extension = readFileExtension(candidate.url) || readFileExtension(partial?.name);
      return extension ? "image." + extension : "untitled-image";
    })();

  return {
    ...candidate,
    name: fallbackName,
  };
};

export const isImageNote = (note?: Pick<Note, "noteKind" | "imageUrl"> | null) =>
  Boolean(note && (note.noteKind === "image" || note.imageUrl?.trim()));

export const getImageNoteTitle = (file?: Partial<FileNote> | null) => getFileNoteTitle(file).replace(/\.[^.]+$/, "") || "Untitled image";

export const getImageNoteFilename = (file?: Partial<FileNote> | null) => file?.name?.trim() || deriveFileNameFromUrl(file?.url ?? "") || "untitled-image";

export const getImageNoteMeta = (file?: Partial<FileNote> | null) => getFileNoteMeta(file);

export const toImageNotePatch = (image: FileNote, options?: { caption?: string; preserveSize?: boolean }) => ({
  noteKind: "image" as const,
  text: options?.caption ?? "",
  quoteAuthor: undefined,
  quoteSource: undefined,
  canon: undefined,
  eisenhower: undefined,
  bookmark: undefined,
  apod: undefined,
  poetry: undefined,
  vocabulary: undefined,
  imageUrl: image.url,
  file: image,
  color: IMAGE_NOTE_DEFAULTS.color,
  textFont: IMAGE_NOTE_DEFAULTS.textFont,
  textColor: IMAGE_NOTE_DEFAULTS.textColor,
  textSizePx: IMAGE_NOTE_DEFAULTS.textSizePx,
  textAlign: "center" as const,
  textVAlign: "top" as const,
  ...(options?.preserveSize
    ? {}
    : {
        w: IMAGE_NOTE_DEFAULTS.width,
        h: IMAGE_NOTE_DEFAULTS.height,
      }),
  tags: ["image"],
});

export const renameImageNoteFile = (note: Note, name: string): Partial<Note> => {
  const normalizedName = name.trim() || getImageNoteFilename(note.file);
  const existing = createImageNoteState({
    ...(note.file ?? createImageNoteState({ source: normalizeFileUrl(note.imageUrl ?? "") ? "link" : "upload", url: note.imageUrl ?? "" })),
    name: normalizedName,
  });

  return {
    file: existing,
    imageUrl: existing.url,
  };
};
