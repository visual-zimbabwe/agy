"use client";

import { NoteSwatches } from "@/components/NoteCard";
import { WallToolbar } from "@/components/wall/WallToolbar";
import { statusChip } from "@/components/wall/wallChromeClasses";
import { NOTE_DEFAULTS, NOTE_TEXT_SIZES } from "@/features/wall/constants";
import type { Note } from "@/features/wall/types";

type LayoutPrefs = {
  showToolsPanel: boolean;
  showDetailsPanel: boolean;
  showContextBar: boolean;
  showNoteTags: boolean;
};

type WallHeaderBarProps = {
  presentationMode: boolean;
  publishedReadOnly: boolean;
  layoutPrefs: LayoutPrefs;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  layoutMenuOpen: boolean;
  quickCaptureOpen: boolean;
  isTimeLocked: boolean;
  hasContextActions: boolean;
  showContextColor: boolean;
  showContextTextSize: boolean;
  showContextAlign: boolean;
  toolbarSurface: string;
  toolbarLabel: string;
  toolbarDivider: string;
  toolbarBtnActive: string;
  toolbarBtnCompact: string;
  selectedNotes: Note[];
  selectedNote?: Note;
  primarySelectedNote?: Note;
  uiLastColor: string;
  statusMessage: string;
  cloudWallId: string | null;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  onOpenCommandPalette: () => void;
  onToggleQuickCapture: () => void;
  onTogglePresentationMode: () => void;
  onOpenShortcuts: () => void;
  onSetLayoutPreference: (key: "showToolsPanel" | "showDetailsPanel" | "showContextBar" | "showNoteTags", value: boolean) => void;
  onApplyColorToSelection: (color: string) => void;
  onApplyTextSizeToSelection: (size: "sm" | "md" | "lg") => void;
  onAlignSelected: (axis: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  onDistributeSelected: (direction: "horizontal" | "vertical") => void;
  onSyncNow: () => void;
};

export const WallHeaderBar = ({
  presentationMode,
  publishedReadOnly,
  layoutPrefs,
  leftPanelOpen,
  rightPanelOpen,
  layoutMenuOpen,
  quickCaptureOpen,
  isTimeLocked,
  hasContextActions,
  showContextColor,
  showContextTextSize,
  showContextAlign,
  toolbarSurface,
  toolbarLabel,
  toolbarDivider,
  toolbarBtnActive,
  toolbarBtnCompact,
  selectedNotes,
  selectedNote,
  primarySelectedNote,
  uiLastColor,
  statusMessage,
  cloudWallId,
  isSyncing,
  lastSyncedAt,
  onToggleLeftPanel,
  onToggleRightPanel,
  onOpenCommandPalette,
  onToggleQuickCapture,
  onTogglePresentationMode,
  onOpenShortcuts,
  onSetLayoutPreference,
  onApplyColorToSelection,
  onApplyTextSizeToSelection,
  onAlignSelected,
  onDistributeSelected,
  onSyncNow,
}: WallHeaderBarProps) => {
  return (
    <header className="mx-3 mt-3 flex flex-col gap-1.5 md:mx-4 md:mt-4">
      <WallToolbar
        presentationMode={presentationMode}
        publishedReadOnly={publishedReadOnly}
        layoutPrefs={layoutPrefs}
        leftPanelOpen={leftPanelOpen}
        rightPanelOpen={rightPanelOpen}
        layoutMenuOpen={layoutMenuOpen}
        quickCaptureOpen={quickCaptureOpen}
        isTimeLocked={isTimeLocked}
        onToggleLeftPanel={onToggleLeftPanel}
        onToggleRightPanel={onToggleRightPanel}
        onOpenCommandPalette={onOpenCommandPalette}
        onToggleQuickCapture={onToggleQuickCapture}
        onTogglePresentationMode={onTogglePresentationMode}
        onOpenShortcuts={onOpenShortcuts}
        onSetLayoutPreference={onSetLayoutPreference}
      />

      {!publishedReadOnly && !presentationMode && layoutPrefs.showContextBar && hasContextActions && (
        <div className={`${toolbarSurface} flex flex-wrap items-center gap-2`}>
          <span className={toolbarLabel}>Context</span>
          {showContextColor && (
            <>
              <div className={toolbarDivider} />
              <div className="flex items-center gap-2">
                <span className={toolbarLabel}>Color</span>
                <NoteSwatches value={selectedNotes[0]?.color ?? selectedNote?.color ?? uiLastColor} onSelect={onApplyColorToSelection} />
              </div>
            </>
          )}
          {showContextTextSize && (
            <div className="flex items-center gap-1">
              <span className={toolbarLabel}>Text</span>
              {NOTE_TEXT_SIZES.map((size) => (
                <button
                  key={`context-size-${size.value}`}
                  type="button"
                  onClick={() => onApplyTextSizeToSelection(size.value)}
                  disabled={isTimeLocked}
                  className={(primarySelectedNote?.textSize ?? NOTE_DEFAULTS.textSize) === size.value ? toolbarBtnActive : toolbarBtnCompact}
                >
                  {size.label}
                </button>
              ))}
            </div>
          )}
          {showContextAlign && (
            <div className="flex items-center gap-1">
              <span className={toolbarLabel}>Align</span>
              <button type="button" onClick={() => onAlignSelected("left")} disabled={isTimeLocked} className={toolbarBtnCompact}>L</button>
              <button type="button" onClick={() => onAlignSelected("center")} disabled={isTimeLocked} className={toolbarBtnCompact}>C</button>
              <button type="button" onClick={() => onAlignSelected("right")} disabled={isTimeLocked} className={toolbarBtnCompact}>R</button>
              <button type="button" onClick={() => onAlignSelected("top")} disabled={isTimeLocked} className={toolbarBtnCompact}>T</button>
              <button type="button" onClick={() => onAlignSelected("middle")} disabled={isTimeLocked} className={toolbarBtnCompact}>M</button>
              <button type="button" onClick={() => onAlignSelected("bottom")} disabled={isTimeLocked} className={toolbarBtnCompact}>B</button>
              <button
                type="button"
                onClick={() => onDistributeSelected("horizontal")}
                disabled={selectedNotes.length < 3 || isTimeLocked}
                className={toolbarBtnCompact}
              >
                Dist H
              </button>
              <button
                type="button"
                onClick={() => onDistributeSelected("vertical")}
                disabled={selectedNotes.length < 3 || isTimeLocked}
                className={toolbarBtnCompact}
              >
                Dist V
              </button>
            </div>
          )}
        </div>
      )}

      {statusMessage && (
        <div className={`${statusChip} max-w-[min(96vw,40rem)]`}>
          <span className="truncate">{statusMessage}</span>
        </div>
      )}

      {!publishedReadOnly && (
        <div className={statusChip}>
          <button
            type="button"
            onClick={onSyncNow}
            disabled={!cloudWallId || isSyncing}
            className={toolbarBtnCompact}
          >
            {isSyncing ? "Syncing..." : "Sync now"}
          </button>
          <span>{lastSyncedAt ? `Last synced ${new Date(lastSyncedAt).toLocaleTimeString()}` : "Waiting for first sync"}</span>
        </div>
      )}
    </header>
  );
};
