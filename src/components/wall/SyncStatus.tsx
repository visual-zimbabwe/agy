"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ControlTooltip } from "@/components/wall/WallControls";
import { Panel } from "@/components/ui/Panel";

type SyncStatusProps = {
  hasCloudWall: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  syncError: string | null;
  onSyncNow: () => void;
};

type SyncState = {
  label: "✅ Synced" | "Syncing…" | "⚠️ Offline" | "❌ Error";
  toneClass: string;
};

export const SyncStatus = ({ hasCloudWall, isSyncing, lastSyncedAt, syncError, onSyncNow }: SyncStatusProps) => {
  const [open, setOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && !panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const state: SyncState = useMemo(() => {
    if (syncError) {
      return {
        label: "❌ Error",
        toneClass: "text-[var(--color-danger-strong)] border-[var(--color-danger)] bg-[var(--color-danger-soft)]",
      };
    }
    if (isSyncing) {
      return {
        label: "Syncing…",
        toneClass: "text-[var(--color-text)] border-[var(--color-border)] bg-[var(--color-surface-glass)]",
      };
    }
    if (!isOnline || !hasCloudWall) {
      return {
        label: "⚠️ Offline",
        toneClass: "text-[var(--color-text-muted)] border-[var(--color-border)] bg-[var(--color-surface)]",
      };
    }
    return {
      label: "✅ Synced",
      toneClass: "text-[var(--color-text)] border-[var(--color-border)] bg-[var(--color-surface-glass)]",
    };
  }, [hasCloudWall, isOnline, isSyncing, syncError]);

  const formattedTime = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : null;
  const tooltipLabel = formattedTime ? `Last synced ${formattedTime}` : "No completed sync yet";
  const connectionStatus = isOnline ? (hasCloudWall ? "Connected" : "No cloud wall linked") : "Offline";

  return (
    <div className="pointer-events-auto fixed right-3 top-[3.35rem] z-[94] sm:right-4 sm:top-[3.85rem]">
      <div className="relative">
        <ControlTooltip label={tooltipLabel} side="bottom">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen((previous) => !previous)}
            aria-expanded={open}
            aria-haspopup="dialog"
            title={tooltipLabel}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] shadow-[var(--shadow-sm)] backdrop-blur-[var(--blur-panel)] ${state.toneClass}`}
          >
            <span>{state.label}</span>
          </button>
        </ControlTooltip>

        {open && (
          <Panel
            ref={panelRef}
            role="dialog"
            aria-label="Sync status"
            className="absolute right-0 mt-2 w-[min(22rem,90vw)] p-3 motion-modal-enter"
          >
            <div className="space-y-2.5 text-xs text-[var(--color-text)]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--color-text-muted)]">Connection</span>
                <span>{connectionStatus}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--color-text-muted)]">Last sync</span>
                <span>{formattedTime ? formattedTime : "Not yet"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--color-text-muted)]">Status</span>
                <span>{state.label}</span>
              </div>
              {syncError && (
                <div className="rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-2.5 py-2 text-[11px] text-[var(--color-danger-strong)]">
                  <p className="font-semibold">Error details</p>
                  <p className="mt-0.5 whitespace-pre-wrap break-words">{syncError}</p>
                </div>
              )}
              <button
                type="button"
                onClick={onSyncNow}
                disabled={!hasCloudWall || !isOnline || isSyncing}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-xs font-medium text-[var(--color-text)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSyncing ? "Syncing..." : "Sync now"}
              </button>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
};
