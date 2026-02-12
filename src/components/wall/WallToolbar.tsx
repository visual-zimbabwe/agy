"use client";

import { useEffect, useRef, useState } from "react";

import { ControlTooltip, Icon } from "@/components/wall/WallControls";
import {
  toolbarBtn,
  toolbarBtnActive,
  toolbarLabel,
  toolbarSurface,
} from "@/components/wall/wallChromeClasses";

type LayoutPreferenceKey = "showToolsPanel" | "showDetailsPanel" | "showContextBar" | "showNoteTags";
type LayoutPreferences = Record<LayoutPreferenceKey, boolean>;

type WallToolbarProps = {
  presentationMode: boolean;
  publishedReadOnly: boolean;
  layoutPrefs: LayoutPreferences;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  layoutMenuOpen: boolean;
  quickCaptureOpen: boolean;
  isTimeLocked: boolean;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  onOpenCommandPalette: () => void;
  onToggleQuickCapture: () => void;
  onTogglePresentationMode: () => void;
  onOpenShortcuts: () => void;
  onSetLayoutPreference: (key: LayoutPreferenceKey, value: boolean) => void;
};

export const WallToolbar = ({
  presentationMode,
  publishedReadOnly,
  layoutPrefs,
  leftPanelOpen,
  rightPanelOpen,
  layoutMenuOpen,
  quickCaptureOpen,
  isTimeLocked,
  onToggleLeftPanel,
  onToggleRightPanel,
  onOpenCommandPalette,
  onToggleQuickCapture,
  onTogglePresentationMode,
  onOpenShortcuts,
  onSetLayoutPreference,
}: WallToolbarProps) => {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!moreMenuOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && moreMenuRef.current?.contains(target)) {
        return;
      }
      setMoreMenuOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMoreMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [moreMenuOpen]);

  const closeMoreMenu = () => setMoreMenuOpen(false);

  const detailsAction = !presentationMode && layoutPrefs.showDetailsPanel;

  return (
    <>
      <div className={`${toolbarSurface} flex items-center gap-1.5`}>
        <ControlTooltip label="Toggle quick capture" shortcut="Q or Ctrl/Cmd + J" side="top">
          <button
            type="button"
            onClick={onToggleQuickCapture}
            disabled={isTimeLocked}
            className={quickCaptureOpen ? toolbarBtnActive : toolbarBtn}
            title="Toggle quick capture (Q or Ctrl/Cmd + J)"
          >
            <Icon name="capture" />
            <span>Capture</span>
          </button>
        </ControlTooltip>
        <ControlTooltip label="Toggle presentation mode" shortcut="P" side="top">
          <button
            type="button"
            onClick={onTogglePresentationMode}
            className={presentationMode ? toolbarBtnActive : toolbarBtn}
            title="Toggle presentation mode (P)"
          >
            <Icon name="present" />
            <span>Present</span>
          </button>
        </ControlTooltip>
        {detailsAction && (
          <ControlTooltip label={rightPanelOpen ? "Hide details panel" : "Show details panel"} side="top">
            <button
              type="button"
              onClick={onToggleRightPanel}
              className={rightPanelOpen ? toolbarBtnActive : toolbarBtn}
              title={rightPanelOpen ? "Hide details panel" : "Show details panel"}
            >
              <Icon name="panel-right" />
              <span>Details</span>
            </button>
          </ControlTooltip>
        )}
        <div className="relative" ref={moreMenuRef}>
          <ControlTooltip label="More actions" side="bottom">
            <button
              type="button"
              onClick={() => setMoreMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={moreMenuOpen}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-muted)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1"
              title="More actions"
            >
              <span aria-hidden>⋯</span>
              <span className="sr-only">More actions</span>
            </button>
          </ControlTooltip>
          {moreMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+0.45rem)] z-50 min-w-48 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1.5 shadow-[var(--shadow-md)] backdrop-blur-[var(--blur-panel)]"
            >
              {!publishedReadOnly && layoutPrefs.showToolsPanel && !presentationMode && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onToggleLeftPanel();
                    closeMoreMenu();
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-xs text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)]"
                >
                  <span>{leftPanelOpen ? "Hide tools panel" : "Show tools panel"}</span>
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onOpenCommandPalette();
                  closeMoreMenu();
                }}
                className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-xs text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)]"
              >
                <span>Open command palette</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">Ctrl/Cmd + K</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onOpenShortcuts();
                  closeMoreMenu();
                }}
                className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-xs text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)]"
              >
                <span>Open keyboard shortcuts</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">?</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {!presentationMode && layoutMenuOpen && (
        <div className={`${toolbarSurface} flex flex-wrap items-center gap-4`}>
          <span className={toolbarLabel}>Customize Layout</span>
          <label className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text)]">
            <input
              type="checkbox"
              checked={layoutPrefs.showToolsPanel}
              onChange={(event) => onSetLayoutPreference("showToolsPanel", event.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--color-accent-strong)]"
            />
            <span>Tools Panel</span>
          </label>
          <label className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text)]">
            <input
              type="checkbox"
              checked={layoutPrefs.showDetailsPanel}
              onChange={(event) => onSetLayoutPreference("showDetailsPanel", event.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--color-accent-strong)]"
            />
            <span>Details Panel</span>
          </label>
          <label className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text)]">
            <input
              type="checkbox"
              checked={layoutPrefs.showContextBar}
              onChange={(event) => onSetLayoutPreference("showContextBar", event.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--color-accent-strong)]"
            />
            <span>Context Bar</span>
          </label>
          <label className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text)]">
            <input
              type="checkbox"
              checked={layoutPrefs.showNoteTags}
              onChange={(event) => onSetLayoutPreference("showNoteTags", event.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--color-accent-strong)]"
            />
            <span>Tags on Notes</span>
          </label>
        </div>
      )}
    </>
  );
};
