import { decryptConfidentialPayload, encryptConfidentialPayload, isConfidentialEnvelope } from "@/lib/confidential-workspace";
import type { PersistedPageState } from "@/features/page/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const getAuthedUserId = async (): Promise<string | null> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return data.user.id;
};

export const loadCloudPageSnapshot = async (docId: string, passphrase?: string): Promise<PersistedPageState | null> => {
  const ownerId = await getAuthedUserId();
  if (!ownerId) {
    return null;
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("page_docs")
    .select("snapshot,secure_snapshot")
    .eq("owner_id", ownerId)
    .eq("doc_id", docId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message || "Failed to load cloud page document.");
  }

  const row = data as { snapshot?: PersistedPageState | null; secure_snapshot?: unknown } | null;

  if (passphrase && row?.secure_snapshot && isConfidentialEnvelope(row.secure_snapshot)) {
    return await decryptConfidentialPayload<PersistedPageState>(passphrase, row.secure_snapshot);
  }

  return row?.snapshot ?? null;
};

export const saveCloudPageSnapshot = async (docId: string, snapshot: PersistedPageState, passphrase?: string): Promise<void> => {
  const ownerId = await getAuthedUserId();
  if (!ownerId) {
    return;
  }

  const supabase = createSupabaseBrowserClient();
  const payload = passphrase
    ? ({
        owner_id: ownerId,
        doc_id: docId,
        secure_snapshot: await encryptConfidentialPayload(passphrase, snapshot),
        snapshot: null,
      } as Record<string, unknown>)
    : ({
        owner_id: ownerId,
        doc_id: docId,
        snapshot,
      } as Record<string, unknown>);

  const pageDocsTable = supabase.from("page_docs") as unknown as {
    upsert: (
      values: Record<string, unknown>,
      options: { onConflict: string },
    ) => Promise<{ error: { message?: string } | null }>;
  };
  const { error } = await pageDocsTable.upsert(payload, { onConflict: "owner_id,doc_id" });
  if (error) {
    throw new Error(error.message || "Failed to save cloud page document.");
  }
};

export const listCloudPageDocIds = async (): Promise<string[]> => {
  const ownerId = await getAuthedUserId();
  if (!ownerId) {
    return [];
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("page_docs")
    .select("doc_id")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });
  if (error) {
    throw new Error(error.message || "Failed to list cloud page documents.");
  }
  return (data ?? []).map((doc) => doc.doc_id);
};

