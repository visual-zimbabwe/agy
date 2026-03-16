"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { ControlTooltip } from "@/components/wall/WallControls";
import { Panel } from "@/components/ui/Panel";

type SyncStatusProps = {
  hasCloudWall: boolean;
  isSyncing: boolean;
  localSaveState: "idle" | "saving" | "error";
  hasPendingSync: boolean;
  lastSyncedAt: number | null;
  syncError: string | null;
  onSyncNow: () => void;
};

type SyncPillState = {
  label: "Saving..." | "Synced" | "Offline" | "Error";
  description: string;
  dotClass: string;
  pillClass: string;
};

const subscribeToOnlineStatus = (callback: () => void) => {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
};

const getOnlineSnapshot = () => navigator.onLine;
const getServerOnlineSnapshot = () => true;

export const SyncStatus = ({
  hasCloudWall,
  isSyncing,
  localSaveState,
  hasPendingSync,
  lastSyncedAt,
  syncError,
  onSyncNow,
}: SyncStatusProps) => {
  const [open, setOpen] = useState(false);
  const isOnline = useSyncExternalStore(subscribeToOnlineStatus, getOnlineSnapshot, getServerOnlineSnapshot);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

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

  const state = useMemo<SyncPillState>(() => {
    const isSaving = localSaveState === "saving" || hasPendingSync || isSyncing || (!hasCloudWall && isOnline);

    if (syncError || localSaveState === "error") {
      return {
        label: "Error",
        description: syncError ?? "A save or sync request failed.",
        dotClass: "bg-[var(--color-danger)]",
        pillClass: "border-[color:rgb(220_38_38_/_0.24)] bg-[color:rgb(254_242_242_/_0.92)] text-[var(--color-danger-strong)]",
      };
    }

    if (!isOnline) {
      return {
        label: "Offline",
        description: hasPendingSync ? "Changes are saved locally and waiting to sync." : "Cloud sync pauses until your connection returns.",
        dotClass: "bg-[color:rgb(148_163_184_/_0.95)]",
        pillClass: "border-[color:rgb(148_163_184_/_0.26)] bg-[color:rgb(248_250_252_/_0.92)] text-[var(--color-text-muted)]",
      };
    }

    if (isSaving) {
      return {
        label: "Saving...",
        description: hasPendingSync || isSyncing ? "Local changes are queued and cloud sync is in progress." : "Recent edits are being written locally.",
        dotClass: "bg-[var(--color-accent-strong)]",
        pillClass: "border-[color:rgb(2_132_199_/_0.24)] bg-[color:rgb(240_249_255_/_0.96)] text-[var(--color-accent-strong)]",
      };
    }

    return {
      label: "Synced",
      description: lastSyncedAt ? "All recent changes are saved locally and synced." : "Your wall is ready and in sync.",
      dotClass: "bg-[color:rgb(22_163_74_/_0.92)]",
      pillClass: "border-[color:rgb(22_163_74_/_0.22)] bg-[color:rgb(240_253_244_/_0.94)] text-[color:rgb(21_128_61_/_1)]",
    };
  }, [hasCloudWall, hasPendingSync, isOnline, isSyncing, lastSyncedAt, localSaveState, syncError]);

  const formattedTime = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : null;
  const tooltipLabel = formattedTime ? `${state.label} • Last sync ${formattedTime}` : state.label;
  const localStatus =
    localSaveState === "saving" ? "Writing changes" : localSaveState === "error" ? "Save failed" : "Saved locally";
  const cloudStatus = !isOnline
    ? "Paused offline"
    : syncError
      ? "Sync failed"
      : isSyncing || hasPendingSync || !hasCloudWall
        ? "Syncing"
        : "Up to date";

  return (
    <div className="relative">
      <ControlTooltip label={tooltipLabel} side="bottom">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          aria-expanded={open}
          aria-haspopup="dialog"
          title={tooltipLabel}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium shadow-[var(--shadow-sm)] backdrop-blur-[var(--blur-panel)] transition-colors ${state.pillClass}`}
        >
          <span className={`h-2 w-2 rounded-full ${state.dotClass}`} aria-hidden="true" />
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
          <div className="space-y-3 text-xs text-[var(--color-text)]">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Save status</p>
              <p className="text-sm font-semibold text-[var(--color-text)]">{state.label}</p>
              <p className="text-[11px] leading-5 text-[var(--color-text-muted)]">{state.description}</p>
            </div>
            <div className="grid gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--color-text-muted)]">Local save</span>
                <span>{localStatus}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--color-text-muted)]">Cloud sync</span>
                <span>{cloudStatus}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--color-text-muted)]">Last sync</span>
                <span>{formattedTime ? formattedTime : "Not yet"}</span>
              </div>
            </div>
            {syncError && (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-2.5 py-2 text-[11px] text-[var(--color-danger-strong)]">
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
              {isSyncing ? "Saving..." : "Sync now"}
            </button>
          </div>
        </Panel>
      )}
    </div>
  );
};
