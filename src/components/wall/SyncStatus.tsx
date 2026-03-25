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
  cloudColor: string;
  cloudBg: string;
  cloudRing: string;
  icon: "check" | "sync" | "offline" | "error";
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

const CloudShape = ({ color }: { color: string }) => (
  <path
    d="M7.25 18.25H16.25C18.8734 18.25 21 16.1234 21 13.5C21 11.0408 19.1296 9.01847 16.7339 8.77804C16.1251 6.45548 14.0165 4.75 11.5 4.75C8.50743 4.75 6.06367 7.15908 5.99986 10.1364C4.24268 10.6809 3 12.3186 3 14.25C3 16.6292 4.87077 18.25 7.25 18.25Z"
    fill={color}
  />
);

const CloudIcon = ({ kind, color }: { kind: SyncPillState["icon"]; color: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={kind === "sync" ? "animate-spin" : undefined}>
    <CloudShape color={color} />
    {kind === "check" ? (
      <path d="M9.2 12.4L11.2 14.4L14.8 10.8" stroke="#fffaf5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    ) : null}
    {kind === "sync" ? (
      <>
        <path d="M9.1 10.1A3.7 3.7 0 0 1 15 9.4" stroke="#fffaf5" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14.9 9.4H16.1V8.2" stroke="#fffaf5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14.9 13.9A3.7 3.7 0 0 1 9 14.6" stroke="#fffaf5" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9.1 14.6H7.9V15.8" stroke="#fffaf5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ) : null}
    {kind === "offline" ? (
      <>
        <path d="M8.4 11.3C9.1 10.2 10.4 9.5 11.9 9.5C13.3 9.5 14.6 10.1 15.4 11.1" stroke="#fffaf5" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 15.8L16 8.2" stroke="#fffaf5" strokeWidth="1.7" strokeLinecap="round" />
      </>
    ) : null}
    {kind === "error" ? (
      <>
        <path d="M12 9V12.8" stroke="#fffaf5" strokeWidth="1.9" strokeLinecap="round" />
        <circle cx="12" cy="15.7" r="1" fill="#fffaf5" />
      </>
    ) : null}
  </svg>
);

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
        cloudColor: "#b74b2d",
        cloudBg: "rgba(183,75,45,0.12)",
        cloudRing: "rgba(183,75,45,0.18)",
        icon: "error",
      };
    }

    if (!isOnline) {
      return {
        label: "Offline",
        description: hasPendingSync ? "Changes are saved locally and waiting to sync." : "Cloud sync pauses until your connection returns.",
        cloudColor: "#8d8277",
        cloudBg: "rgba(141,130,119,0.12)",
        cloudRing: "rgba(141,130,119,0.18)",
        icon: "offline",
      };
    }

    if (isSaving) {
      return {
        label: "Saving...",
        description: hasPendingSync || isSyncing ? "Local changes are queued and cloud sync is in progress." : "Recent edits are being written locally.",
        cloudColor: "#a33818",
        cloudBg: "rgba(163,56,24,0.12)",
        cloudRing: "rgba(163,56,24,0.18)",
        icon: "sync",
      };
    }

    return {
      label: "Synced",
      description: lastSyncedAt ? "All recent changes are saved locally and synced." : "Your wall is ready and in sync.",
      cloudColor: "#a33818",
      cloudBg: "rgba(163,56,24,0.12)",
      cloudRing: "rgba(163,56,24,0.18)",
      icon: "check",
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
          className="inline-flex h-12 w-12 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a33818]/30"
          style={{ backgroundColor: state.cloudBg, boxShadow: `inset 0 0 0 1px ${state.cloudRing}` }}
        >
          <CloudIcon kind={state.icon} color={state.cloudColor} />
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
