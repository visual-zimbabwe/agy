"use client";

import { NoteSwatches } from "@/components/NoteCard";
import { ProfileMenu } from "@/components/ProfileMenu";
import { SyncStatus } from "@/components/wall/SyncStatus";
import { WallToolbar } from "@/components/wall/WallToolbar";
import { statusChip } from "@/components/wall/wallChromeClasses";
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
  quickCaptureOpen: boolean;
  isTimeLocked: boolean;
  hasContextActions: boolean;
  showContextColor: boolean;
  toolbarSurface: string;
  toolbarLabel: string;
  toolbarDivider: string;
  selectedNotes: Note[];
  selectedNote?: Note;
  uiLastColor: string;
  statusMessage: string;
  userEmail?: string;
  cloudWallId: string | null;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  syncError: string | null;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  onOpenCommandPalette: () => void;
  onToggleQuickCapture: () => void;
  onTogglePresentationMode: () => void;
  onOpenShortcuts: () => void;
  onApplyColorToSelection: (color: string) => void;
  onSyncNow: () => void;
};

export const WallHeaderBar = ({
  presentationMode,
  publishedReadOnly,
  layoutPrefs,
  leftPanelOpen,
  rightPanelOpen,
  quickCaptureOpen,
  isTimeLocked,
  hasContextActions,
  showContextColor,
  toolbarSurface,
  toolbarLabel,
  toolbarDivider,
  selectedNotes,
  selectedNote,
  uiLastColor,
  statusMessage,
  userEmail,
  cloudWallId,
  isSyncing,
  lastSyncedAt,
  syncError,
  onToggleLeftPanel,
  onToggleRightPanel,
  onOpenCommandPalette,
  onToggleQuickCapture,
  onTogglePresentationMode,
  onOpenShortcuts,
  onApplyColorToSelection,
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
        quickCaptureOpen={quickCaptureOpen}
        isTimeLocked={isTimeLocked}
        onToggleLeftPanel={onToggleLeftPanel}
        onToggleRightPanel={onToggleRightPanel}
        onOpenCommandPalette={onOpenCommandPalette}
        onToggleQuickCapture={onToggleQuickCapture}
        onTogglePresentationMode={onTogglePresentationMode}
      />

      {!publishedReadOnly && !presentationMode && layoutPrefs.showContextBar && hasContextActions && (
        <div className={`${toolbarSurface} flex flex-wrap items-center gap-2`}>
          <span className={toolbarLabel}>Context</span>
          {showContextColor && (
            <>
              <div className={toolbarDivider} />
              <div className="flex items-center gap-2">
                <span className={toolbarLabel}>Color</span>
                <NoteSwatches value={selectedNotes[0]?.color ?? selectedNote?.color ?? uiLastColor} onSelect={onApplyColorToSelection} showCustomColorAdd />
              </div>
            </>
          )}
        </div>
      )}

      {statusMessage && (
        <div className={`${statusChip} max-w-[min(96vw,40rem)]`}>
          <span className="truncate">{statusMessage}</span>
        </div>
      )}

      {userEmail && (
        <div className="pointer-events-auto fixed right-3 top-3 z-[95] flex items-center gap-2 sm:right-4 sm:top-4">
          {!publishedReadOnly && (
            <SyncStatus
              hasCloudWall={Boolean(cloudWallId)}
              isSyncing={isSyncing}
              lastSyncedAt={lastSyncedAt}
              syncError={syncError}
              onSyncNow={onSyncNow}
            />
          )}
          <ProfileMenu email={userEmail} onOpenShortcuts={onOpenShortcuts} />
        </div>
      )}
    </header>
  );
};
