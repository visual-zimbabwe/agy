import type { Note, PrivateNoteData } from "@/features/wall/types";

export type PrivateNotePlaintext = {
  text: string;
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

const deriveKey = async (passphrase: string, salt: Uint8Array) => {
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
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

export const encryptPrivateNote = async (passphrase: string, payload: PrivateNotePlaintext): Promise<PrivateNoteData> => {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveKey(passphrase, salt);
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

export const decryptPrivateNote = async (passphrase: string, privateNote: PrivateNoteData): Promise<PrivateNotePlaintext> => {
  const salt = base64ToBytes(privateNote.salt);
  const iv = base64ToBytes(privateNote.iv);
  const key = await deriveKey(passphrase, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toBufferSource(iv) },
    key,
    toBufferSource(base64ToBytes(privateNote.ciphertext)),
  );
  const parsed = JSON.parse(decoder.decode(decrypted)) as Partial<PrivateNotePlaintext>;
  return {
    text: typeof parsed.text === "string" ? parsed.text : "",
  };
};

export const isPrivateNote = (note?: Pick<Note, "privateNote"> | null): note is Pick<Note, "privateNote"> & { privateNote: PrivateNoteData } =>
  Boolean(note?.privateNote);

export const canProtectNote = (note?: Pick<Note, "noteKind" | "imageUrl" | "vocabulary" | "canon" | "eisenhower" | "currency" | "bookmark" | "apod" | "poetry"> | null) => {
  if (!note) {
    return false;
  }
  const eligibleKind = !note.noteKind || note.noteKind === "standard" || note.noteKind === "journal";
  return eligibleKind && !note.imageUrl && !note.vocabulary && !note.canon && !note.eisenhower && !note.currency && !note.bookmark && !note.apod && !note.poetry;
};

export const privateNoteTitle = (note?: Pick<Note, "noteKind"> | null) => {
  if (note?.noteKind === "journal") {
    return "Private journal";
  }
  return "Private note";
};
