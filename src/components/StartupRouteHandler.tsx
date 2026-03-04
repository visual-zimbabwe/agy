"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { applyPreferencesToDocument, preferenceStorageKeys, readStoredPreferences } from "@/lib/preferences";

const allowedStartupPaths = new Set(["/wall", "/decks"]);
const preferencesUpdatedEventName = "idea-wall-preferences-updated";

export const StartupRouteHandler = () => {
  const pathname = usePathname();
  const router = useRouter();
  const handledHomeRedirectRef = useRef(false);

  useEffect(() => {
    const applyLatest = () => {
      applyPreferencesToDocument(readStoredPreferences());
    };
    applyLatest();
    window.addEventListener("storage", applyLatest);
    window.addEventListener(preferencesUpdatedEventName, applyLatest);
    return () => {
      window.removeEventListener("storage", applyLatest);
      window.removeEventListener(preferencesUpdatedEventName, applyLatest);
    };
  }, []);

  useEffect(() => {
    if (!pathname) {
      return;
    }
    if (allowedStartupPaths.has(pathname)) {
      window.localStorage.setItem(preferenceStorageKeys.lastVisitedPath, pathname);
    }
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/" || handledHomeRedirectRef.current) {
      return;
    }
    handledHomeRedirectRef.current = true;

    const preferences = readStoredPreferences();
    const lastVisitedPath = window.localStorage.getItem(preferenceStorageKeys.lastVisitedPath);
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
  }, [pathname, router]);

  return null;
};
