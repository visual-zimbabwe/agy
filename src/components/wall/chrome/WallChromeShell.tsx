"use client";

import type { Dispatch, SetStateAction } from "react";

import type { CommandPaletteCommand } from "@/components/SearchPalette";
import { WallDetailsSidebar } from "@/components/wall/WallDetailsSidebar";
import { WallHeaderBar } from "@/components/wall/WallHeaderBar";
import { WallProductTour, type TourCoachmark } from "@/components/wall/WallProductTour";
import { WallSearchDock } from "@/components/wall/WallSearchDock";
import { WallStatusFooter } from "@/components/wall/WallStatusFooter";
import { WallTimelineView } from "@/components/wall/WallTimelineView";
import { WallToolsPanel } from "@/components/wall/WallToolsPanel";
import { LINK_TYPES } from "@/features/wall/constants";
import type { LinkType, Note } from "@/features/wall/types";
import type { AppUserProfile } from "@/lib/profile";

type LayoutPreferences = {
  showToolsPanel: boolean;
  showDetailsPanel: boolean;
  showContextBar: boolean;
  showNoteTags: boolean;
};

type SpatialPreferences = {
  showDotMatrix: boolean;
  snapToGuides: boolean;
  snapToGrid: boolean;
  dotGridSpacing: number;
};

type ControlsMode = "basic" | "advanced";

export type WallChromeHeaderProps = {
  presentationMode: boolean;
  publishedReadOnly: boolean;
  timelineViewActive: boolean;
  layoutPrefs: LayoutPreferences;
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
  userProfile?: AppUserProfile;
  cloudWallId: string | null;
  isSyncing: boolean;
  localSaveState: "idle" | "saving" | "error";
  hasPendingSync: boolean;
  lastSyncedAt: number | null;
  syncError: string | null;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  onOpenCommandPalette: () => void;
  onToggleQuickCapture: () => void;
  onToggleTimelineView: () => void;
  onTogglePresentationMode: () => void;
  onOpenShortcuts: () => void;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
  onApplyColorToSelection: (color: string) => void;
  onSyncNow: () => void;
};

export const WallChromeHeader = (props: WallChromeHeaderProps) => (
  <WallHeaderBar {...props} />
);

export type WallInCanvasChromeProps = {
  readingMode: boolean;
  timelineViewActive: boolean;
  isChromeHidden: boolean;
  publishedReadOnly: boolean;
  layoutPrefs: LayoutPreferences;
  leftPanelOpen: boolean;
  hasNoteSelection: boolean;
  isTimeLocked: boolean;
  selectedNoteId?: string;
  linkingFromNoteId?: string;
  linkType: LinkType;
  showClusters: boolean;
  boxSelectMode: boolean;
  spatialPrefs: SpatialPreferences;
  controlsMode: ControlsMode;
  toolbarBtn: string;
  toolbarBtnPrimary: string;
  toolbarBtnActive: string;
  toolbarSelect: string;
  tourCoachmark: TourCoachmark | null;
  onTourNext: () => void;
  onTourSkip: () => void;
  onTourDismissTip: () => void;
  onTourDismissComplete: () => void;
  notes: Note[];
  visibleNotes: Note[];
  recallQuery: string;
  commandPaletteCommands: CommandPaletteCommand[];
  availableRecallTags: string[];
  cloudWallId: string | null;
  isSyncing: boolean;
  hasPendingSync: boolean;
  syncError: string | null;
  setLeftPanelOpen: Dispatch<SetStateAction<boolean>>;
  setBoxSelectMode: Dispatch<SetStateAction<boolean>>;
  setSpatialPrefs: Dispatch<SetStateAction<SpatialPreferences>>;
  setLinkingFromNote: (noteId: string | undefined) => void;
  setLinkType: (type: LinkType) => void;
  setShowClusters: (value: boolean) => void;
  isSearchOpen: boolean;
  setSearchOpenTracked: (open: boolean) => void;
  setRecallQuery: Dispatch<SetStateAction<string>>;
  setTimelineViewActive: Dispatch<SetStateAction<boolean>>;
  syncPrimarySelection: (noteIds: string[]) => void;
  selectNote: (noteId: string) => void;
  clearNoteSelection: () => void;
  focusNote: (noteId: string) => void;
  revealNoteFromTimeline: (noteId: string) => void;
  makeNoteAtViewportCenter: () => void;
  makeCanonNoteAtViewportCenter: () => void;
  makeJournalNoteAtViewportCenter: () => void;
  makeQuoteNoteAtViewportCenter: () => void;
  makeCodeNoteAtViewportCenter: () => void;
  makeWebBookmarkNoteAtViewportCenter: () => void;
  makeImageNoteAtViewportCenter: () => void;
  makeFileNoteAtViewportCenter: () => void;
  makeAudioNoteAtViewportCenter: () => void;
  makeVideoNoteAtViewportCenter: () => void;
  makeEisenhowerNoteAtViewportCenter: () => void;
  makeWordNoteAtViewportCenter: () => void;
  makeZoneAtViewportCenter: () => void;
  openFileConversion: (conversionMode?: "pdf_to_word" | "word_to_pdf") => void;
};

