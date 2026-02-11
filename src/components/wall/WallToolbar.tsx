"use client";

import { ControlTooltip, Icon } from "@/components/wall/WallControls";
import {
  toolbarBtn,
  toolbarBtnAccent,
  toolbarBtnActive,
  toolbarHistoryPill,
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
  canUndo: boolean;
  canRedo: boolean;
  historyUndoDepth: number;
  historyRedoDepth: number;
  timelineMode: boolean;
  showHeatmap: boolean;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  onToggleLayoutMenu: () => void;
  onOpenSearch: () => void;
  onToggleQuickCapture: () => void;
  onOpenExport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onTogglePresentationMode: () => void;
  onResetView: () => void;
  onToggleTimelineMode: () => void;
  onToggleHeatmap: () => void;
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
  canUndo,
  canRedo,
  historyUndoDepth,
  historyRedoDepth,
  timelineMode,
  showHeatmap,
  onToggleLeftPanel,
  onToggleRightPanel,
  onToggleLayoutMenu,
  onOpenSearch,
  onToggleQuickCapture,
  onOpenExport,
  onUndo,
  onRedo,
  onTogglePresentationMode,
  onResetView,
  onToggleTimelineMode,
  onToggleHeatmap,
  onOpenShortcuts,
  onSetLayoutPreference,
}: WallToolbarProps) => {
  return (
    <>
      <div className={`${toolbarSurface} flex flex-wrap items-center gap-1`}>
        {!presentationMode && (
          <>
            {!publishedReadOnly && layoutPrefs.showToolsPanel && (
              <ControlTooltip label={leftPanelOpen ? "Hide tools panel" : "Show tools panel"}>
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
              <ControlTooltip label={rightPanelOpen ? "Hide details panel" : "Show details panel"}>
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
            <ControlTooltip label="Customize layout visibility">
              <button
                type="button"
                onClick={onToggleLayoutMenu}
                className={layoutMenuOpen ? toolbarBtnActive : toolbarBtn}
                title="Customize layout visibility"
              >
                <Icon name="layout" />
                <span>Layout</span>
              </button>
            </ControlTooltip>
          </>
        )}
        <ControlTooltip label="Open search palette" shortcut="Ctrl/Cmd+K">
          <button type="button" onClick={onOpenSearch} className={toolbarBtn} title="Open search palette (Ctrl/Cmd+K)">
            <Icon name="search" />
            <span>Search</span>
          </button>
        </ControlTooltip>
        <ControlTooltip label="Toggle quick capture" shortcut="Q or Ctrl/Cmd+J">
          <button
            type="button"
            onClick={onToggleQuickCapture}
            disabled={isTimeLocked}
            className={quickCaptureOpen ? toolbarBtnActive : toolbarBtn}
            title="Toggle quick capture (Q or Ctrl/Cmd+J)"
          >
            <Icon name="capture" />
            <span>Capture</span>
          </button>
        </ControlTooltip>
        <ControlTooltip label="Export wall content">
          <button type="button" onClick={onOpenExport} className={toolbarBtn} title="Export wall content">
            <Icon name="export" />
            <span>Export</span>
          </button>
        </ControlTooltip>
        <ControlTooltip label="Undo last action" shortcut="Ctrl/Cmd+Z">
          <button type="button" onClick={onUndo} disabled={!canUndo || isTimeLocked} className={toolbarBtn} title="Undo (Ctrl/Cmd+Z)">
            <Icon name="undo" />
            <span>Undo</span>
          </button>
        </ControlTooltip>
        <ControlTooltip label="Redo last action" shortcut="Ctrl/Cmd+Shift+Z">
          <button type="button" onClick={onRedo} disabled={!canRedo || isTimeLocked} className={toolbarBtn} title="Redo (Ctrl/Cmd+Shift+Z)">
            <Icon name="redo" />
            <span>Redo</span>
          </button>
        </ControlTooltip>
        <div className={toolbarHistoryPill} title="Undo / Redo history depth">
          H {historyUndoDepth}/{historyRedoDepth}
        </div>
        <ControlTooltip label="Toggle presentation mode" shortcut="P">
          <button
            type="button"
            onClick={onTogglePresentationMode}
            className={presentationMode ? toolbarBtnAccent : toolbarBtn}
            title="Toggle presentation mode (P)"
          >
            <Icon name="present" />
            <span>Present</span>
          </button>
        </ControlTooltip>
        <ControlTooltip label="Reset camera to fit content">
          <button type="button" onClick={onResetView} className={toolbarBtn} title="Reset camera to fit content">
            <Icon name="reset" />
            <span>Reset</span>
          </button>
        </ControlTooltip>
        <ControlTooltip label="Toggle timeline mode" shortcut="T">
          <button
            type="button"
            onClick={onToggleTimelineMode}
            className={timelineMode ? toolbarBtnActive : toolbarBtn}
            title="Toggle timeline mode (T)"
          >
            <Icon name="timeline" />
            <span>Timeline</span>
          </button>
        </ControlTooltip>
        <ControlTooltip label="Toggle recency heatmap" shortcut="H">
          <button
            type="button"
            onClick={onToggleHeatmap}
            className={showHeatmap ? toolbarBtnActive : toolbarBtn}
            title="Toggle heatmap (H)"
          >
            <Icon name="heatmap" />
            <span>Heatmap</span>
          </button>
        </ControlTooltip>
        <ControlTooltip label="Open keyboard shortcuts" shortcut="?">
          <button type="button" onClick={onOpenShortcuts} className={toolbarBtn} title="Open keyboard shortcuts (?)">
            <Icon name="shortcuts" />
            <span>Keys</span>
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
