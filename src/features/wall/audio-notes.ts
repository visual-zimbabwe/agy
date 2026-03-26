import { type AudioNote, type Note } from "@/features/wall/types";
import {
  createFileNoteState,
  deriveFileNameFromUrl,
  formatFileSize,
  getFileKindLabel,
  inferMimeTypeFromFileName,
  normalizeFileUrl,
  readFileExtension,
} from "@/features/wall/file-notes";

export const AUDIO_NOTE_DEFAULTS = {
  color: "#FFFFFF",
  width: 428,
  height: 248,
  textColor: "#1C1C19",
  textFont: "newsreader" as const,
  textSizePx: 16,
};

export const AUDIO_WAVEFORM_BARS = [0.2, 0.42, 0.84, 1, 0.56, 0.9, 0.78, 0.32, 0.46, 0.26, 0.78, 0.52, 0.24] as const;

const asNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const trimAudioTitle = (name?: string) => {
  const trimmed = name?.trim() ?? "";
  if (!trimmed) {
    return "Ambient Texture";
  }
  const extension = readFileExtension(trimmed);
  if (!extension) {
    return trimmed;
  }
  return trimmed.slice(0, -(extension.length + 1)) || trimmed;
};

export const formatAudioDuration = (seconds?: number) => {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) {
    return "--:--";
  }
  const totalSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

export const createAudioNoteState = (partial?: Partial<AudioNote>): AudioNote => {
  const base = createFileNoteState({
    ...partial,
    mimeType: partial?.mimeType?.trim() || inferMimeTypeFromFileName(partial?.name) || partial?.mimeType,
  });

  return {
    ...base,
    name: partial?.name?.trim() || deriveFileNameFromUrl(base.url) || "Ambient Texture.mp3",
    durationSeconds: partial?.durationSeconds,
  };
};

export const normalizeAudioNote = (value: unknown): AudioNote | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const raw = value as Record<string, unknown>;
  const candidate = createAudioNoteState({
    source: raw.source === "link" ? "link" : "upload",
    name: typeof raw.name === "string" ? raw.name : "",
    url: typeof raw.url === "string" ? raw.url : "",
    mimeType: typeof raw.mimeType === "string" ? raw.mimeType : undefined,
    extension: typeof raw.extension === "string" ? raw.extension : undefined,
    sizeBytes: asNumber(raw.sizeBytes),
    uploadedAt: asNumber(raw.uploadedAt),
    durationSeconds: asNumber(raw.durationSeconds),
  });

  return candidate.url || candidate.name ? candidate : undefined;
};

export const getAudioNoteTitle = (audio?: Partial<AudioNote> | null) =>
  trimAudioTitle(audio?.name);

export const getAudioNoteMeta = (audio?: Partial<AudioNote> | null) => {
  const kind = getFileKindLabel(audio);
  const size = formatFileSize(audio?.sizeBytes);
  const source = audio?.source === "link" && !size ? "Link" : "";
  return [kind, size || source].filter(Boolean).join(" | ");
};

export const buildAudioNoteSearchText = (audio?: Partial<AudioNote> | null) => {
  const title = getAudioNoteTitle(audio);
  const meta = getAudioNoteMeta(audio);
  return meta ? `${title}\n${meta}` : title;
};

export const isAudioUrl = (value: string) => {
  const normalized = normalizeFileUrl(value);
  if (!normalized) {
    return false;
  }

  const lower = normalized.toLowerCase();
  return [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".oga", ".flac", ".webm"].some((extension) =>
    lower.includes(extension),
  );
};

export const isAudioNote = (
  note?: Pick<Note, "noteKind" | "audio"> | null,
): note is Pick<Note, "noteKind" | "audio"> & { noteKind: "audio"; audio: AudioNote } =>
  Boolean(note && note.noteKind === "audio" && note.audio?.url);

export const toAudioNotePatch = (audio: AudioNote): Partial<Note> => ({
  noteKind: "audio",
  text: buildAudioNoteSearchText(audio),
  quoteAuthor: undefined,
  quoteSource: undefined,
  canon: undefined,
  eisenhower: undefined,
  currency: undefined,
  bookmark: undefined,
  apod: undefined,
  poetry: undefined,
  economist: undefined,
  file: undefined,
  audio,
  imageUrl: undefined,
  vocabulary: undefined,
  color: AUDIO_NOTE_DEFAULTS.color,
  textFont: AUDIO_NOTE_DEFAULTS.textFont,
  textColor: AUDIO_NOTE_DEFAULTS.textColor,
  textSizePx: AUDIO_NOTE_DEFAULTS.textSizePx,
  textAlign: "left",
  textVAlign: "top",
  w: AUDIO_NOTE_DEFAULTS.width,
  h: AUDIO_NOTE_DEFAULTS.height,
  tags: ["audio"],
});
