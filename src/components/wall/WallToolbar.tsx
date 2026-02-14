"use client";

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
  hasNoteSelection: boolean;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  onOpenCommandPalette: () => void;
  onToggleQuickCapture: () => void;
  onTogglePresentationMode: () => void;
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
  hasNoteSelection,
  onToggleLeftPanel,
  onToggleRightPanel,
  onOpenCommandPalette,
  onToggleQuickCapture,
  onTogglePresentationMode,
  onSetLayoutPreference,
}: WallToolbarProps) => {
  const showSecondaryActions = hasNoteSelection || leftPanelOpen || rightPanelOpen || quickCaptureOpen;
  const toolsAction = !publishedReadOnly && !presentationMode && layoutPrefs.showToolsPanel && (hasNoteSelection || leftPanelOpen);
  const detailsAction = !presentationMode && layoutPrefs.showDetailsPanel && (hasNoteSelection || rightPanelOpen);

  return (
    <>
      <div className="relative flex w-full items-center justify-start">
        <div className="inline-flex items-center gap-1.5">
          <ControlTooltip label="Toggle quick capture" shortcut="Q or Ctrl/Cmd + J" side="bottom">
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
          {showSecondaryActions && (
            <>
            {toolsAction && (
              <ControlTooltip label={leftPanelOpen ? "Hide tools panel" : "Show tools panel"} side="top">
                <button
                  type="button"
                  onClick={onToggleLeftPanel}
                  className={leftPanelOpen ? toolbarBtnActive : toolbarBtn}
                  title={leftPanelOpen ? "Hide tools panel" : "Show tools panel"}
                >
                  <Icon name="panel-left" />
                  <span>Tools</span>
                </button>
              </ControlTooltip>
            )}
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
            </>
          )}
        </div>
        <ControlTooltip label="Command palette (Ctrl+K)" side="bottom">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="fixed left-1/2 top-3 z-[96] -translate-x-1/2 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[11px] text-[var(--color-text-muted)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1 md:top-4"
            title="Command palette (Ctrl+K)"
            aria-label="Open command palette"
          >
            <Icon name="search" className="h-3.5 w-3.5" />
            <span>Search...</span>
            <span className="rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-muted)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-text-muted)]">
              Ctrl K
            </span>
          </button>
        </ControlTooltip>
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