export const WallInCanvasChrome = ({
  readingMode,
  timelineViewActive,
  isChromeHidden,
  publishedReadOnly,
  layoutPrefs,
  leftPanelOpen,
  hasNoteSelection,
  isTimeLocked,
  selectedNoteId,
  linkingFromNoteId,
  linkType,
  showClusters,
  boxSelectMode,
  spatialPrefs,
  controlsMode,
  toolbarBtn,
  toolbarBtnPrimary,
  toolbarBtnActive,
  toolbarSelect,
  tourCoachmark,
  onTourNext,
  onTourSkip,
  onTourDismissTip,
  onTourDismissComplete,
  notes,
  visibleNotes,
  recallQuery,
  commandPaletteCommands,
  availableRecallTags,
  cloudWallId,
  isSyncing,
  hasPendingSync,
  syncError,
  setLeftPanelOpen,
  setBoxSelectMode,
  setSpatialPrefs,
  setLinkingFromNote,
  setLinkType,
  setShowClusters,
  isSearchOpen,
  setSearchOpenTracked,
  setRecallQuery,
  setTimelineViewActive,
  syncPrimarySelection,
  selectNote,
  clearNoteSelection,
  focusNote,
  revealNoteFromTimeline,
  makeNoteAtViewportCenter,
  makeCanonNoteAtViewportCenter,
  makeJournalNoteAtViewportCenter,
  makeQuoteNoteAtViewportCenter,
  makeCodeNoteAtViewportCenter,
  makeWebBookmarkNoteAtViewportCenter,
  makeImageNoteAtViewportCenter,
  makeFileNoteAtViewportCenter,
  makeAudioNoteAtViewportCenter,
  makeVideoNoteAtViewportCenter,
  makeEisenhowerNoteAtViewportCenter,
  makeWordNoteAtViewportCenter,
  makeZoneAtViewportCenter,
  openFileConversion,
}: WallInCanvasChromeProps) => (
  <>
    <WallProductTour
      coachmark={tourCoachmark}
      onNext={onTourNext}
      onSkip={onTourSkip}
      onDismissTip={onTourDismissTip}
      onDismissComplete={onTourDismissComplete}
    />

    {timelineViewActive ? (
      <WallTimelineView
        notes={notes}
        selectedNoteId={selectedNoteId}
        onSelectNote={(noteId) => {
          syncPrimarySelection([noteId]);
          selectNote(noteId);
        }}
        onClearSelection={clearNoteSelection}
        onRevealNote={revealNoteFromTimeline}
        onExit={() => setTimelineViewActive(false)}
      />
    ) : null}

    {!timelineViewActive && !isChromeHidden && !publishedReadOnly && layoutPrefs.showToolsPanel && (hasNoteSelection || leftPanelOpen) && (
      <WallToolsPanel
        leftPanelOpen={leftPanelOpen}
        isTimeLocked={isTimeLocked}
        selectedNoteId={selectedNoteId}
        linkingFromNoteId={linkingFromNoteId}
        linkType={linkType}
        linkTypeOptions={LINK_TYPES}
        showClusters={showClusters}
        toolbarBtn={toolbarBtn}
        toolbarBtnPrimary={toolbarBtnPrimary}
        toolbarBtnActive={toolbarBtnActive}
        toolbarSelect={toolbarSelect}
        onClose={() => setLeftPanelOpen(false)}
        onCreateNote={makeNoteAtViewportCenter}
        onCreateCanonNote={makeCanonNoteAtViewportCenter}
        onCreateJournalNote={makeJournalNoteAtViewportCenter}
        onCreateQuoteNote={makeQuoteNoteAtViewportCenter}
        onCreateCodeNote={makeCodeNoteAtViewportCenter}
        onCreateWebBookmarkNote={makeWebBookmarkNoteAtViewportCenter}
        onCreateImageNote={makeImageNoteAtViewportCenter}
        onCreateFileNote={makeFileNoteAtViewportCenter}
        onCreateAudioNote={makeAudioNoteAtViewportCenter}
        onCreateVideoNote={makeVideoNoteAtViewportCenter}
        onCreateEisenhowerNote={makeEisenhowerNoteAtViewportCenter}
        onCreateWordNote={makeWordNoteAtViewportCenter}
        onCreateZone={makeZoneAtViewportCenter}
        onToggleBoxSelect={() => setBoxSelectMode((value) => !value)}
        boxSelectMode={boxSelectMode}
        onStartLinking={() => {
          if (isTimeLocked || !selectedNoteId) {
            return;
          }
          setLinkingFromNote(selectedNoteId);
        }}
        onLinkTypeChange={(value) => setLinkType(value)}
        onToggleClusters={() => setShowClusters(!showClusters)}
        showDotMatrix={spatialPrefs.showDotMatrix}
        snapToGuides={spatialPrefs.snapToGuides}
        snapToGrid={spatialPrefs.snapToGrid}
        onToggleDotMatrix={() =>
          setSpatialPrefs((previous) => ({ ...previous, showDotMatrix: !previous.showDotMatrix }))
        }
        onToggleSnapToGuides={() =>
          setSpatialPrefs((previous) => ({ ...previous, snapToGuides: !previous.snapToGuides }))
        }
        onToggleSnapToGrid={() =>
          setSpatialPrefs((previous) => ({ ...previous, snapToGrid: !previous.snapToGrid }))
        }
        controlsMode={controlsMode}
        onOpenFileConversion={(conversionMode) => openFileConversion(conversionMode)}
      />
    )}

    {!readingMode && !timelineViewActive && (
      <WallSearchDock
        open={isSearchOpen}
        query={recallQuery}
        notes={visibleNotes}
        commands={commandPaletteCommands}
        availableTags={availableRecallTags}
        onOpenSearch={() => setSearchOpenTracked(true)}
        onCloseSearch={() => setSearchOpenTracked(false)}
        onQueryChange={setRecallQuery}
        onSelectNote={focusNote}
        hidden={isChromeHidden}
      />
    )}

    <WallStatusFooter
      publishedReadOnly={publishedReadOnly}
      hasCloudWall={Boolean(cloudWallId)}
      isSyncing={isSyncing}
      hasPendingSync={hasPendingSync}
      syncError={syncError}
    />

    {!timelineViewActive && <WallDetailsSidebar />}
  </>
);
