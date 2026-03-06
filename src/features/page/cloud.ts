import type { PersistedPageState } from "@/features/page/types";

type CloudDocResponse = {
  doc: {
    docId: string;
    snapshot: PersistedPageState;
    updatedAt: string;
    createdAt?: string;
  } | null;
};

type CloudListResponse = {
  docs: Array<{
    docId: string;
    updatedAt: string;
  }>;
};

const docPath = (docId: string) => `/api/page/docs/${encodeURIComponent(docId)}`;

export const loadCloudPageSnapshot = async (docId: string): Promise<PersistedPageState | null> => {
  const response = await fetch(docPath(docId), { method: "GET" });
  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to load cloud page document (${response.status}).`);
  }

  const payload = (await response.json()) as CloudDocResponse;
  return payload.doc?.snapshot ?? null;
};

export const saveCloudPageSnapshot = async (docId: string, snapshot: PersistedPageState): Promise<void> => {
  const response = await fetch(docPath(docId), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ snapshot }),
  });
  if (response.status === 401) {
    return;
  }
  if (!response.ok) {
    throw new Error(`Failed to save cloud page document (${response.status}).`);
  }
};

export const listCloudPageDocIds = async (): Promise<string[]> => {
  const response = await fetch("/api/page/docs", { method: "GET" });
  if (response.status === 401) {
    return [];
  }
  if (!response.ok) {
    throw new Error(`Failed to list cloud page documents (${response.status}).`);
  }

  const payload = (await response.json()) as CloudListResponse;
  return payload.docs.map((doc) => doc.docId);
};
