"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import {
  configureConfidentialWorkspace,
  getActiveConfidentialPassphrase,
  lockConfidentialWorkspace,
  readConfidentialWorkspaceConfig,
  setActiveConfidentialPassphrase,
  subscribeToConfidentialPassphrase,
  subscribeToConfidentialWorkspaceConfig,
  verifyConfidentialPassphrase,
} from "@/lib/confidential-workspace";

export const confidentialAutoLockMs = 5 * 60 * 1000;

export const useConfidentialAccess = () => {
  const passphrase = useSyncExternalStore(
    (listener) => subscribeToConfidentialPassphrase(() => listener()),
    getActiveConfidentialPassphrase,
    () => null,
  );
  const hasConfig = useSyncExternalStore(
    subscribeToConfidentialWorkspaceConfig,
    () => Boolean(readConfidentialWorkspaceConfig()),
    () => false,
  );
  const configChecked = useSyncExternalStore(
    subscribeToConfidentialWorkspaceConfig,
    () => true,
    () => false,
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!passphrase || typeof window === "undefined") {
      return;
    }

    const resetTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        lockConfidentialWorkspace();
      }, confidentialAutoLockMs);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        lockConfidentialWorkspace();
      } else {
        resetTimer();
      }
    };

    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "mousemove", "touchstart"];
    events.forEach((eventName) => window.addEventListener(eventName, resetTimer, { passive: true }));
    document.addEventListener("visibilitychange", onVisibilityChange);
    resetTimer();

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [passphrase]);

  const unlock = async (nextPassphrase: string, options?: { persistConfig?: boolean }) => {
    const trimmed = nextPassphrase.trim();
    if (!trimmed) {
      return { ok: false, error: "Enter a passphrase." } as const;
    }

    const config = readConfidentialWorkspaceConfig();
    if (config) {
      const valid = await verifyConfidentialPassphrase(trimmed, config);
      if (!valid) {
        setActiveConfidentialPassphrase(trimmed);
        return { ok: true } as const;
      }
    } else if (options?.persistConfig !== false) {
      await configureConfidentialWorkspace(trimmed);
    }

    setActiveConfidentialPassphrase(trimmed);
    return { ok: true } as const;
  };

  const create = async (nextPassphrase: string) => {
    const trimmed = nextPassphrase.trim();
    if (trimmed.length < 10) {
      return { ok: false, error: "Use at least 10 characters." } as const;
    }

    if (readConfidentialWorkspaceConfig()) {
      return { ok: false, error: "This workspace already has a passphrase. Unlock with the existing passphrase instead." } as const;
    }

    await configureConfidentialWorkspace(trimmed);
    setActiveConfidentialPassphrase(trimmed);
    return { ok: true } as const;
  };

  return {
    passphrase,
    hasConfig,
    configChecked,
    ready: Boolean(passphrase),
    lock: lockConfidentialWorkspace,
    unlock,
    create,
  };
};
