import Dexie from "dexie";

import { appSlug, legacyAppSlug } from "@/lib/brand";
import { preferenceStorageKeys, legacyPreferenceStorageKeys } from "@/lib/preferences";
import { removeStorageKeys, readStorageValue, writeStorageValue } from "@/lib/local-storage";
import { getSupabaseBrowserUserSafely } from "@/lib/supabase/browser-auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const removedWorkspacesMigrationKey = `${appSlug}-removed-workspaces-v1`;
const pageDatabaseNames = [`${appSlug}-page-db`, `${legacyAppSlug}-page-db`] as const;
const pageLinksStorageKeys = [`${appSlug}-wall-page-links-v1`, `${legacyAppSlug}-wall-page-links-v1`] as const;
const pageFilesBucket = "page-files";

const removedStartupPaths = new Set(["/page", "/media"]);

const purgePageDexieDatabases = async () => {
  await Promise.all(
    pageDatabaseNames.map(async (name) => {
      try {
        const exists = await Dexie.exists(name);
        if (exists) {
          await Dexie.delete(name);
        }
      } catch {
        // Ignore IndexedDB cleanup failures.
      }
    }),
  );
};

const purgeCloudPageData = async (ownerId: string) => {
  const supabase = createSupabaseBrowserClient();

  try {
    const { error: docsError } = await supabase.from("page_docs").delete().eq("owner_id", ownerId);
    if (docsError) {
      console.warn("[agy] Failed to delete cloud page docs:", docsError.message);
    }
  } catch (error) {
    console.warn("[agy] Cloud page doc cleanup failed:", error);
  }

  try {
    const { data: files, error: listError } = await supabase.storage.from(pageFilesBucket).list(ownerId, {
      limit: 1000,
    });
    if (listError) {
      console.warn("[agy] Failed to list cloud page files:", listError.message);
      return;
    }

    if (!files?.length) {
      return;
    }

    const paths = files.map((file) => `${ownerId}/${file.name}`);
    const { error: removeError } = await supabase.storage.from(pageFilesBucket).remove(paths);
    if (removeError) {
      console.warn("[agy] Failed to delete cloud page files:", removeError.message);
    }
  } catch (error) {
    console.warn("[agy] Cloud page file cleanup failed:", error);
  }
};

const migrateStoredStartupPaths = () => {
  const startupDefaultPage = readStorageValue(preferenceStorageKeys.startupDefaultPage, [
    legacyPreferenceStorageKeys.startupDefaultPage,
  ]);
  if (startupDefaultPage && removedStartupPaths.has(startupDefaultPage)) {
    writeStorageValue(preferenceStorageKeys.startupDefaultPage, "/wall");
  }

  const lastVisitedPath = readStorageValue(preferenceStorageKeys.lastVisitedPath, [legacyPreferenceStorageKeys.lastVisitedPath]);
  if (lastVisitedPath && removedStartupPaths.has(lastVisitedPath)) {
    writeStorageValue(preferenceStorageKeys.lastVisitedPath, "/wall");
  }
};

export const runRemovedWorkspacesMigration = async () => {
  if (typeof window === "undefined") {
    return;
  }

  migrateStoredStartupPaths();
  removeStorageKeys([...pageLinksStorageKeys]);

  if (readStorageValue(removedWorkspacesMigrationKey, []) === "done") {
    return;
  }

  await purgePageDexieDatabases();

  try {
    const { user } = await getSupabaseBrowserUserSafely();
    if (user) {
      await purgeCloudPageData(user.id);
    }
  } catch {
    // Cloud cleanup is best-effort during local migration.
  }

  writeStorageValue(removedWorkspacesMigrationKey, "done");
};
