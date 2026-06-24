"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  accountSettingsUpdatedEventName,
  defaultAccountSettings,
  normalizeAccountSettings,
  persistAccountSettingsLocally,
} from "@/lib/account-settings";
import { applyPreferencesToDocument, persistLastVisitedPath, readLastVisitedPath, readStoredPreferences } from "@/lib/preferences";
import { runRemovedWorkspacesMigration } from "@/lib/migrate-removed-workspaces";
import { getSupabaseBrowserSessionSafely } from "@/lib/supabase/browser-auth";

export const StartupRouteHandler = () => {
  const pathname = usePathname();
  const router = useRouter();
  const handledHomeRedirectRef = useRef(false);
  const [settingsReady, setSettingsReady] = useState(false);

  useEffect(() => {
    const applyLatest = () => {
      applyPreferencesToDocument();
    };
    const applyLatestOnVisibility = () => {
      if (document.visibilityState === "visible") {
        applyLatest();
      }
    };

    let cancelled = false;
    const bootstrap = async () => {
      applyLatest();
      readLastVisitedPath();
      void runRemovedWorkspacesMigration();

      const { session } = await getSupabaseBrowserSessionSafely();
      if (cancelled) {
        return;
      }
      if (!session) {
        setSettingsReady(true);
        return;
      }

      try {
        const response = await fetch("/api/account/settings", { cache: "no-store" });
        if (response.status === 401) {
          return;
        }
        if (response.ok) {
          const payload = (await response.json()) as { settings?: unknown | null };
          if (!cancelled && payload.settings) {
            persistAccountSettingsLocally(normalizeAccountSettings(payload.settings));
          } else if (!cancelled && payload.settings === null) {
            const localSettings = normalizeAccountSettings(defaultAccountSettings());
            await fetch("/api/account/settings", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(localSettings),
            });
          }
        }
      } catch {
        // Keep local preferences when account settings are unavailable.
      } finally {
        if (!cancelled) {
          setSettingsReady(true);
        }
      }
    };

    void bootstrap();

    window.addEventListener("storage", applyLatest);
    window.addEventListener(accountSettingsUpdatedEventName, applyLatest);
    window.addEventListener("focus", applyLatest);
    window.addEventListener("pageshow", applyLatest);
    document.addEventListener("visibilitychange", applyLatestOnVisibility);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", applyLatest);
      window.removeEventListener(accountSettingsUpdatedEventName, applyLatest);
      window.removeEventListener("focus", applyLatest);
      window.removeEventListener("pageshow", applyLatest);
      document.removeEventListener("visibilitychange", applyLatestOnVisibility);
    };
  }, []);

  useEffect(() => {
    if (!pathname) {
      return;
    }
    persistLastVisitedPath(pathname);
  }, [pathname]);

  useEffect(() => {
    if (!settingsReady || pathname !== "/" || handledHomeRedirectRef.current) {
      return;
    }
    handledHomeRedirectRef.current = true;

    const preferences = readStoredPreferences();
    const lastVisitedPath = readLastVisitedPath();
    if (preferences.startupBehavior === "continue_last" && lastVisitedPath) {
      router.replace(lastVisitedPath);
      return;
    }
    if (preferences.startupBehavior === "default_page") {
      router.replace(preferences.startupDefaultPage);
    }
  }, [pathname, router, settingsReady]);

  return null;
};

