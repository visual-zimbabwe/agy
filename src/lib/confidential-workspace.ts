import { appSlug, legacyAppSlug } from "@/lib/brand";
import { readStorageValue, removeStorageKeys, writeStorageValue } from "@/lib/local-storage";

export type ConfidentialEnvelope = {
  version: 1;
  algorithm: "aes-256-gcm";
  kdf: "pbkdf2-sha256";
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
  updatedAt: number;
};

export type ConfidentialBinaryPayload = {
  kind: "file";
  name: string;
  mimeType: string;
  bytesBase64: string;
};

export type ConfidentialWorkspaceConfig = {
  version: 1;
  verification: ConfidentialEnvelope;
  enabledAt: number;
};

const iterationCount = 250_000;
const verificationPayload = { scope: "agy-confidential-workspace", version: 1 } as const;
const workspaceConfigKey = `${appSlug}-confidential-workspace-v1`;
const legacyWorkspaceConfigKey = `${legacyAppSlug}-confidential-workspace-v1`;

export const confidentialDecryptErrorMessage = "Unable to decrypt confidential workspace data. Use the passphrase that originally encrypted this workspace.";

let activePassphrase: string | null = null;
const listeners = new Set<(passphrase: string | null) => void>();

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

const deriveKey = async (passphrase: string, salt: Uint8Array, iterations = iterationCount) => {
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toBufferSource(salt),
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
};

export const encryptConfidentialPayload = async <T>(passphrase: string, payload: T): Promise<ConfidentialEnvelope> => {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: toBufferSource(iv) }, key, encoder.encode(JSON.stringify(payload)));

  return {
    version: 1,
    algorithm: "aes-256-gcm",
    kdf: "pbkdf2-sha256",
    iterations: iterationCount,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    updatedAt: Date.now(),
  };
};

export const decryptConfidentialPayload = async <T>(passphrase: string, envelope: ConfidentialEnvelope): Promise<T> => {
  const key = await deriveKey(passphrase, base64ToBytes(envelope.salt), envelope.iterations);

  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: toBufferSource(base64ToBytes(envelope.iv)) },
      key,
      toBufferSource(base64ToBytes(envelope.ciphertext)),
    );
    return JSON.parse(decoder.decode(plaintext)) as T;
  } catch (error) {
    throw new Error(confidentialDecryptErrorMessage, { cause: error });
  }
};

export const encryptConfidentialFile = async (passphrase: string, file: File) => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const payload: ConfidentialBinaryPayload = {
    kind: "file",
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    bytesBase64: bytesToBase64(bytes),
  };
  const envelope = await encryptConfidentialPayload(passphrase, payload);
  return new File([JSON.stringify(envelope)], `${file.name}.agyc`, { type: "application/json" });
};

export const decryptConfidentialFile = async (passphrase: string, bytes: Uint8Array) => {
  const text = decoder.decode(bytes);
  const parsed = JSON.parse(text) as unknown;
  if (!isConfidentialEnvelope(parsed)) {
    throw new Error("Invalid encrypted file payload.");
  }
  const payload = await decryptConfidentialPayload<ConfidentialBinaryPayload>(passphrase, parsed);
  return new Blob([base64ToBytes(payload.bytesBase64)], { type: payload.mimeType || "application/octet-stream" });
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isConfidentialEnvelope = (value: unknown): value is ConfidentialEnvelope =>
  isRecord(value) &&
  value.version === 1 &&
  value.algorithm === "aes-256-gcm" &&
  value.kdf === "pbkdf2-sha256" &&
  typeof value.iterations === "number" &&
  typeof value.salt === "string" &&
  typeof value.iv === "string" &&
  typeof value.ciphertext === "string" &&
  typeof value.updatedAt === "number";

export const readConfidentialWorkspaceConfig = (): ConfidentialWorkspaceConfig | null => {
  const raw = readStorageValue(workspaceConfigKey, [legacyWorkspaceConfigKey]);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || parsed.version !== 1 || typeof parsed.enabledAt !== "number" || !isConfidentialEnvelope(parsed.verification)) {
      return null;
    }
    return {
      version: 1,
      enabledAt: parsed.enabledAt,
      verification: parsed.verification,
    };
  } catch {
    return null;
  }
};

export const isConfidentialWorkspaceEnabled = () => Boolean(readConfidentialWorkspaceConfig());

export const configureConfidentialWorkspace = async (passphrase: string) => {
  const verification = await encryptConfidentialPayload(passphrase, verificationPayload);
  const next: ConfidentialWorkspaceConfig = {
    version: 1,
    verification,
    enabledAt: Date.now(),
  };
  writeStorageValue(workspaceConfigKey, JSON.stringify(next));
  return next;
};

export const isConfidentialDecryptError = (error: unknown) => error instanceof Error && error.message === confidentialDecryptErrorMessage;

export const verifyConfidentialPassphrase = async (passphrase: string, config = readConfidentialWorkspaceConfig()) => {
  if (!config) {
    return true;
  }

  try {
    const payload = await decryptConfidentialPayload<typeof verificationPayload>(passphrase, config.verification);
    return payload.scope === verificationPayload.scope && payload.version === verificationPayload.version;
  } catch {
    return false;
  }
};

export const ensureConfidentialWorkspaceConfigMatchesPassphrase = async (passphrase: string) => {
  const config = readConfidentialWorkspaceConfig();
  const matches = await verifyConfidentialPassphrase(passphrase, config);
  if (!matches) {
    await configureConfidentialWorkspace(passphrase);
  }
};

export const setActiveConfidentialPassphrase = (passphrase: string | null) => {
  activePassphrase = passphrase;
  listeners.forEach((listener) => listener(passphrase));
};

export const getActiveConfidentialPassphrase = () => activePassphrase;

export const subscribeToConfidentialPassphrase = (listener: (passphrase: string | null) => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const lockConfidentialWorkspace = () => {
  setActiveConfidentialPassphrase(null);
};

export const resetConfidentialWorkspace = () => {
  removeStorageKeys([workspaceConfigKey, legacyWorkspaceConfigKey]);
  lockConfidentialWorkspace();
};

