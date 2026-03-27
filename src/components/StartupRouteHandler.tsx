"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  accountSettingsUpdatedEventName,
  defaultAccountSettings,
  normalizeAccountSettings,
  persistAccountSettingsLocally,
} from "@/lib/account-settings";
import { readStorageValue, writeStorageValue } from "@/lib/local-storage";
import { applyPreferencesToDocument, preferenceStorageKeys, readStoredPreferences } from "@/lib/preferences";

const allowedStartupPaths = new Set(["/wall", "/page", "/decks", "/settings", "/help"]);

export const StartupRouteHandler = () => {
  const pathname = usePathname();
  const router = useRouter();
  const handledHomeRedirectRef = useRef(false);
  const [settingsReady, setSettingsReady] = useState(false);

  useEffect(() => {
    const applyLatest = () => {
      applyPreferencesToDocument(readStoredPreferences());
    };
    const applyLatestOnVisibility = () => {
      if (document.visibilityState === "visible") {
        applyLatest();
      }
    };

    let cancelled = false;
    const bootstrap = async () => {
      applyLatest();
      try {
        const response = await fetch("/api/account/settings", { cache: "no-store" });
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
    if (allowedStartupPaths.has(pathname)) {
      writeStorageValue(preferenceStorageKeys.lastVisitedPath, pathname);
    }
  }, [pathname]);

  useEffect(() => {
    if (!settingsReady || pathname !== "/" || handledHomeRedirectRef.current) {
      return;
    }
    handledHomeRedirectRef.current = true;

    const preferences = readStoredPreferences();
    const lastVisitedPath = readStorageValue(preferenceStorageKeys.lastVisitedPath, []);
    if (
      preferences.startupBehavior === "continue_last" &&
      lastVisitedPath &&
      allowedStartupPaths.has(lastVisitedPath)
    ) {
      router.replace(lastVisitedPath);
      return;
    }
    if (preferences.startupBehavior === "default_page") {
      router.replace(preferences.startupDefaultPage);
    }
  }, [pathname, router, settingsReady]);

  return null;
};

