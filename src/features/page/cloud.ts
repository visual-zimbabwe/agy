import type { CloudPageDocument, PageOperation } from "@/features/page/operations";
import type { PersistedPageState } from "@/features/page/types";

const pageSyncMetaPrefix = "agy-page-sync-meta:";

type StoredPageSyncMeta = {
  revision: number;
  snapshot: PersistedPageState;
};

const getDocUrl = (docId: string) => `/api/page/docs/${encodeURIComponent(docId)}`;

const parseJson = async <T>(response: Response): Promise<T> => {
  return (await response.json().catch(() => ({}))) as T;
};

export const loadCloudPageDocument = async (docId: string): Promise<CloudPageDocument | null> => {
  const response = await fetch(getDocUrl(docId), { cache: "no-store" });
  if (response.status === 401) {
    return null;
  }

  const payload = await parseJson<{ error?: string; doc?: CloudPageDocument | null }>(response);
  if (!response.ok) {
    throw new Error(payload.error ?? "Failed to load cloud page document.");
  }

  return payload.doc ?? null;
};

export const applyCloudPageOperations = async (
  docId: string,
  baseRevision: number,
  operations: PageOperation[],
): Promise<CloudPageDocument> => {
  const response = await fetch(`${getDocUrl(docId)}/ops`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ baseRevision, operations }),
  });

  const payload = await parseJson<{ error?: string; doc?: CloudPageDocument | null }>(response);
  if (!response.ok || !payload.doc) {
    const error = new Error(payload.error ?? "Failed to apply cloud page operations.");
    (error as Error & { status?: number; doc?: CloudPageDocument | null }).status = response.status;
    (error as Error & { status?: number; doc?: CloudPageDocument | null }).doc = payload.doc ?? null;
    throw error;
  }

  return payload.doc;
};

export const loadCloudPageSnapshot = async (docId: string): Promise<PersistedPageState | null> => {
  const doc = await loadCloudPageDocument(docId);
  return doc?.snapshot ?? null;
};

export const saveCloudPageSnapshot = async (docId: string, snapshot: PersistedPageState): Promise<void> => {
  const response = await fetch(getDocUrl(docId), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ snapshot }),
  });

  const payload = await parseJson<{ error?: string }>(response);
  if (response.status === 401) {
    return;
  }
  if (!response.ok) {
    throw new Error(payload.error ?? "Failed to save cloud page document.");
  }
};

export const deleteCloudPageSnapshot = async (docId: string): Promise<void> => {
  const response = await fetch(getDocUrl(docId), { method: "DELETE" });
  if (response.status === 401 || response.status === 404) {
    return;
  }
  if (!response.ok) {
    const payload = await parseJson<{ error?: string }>(response);
    throw new Error(payload.error ?? "Failed to delete cloud page document.");
  }
};

export const listCloudPageDocIds = async (): Promise<string[]> => {
  const response = await fetch("/api/page/docs", { cache: "no-store" });
  if (response.status === 401) {
    return [];
  }

  const payload = await parseJson<{ error?: string; docs?: Array<{ docId: string }> }>(response);
  if (!response.ok) {
    throw new Error(payload.error ?? "Failed to list cloud page documents.");
  }
  return (payload.docs ?? []).map((doc) => doc.docId);
};

const getMetaKey = (docId: string) => `${pageSyncMetaPrefix}${docId}`;

export const readPageSyncMeta = (docId: string): StoredPageSyncMeta | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getMetaKey(docId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredPageSyncMeta;
    if (typeof parsed?.revision !== "number" || !parsed?.snapshot) {
      return null;
    }
    return {
      revision: Math.max(0, Math.trunc(parsed.revision)),
      snapshot: parsed.snapshot,
    };
  } catch {
    return null;
  }
};

export const writePageSyncMeta = (docId: string, meta: StoredPageSyncMeta) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getMetaKey(docId), JSON.stringify(meta));
};

export const clearPageSyncMeta = (docId: string) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getMetaKey(docId));
};
