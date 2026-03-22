"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import { hasAnyLocalSecurePageSnapshot, verifyAnyLocalPageSnapshotPassphrase } from "@/features/page/storage";
import { hasLocalSecureWallSnapshot, verifyLocalWallSnapshotPassphrase } from "@/features/wall/storage";
import {
  clearConfidentialRecoveryMessage,
  configureConfidentialWorkspace,
  getActiveConfidentialPassphrase,
  getConfidentialRecoveryMessage,
  lockConfidentialWorkspace,
  readConfidentialWorkspaceConfig,
  setActiveConfidentialPassphrase,
  subscribeToConfidentialPassphrase,
  subscribeToConfidentialRecoveryMessage,
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
  const recoveryMessage = useSyncExternalStore(
    subscribeToConfidentialRecoveryMessage,
    getConfidentialRecoveryMessage,
    () => null,
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

    clearConfidentialRecoveryMessage();

    const [hasLocalWallSnapshot, hasLocalPageSnapshot, matchesLocalWallSnapshot, matchesLocalPageSnapshot] = await Promise.all([
      hasLocalSecureWallSnapshot(),
      hasAnyLocalSecurePageSnapshot(),
      verifyLocalWallSnapshotPassphrase(trimmed),
      verifyAnyLocalPageSnapshotPassphrase(trimmed),
    ]);
    const hasLocalSecureCiphertext = hasLocalWallSnapshot || hasLocalPageSnapshot;
    const matchesLocalSecureCiphertext = matchesLocalWallSnapshot || matchesLocalPageSnapshot;

    if (hasLocalSecureCiphertext) {
      if (!matchesLocalSecureCiphertext) {
        return { ok: false, error: "This passphrase does not match the encrypted workspace data on this device." } as const;
      }

      await configureConfidentialWorkspace(trimmed);
      setActiveConfidentialPassphrase(trimmed);
      return { ok: true } as const;
    }

    const config = readConfidentialWorkspaceConfig();
    if (config) {
      const valid = await verifyConfidentialPassphrase(trimmed, config);
      if (!valid) {
        return { ok: false, error: "This passphrase does not match the encrypted workspace data on this device." } as const;
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

    clearConfidentialRecoveryMessage();
    await configureConfidentialWorkspace(trimmed);
    setActiveConfidentialPassphrase(trimmed);
    return { ok: true } as const;
  };

  return {
    passphrase,
    hasConfig,
    configChecked,
    recoveryMessage,
    clearRecoveryMessage: clearConfidentialRecoveryMessage,
    ready: Boolean(passphrase),
    lock: lockConfidentialWorkspace,
    unlock,
    create,
  };
};
