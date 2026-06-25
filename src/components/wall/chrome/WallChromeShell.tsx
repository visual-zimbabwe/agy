"use client";

import type { Dispatch, SetStateAction } from "react";

import type { CommandPaletteCommand } from "@/components/SearchPalette";
import { WallHeaderBar } from "@/components/wall/WallHeaderBar";
import { WallProductTour, type TourCoachmark } from "@/components/wall/WallProductTour";
import { WallSearchDock } from "@/components/wall/WallSearchDock";
import { WallStructureMenu } from "@/components/wall/WallStructureMenu";
import { WallTimelineView } from "@/components/wall/WallTimelineView";
import type { LinkType, Note, TemplateType } from "@/features/wall/types";
import type { AppUserProfile } from "@/lib/profile";

type LayoutPreferences = {
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

export type WallChromeHeaderProps = {
  presentationMode: boolean;
  publishedReadOnly: boolean;
  timelineViewActive: boolean;
  layoutPrefs: LayoutPreferences;
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
  timelineMode: boolean;
  isChromeHidden: boolean;
  publishedReadOnly: boolean;
  layoutPrefs: LayoutPreferences;
  hasNoteSelection: boolean;
  isTimeLocked: boolean;
  selectedNoteId?: string;
  linkingFromNoteId?: string;
  linkType: LinkType;
  showClusters: boolean;
  boxSelectMode: boolean;
  spatialPrefs: SpatialPreferences;
  templateType: TemplateType;
  presentationMode: boolean;
  showHeatmap: boolean;
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
  makeZoneAtViewportCenter: () => void;
  openFileConversion: (conversionMode?: "pdf_to_word" | "word_to_pdf") => void;
  onTemplateTypeChange: (value: TemplateType) => void;
  onApplyTemplate: () => void;
  onTogglePresentationMode: () => void;
  onToggleReadingMode: () => void;
  onToggleHeatmap: () => void;
  onToggleTimelineMode: () => void;
};

export const WallInCanvasChrome = ({
  readingMode,
  timelineViewActive,
  timelineMode,
  isChromeHidden,
  publishedReadOnly,
  layoutPrefs,
  isTimeLocked,
  selectedNoteId,
  linkingFromNoteId,
  linkType,
  showClusters,
  boxSelectMode,
  spatialPrefs,
  templateType,
  presentationMode,
  showHeatmap,
  toolbarBtn,
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
  makeZoneAtViewportCenter,
  openFileConversion,
  onTemplateTypeChange,
  onApplyTemplate,
  onTogglePresentationMode,
  onToggleReadingMode,
  onToggleHeatmap,
  onToggleTimelineMode,
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

    <WallStructureMenu
      isTimeLocked={isTimeLocked}
      publishedReadOnly={publishedReadOnly}
      isChromeHidden={isChromeHidden}
      timelineViewActive={timelineViewActive}
      selectedNoteId={selectedNoteId}
      linkingFromNoteId={linkingFromNoteId}
      linkType={linkType}
      boxSelectMode={boxSelectMode}
      showClusters={showClusters}
      spatialPrefs={spatialPrefs}
      templateType={templateType}
      presentationMode={presentationMode}
      readingMode={readingMode}
      showHeatmap={showHeatmap}
      timelineMode={timelineMode}
      toolbarBtn={toolbarBtn}
      toolbarBtnActive={toolbarBtnActive}
      toolbarSelect={toolbarSelect}
      onCreateZone={makeZoneAtViewportCenter}
      onStartLinking={() => {
        if (isTimeLocked || !selectedNoteId) {
          return;
        }
        setLinkingFromNote(selectedNoteId);
      }}
      onLinkTypeChange={(value) => setLinkType(value)}
      onToggleBoxSelect={() => setBoxSelectMode((value) => !value)}
      onToggleSnapToGrid={() =>
        setSpatialPrefs((previous) => ({ ...previous, snapToGrid: !previous.snapToGrid }))
      }
      onToggleSnapToGuides={() =>
        setSpatialPrefs((previous) => ({ ...previous, snapToGuides: !previous.snapToGuides }))
      }
      onToggleClusters={() => setShowClusters(!showClusters)}
      onToggleDotMatrix={() =>
        setSpatialPrefs((previous) => ({ ...previous, showDotMatrix: !previous.showDotMatrix }))
      }
      onTemplateTypeChange={onTemplateTypeChange}
      onApplyTemplate={onApplyTemplate}
      onTogglePresentationMode={onTogglePresentationMode}
      onToggleReadingMode={onToggleReadingMode}
      onToggleHeatmap={onToggleHeatmap}
      onToggleTimelineMode={onToggleTimelineMode}
      onOpenFileConversion={(conversionMode) => openFileConversion(conversionMode)}
    />

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

  </>
);
