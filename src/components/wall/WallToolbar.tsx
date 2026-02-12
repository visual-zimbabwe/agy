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
  return (
    <>
      <div className={`${toolbarSurface} flex flex-wrap items-center gap-1`}>
        {!presentationMode && (
          <>
            {!publishedReadOnly && layoutPrefs.showToolsPanel && (
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
            {layoutPrefs.showDetailsPanel && (
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
        <ControlTooltip label="Open command palette" shortcut="Ctrl/Cmd + K" side="right">
          <button type="button" onClick={onOpenCommandPalette} className={toolbarBtn} title="Open command palette (Ctrl/Cmd + K)">
            <Icon name="search" />
            <span>Command</span>
          </button>
        </ControlTooltip>
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
        <ControlTooltip label="Open keyboard shortcuts" shortcut="?" side="top">
          <button type="button" onClick={onOpenShortcuts} className={toolbarBtn} title="Open keyboard shortcuts (?)">
            <Icon name="shortcuts" />
            <span>Shortcuts</span>
          </button>
        </ControlTooltip>
      </div>

      {!presentationMode && layoutMenuOpen && (
        <div className={`${toolbarSurface} flex flex-wrap items-center gap-3`}>
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
