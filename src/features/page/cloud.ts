import type { PersistedPageState } from "@/features/page/types";
import { getSupabaseBrowserUserSafely } from "@/lib/supabase/browser-auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const getAuthedUserId = async (): Promise<string | null> => {
  const { user, error } = await getSupabaseBrowserUserSafely();
  if (error || !user) {
    return null;
  }
  return user.id;
};

export const loadCloudPageSnapshot = async (docId: string): Promise<PersistedPageState | null> => {
  const ownerId = await getAuthedUserId();
  if (!ownerId) {
    return null;
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("page_docs")
    .select("snapshot")
    .eq("owner_id", ownerId)
    .eq("doc_id", docId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message || "Failed to load cloud page document.");
  }
  return (data?.snapshot as PersistedPageState | null) ?? null;
};

export const saveCloudPageSnapshot = async (docId: string, snapshot: PersistedPageState): Promise<void> => {
  const ownerId = await getAuthedUserId();
  if (!ownerId) {
    return;
  }

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("page_docs").upsert(
    {
      owner_id: ownerId,
      doc_id: docId,
      snapshot,
    },
    { onConflict: "owner_id,doc_id" },
  );
  if (error) {
    throw new Error(error.message || "Failed to save cloud page document.");
  }
};

export const deleteCloudPageSnapshot = async (docId: string): Promise<void> => {
  const ownerId = await getAuthedUserId();
  if (!ownerId) {
    return;
  }

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("page_docs").delete().eq("owner_id", ownerId).eq("doc_id", docId);
  if (error) {
    throw new Error(error.message || "Failed to delete cloud page document.");
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
