import type { Note, PrivateNoteData } from "@/features/wall/types";

export type PrivateNoteHiddenFields = {
  noteKind?: Note["noteKind"];
  text: string;
  quoteAuthor?: string;
  quoteSource?: string;
  canon?: Note["canon"];
  eisenhower?: Note["eisenhower"];
  bookmark?: Note["bookmark"];
  apod?: Note["apod"];
  poetry?: Note["poetry"];
  file?: Note["file"];
  audio?: Note["audio"];
  video?: Note["video"];
  imageUrl?: string;
  tags: string[];
  vocabulary?: Note["vocabulary"];
};

export const PRIVATE_NOTE_AUTO_LOCK_MS = 5 * 60 * 1000;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const randomBytes = (length: number) => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
};

const toBufferSource = (bytes: Uint8Array) => new Uint8Array(bytes);

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = "";
  for (const value of bytes) {
    binary += String.fromCharCode(value);
  }
  return btoa(binary);
};

const base64ToBytes = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const deriveKey = async (password: string, salt: Uint8Array) => {
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toBufferSource(salt),
      iterations: 250_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
};

const normalizePrivateNoteHiddenFields = (value: unknown): PrivateNoteHiddenFields => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      text: "",
      tags: [],
    };
  }

  const raw = value as Partial<PrivateNoteHiddenFields> & { text?: unknown; tags?: unknown };
  return {
    noteKind: typeof raw.noteKind === "string" ? (raw.noteKind as Note["noteKind"]) : undefined,
    text: typeof raw.text === "string" ? raw.text : "",
    quoteAuthor: typeof raw.quoteAuthor === "string" ? raw.quoteAuthor : undefined,
    quoteSource: typeof raw.quoteSource === "string" ? raw.quoteSource : undefined,
    canon: raw.canon,
    eisenhower: raw.eisenhower,
    bookmark: raw.bookmark,
    apod: raw.apod,
    poetry: raw.poetry,
    file: raw.file,
    audio: raw.audio,
    video: raw.video,
    imageUrl: typeof raw.imageUrl === "string" ? raw.imageUrl : undefined,
    tags: Array.isArray(raw.tags) ? raw.tags.filter((tag): tag is string => typeof tag === "string") : [],
    vocabulary: raw.vocabulary,
  };
};

export const encryptPrivateNote = async (password: string, payload: PrivateNoteHiddenFields): Promise<PrivateNoteData> => {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveKey(password, salt);
  const now = Date.now();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toBufferSource(iv) },
    key,
    encoder.encode(JSON.stringify(payload)),
  );

  return {
    version: 1,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    protectedAt: now,
    updatedAt: now,
  };
};

export const decryptPrivateNote = async (password: string, privateNote: PrivateNoteData): Promise<PrivateNoteHiddenFields> => {
  const salt = base64ToBytes(privateNote.salt);
  const iv = base64ToBytes(privateNote.iv);
  const key = await deriveKey(password, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toBufferSource(iv) },
    key,
    toBufferSource(base64ToBytes(privateNote.ciphertext)),
  );
  return normalizePrivateNoteHiddenFields(JSON.parse(decoder.decode(decrypted)));
};

export const isPrivateNote = (note?: Pick<Note, "privateNote"> | null): note is Pick<Note, "privateNote"> & { privateNote: PrivateNoteData } =>
  Boolean(note?.privateNote);

export const canProtectNote = (note?: Pick<Note, "id"> | null) => Boolean(note);

export const createPrivateNoteHiddenFields = (
  note: Pick<Note, "noteKind" | "text" | "quoteAuthor" | "quoteSource" | "canon" | "eisenhower" | "bookmark" | "apod" | "poetry" | "file" | "audio" | "video" | "imageUrl" | "tags" | "vocabulary">,
): PrivateNoteHiddenFields => ({
  noteKind: note.noteKind,
  text: note.text,
  quoteAuthor: note.quoteAuthor,
  quoteSource: note.quoteSource,
  canon: note.canon,
  eisenhower: note.eisenhower,
  bookmark: note.bookmark,
  apod: note.apod,
  poetry: note.poetry,
  file: note.file,
  audio: note.audio,
  video: note.video,
  imageUrl: note.imageUrl,
  tags: [...note.tags],
  vocabulary: note.vocabulary,
});

export const createPrivateNoteShellPatch = (
  note: Pick<Note, "noteKind">,
): Pick<Note, "noteKind" | "text" | "quoteAuthor" | "quoteSource" | "canon" | "eisenhower" | "bookmark" | "apod" | "poetry" | "file" | "audio" | "video" | "imageUrl" | "tags" | "vocabulary"> => ({
  noteKind: note.noteKind,
  text: "",
  quoteAuthor: undefined,
  quoteSource: undefined,
  canon: undefined,
  eisenhower: undefined,
  bookmark: undefined,
  apod: undefined,
  poetry: undefined,
  file: undefined,
  audio: undefined,
  video: undefined,
  imageUrl: undefined,
  tags: [],
  vocabulary: undefined,
});

export const canInlineEditPrivateNote = (hidden: PrivateNoteHiddenFields) => {
  return (
    (hidden.noteKind === undefined || hidden.noteKind === "standard" || hidden.noteKind === "journal") &&
    !hidden.imageUrl &&
    !hidden.vocabulary &&
    !hidden.canon &&
    !hidden.eisenhower &&
    !hidden.bookmark &&
    !hidden.apod &&
    !hidden.poetry &&
    !hidden.file &&
    !hidden.audio &&
    !hidden.video
  );
};

export const privateNoteTitle = (note?: Pick<Note, "noteKind"> | null) => {
  if (note?.noteKind === "journal") {
    return "Private journal";
  }
  return "Private note";
};

