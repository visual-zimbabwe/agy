"use client";

import { useMemo, type Dispatch, type SetStateAction } from "react";

import type { CommandPaletteCommand } from "@/components/SearchPalette";
import type { Note, ZoneGroup } from "@/features/wall/types";
import type { ZoneKind } from "@/features/wall/types";

type SpatialPreferences = {
  showDotMatrix: boolean;
  snapToGuides: boolean;
  snapToGrid: boolean;
  dotGridSpacing: number;
};

export type UseWallCommandPaletteOptions = {
  isTimeLocked: boolean;
  canUndo: boolean;
  canRedo: boolean;
  boxSelectMode: boolean;
  readingMode: boolean;
  presentationMode: boolean;
  quickCaptureOpen: boolean;
  showHeatmap: boolean;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  timelineMode: boolean;
  timelineViewActive: boolean;
  showClusters: boolean;
  spatialPrefs: SpatialPreferences;
  selectedNotesCount: number;
  vocabularyDueNotesCount: number;
  selectedVocabularyNote?: Note;
  zoneGroups: ZoneGroup[];
  makeNoteAtViewportCenter: () => void;
  makeCanonNoteAtViewportCenter: () => void;
  makeJournalNoteAtViewportCenter: () => void;
  makeQuoteNoteAtViewportCenter: () => void;
  makeEisenhowerNoteAtViewportCenter: () => void;
  makeWordNoteAtViewportCenter: () => void;
  makeZoneAtViewportCenter: (kind?: ZoneKind) => void;
  focusNextDueWord: () => void;
  toggleVocabularyFlip: (noteId: string) => void;
  setQuickCaptureOpen: Dispatch<SetStateAction<boolean>>;
  setExportOpenTracked: (open: boolean) => void;
  openFileConversion: (conversionMode?: "pdf_to_word" | "word_to_pdf") => void;
  undo: () => void;
  redo: () => void;
  toggleReadingMode: () => void;
  togglePresentationMode: () => void;
  zoomToFitTracked: () => void;
  zoomToSelection: () => void;
  openTour: () => void;
  toggleTimelineMode: () => void;
  toggleTimelineView: () => void;
  setShowHeatmap: Dispatch<SetStateAction<boolean>>;
  toggleLeftPanel: () => void;
  openLeftPanel: () => void;
  closeLeftPanel: () => void;
  toggleRightPanel: () => void;
  openRightPanel: () => void;
  closeRightPanel: () => void;
  setBoxSelectMode: Dispatch<SetStateAction<boolean>>;
  setShowClusters: (value: boolean) => void;
  collapseAllZoneGroups: () => void;
  expandAllZoneGroups: () => void;
  setSpatialPrefs: Dispatch<SetStateAction<SpatialPreferences>>;
  openHelpCenter: () => void;
  setShortcutsOpenTracked: (open: boolean) => void;
};

export const useWallCommandPalette = (options: UseWallCommandPaletteOptions) =>
  useMemo<CommandPaletteCommand[]>(
    () => [
      {
        id: "new-note",
        label: "Create note",
        description: "Add a note at viewport center and open editor.",
        shortcut: "N",
        keywords: ["add", "new", "sticky"],
        disabled: options.isTimeLocked,
        onSelect: options.makeNoteAtViewportCenter,
      },
      {
        id: "new-journal-note",
        label: "Create journal note",
        description: "Add a handwritten notebook page entry with a dated header.",
        shortcut: "Shift + J",
        keywords: ["journal", "diary", "notebook", "handwritten"],
        disabled: options.isTimeLocked,
        onSelect: options.makeJournalNoteAtViewportCenter,
      },
      {
        id: "new-canon-note",
        label: "Create canon note",
        description: "Capture a law/rule/theorem with single or list mode.",
        shortcut: "Shift + G",
        keywords: ["law", "rule", "theorem", "commandments", "canon"],
        disabled: options.isTimeLocked,
        onSelect: options.makeCanonNoteAtViewportCenter,
      },
      {
        id: "new-quote-note",
        label: "Create quote note",
        description: "Add a quote card with attribution fields.",
        shortcut: "Shift + Q",
        keywords: ["quote", "citation", "author", "source"],
        disabled: options.isTimeLocked,
        onSelect: options.makeQuoteNoteAtViewportCenter,
      },
      {
        id: "new-eisenhower-note",
        label: "Create Eisenhower Matrix note",
        description: "Add a four-quadrant priority note with editable sections.",
        shortcut: "Shift + E",
        keywords: ["matrix", "eisenhower", "priority", "urgent", "important"],
        disabled: options.isTimeLocked,
        onSelect: options.makeEisenhowerNoteAtViewportCenter,
      },
      {
        id: "new-word-note",
        label: "Create word note",
        description: "Capture a vocabulary card with spaced-review fields.",
        keywords: ["word", "vocabulary", "flashcard", "learn"],
        disabled: options.isTimeLocked,
        onSelect: options.makeWordNoteAtViewportCenter,
      },
      {
        id: "review-next-word",
        label: "Review next due word",
        description: "Jump to the most overdue vocabulary card.",
        keywords: ["review", "due", "spaced repetition", "focus word"],
        disabled: options.vocabularyDueNotesCount === 0,
        onSelect: options.focusNextDueWord,
      },
      {
        id: "flip-word-card",
        label: "Flip selected word card",
        description: "Toggle front/back for the selected vocabulary flashcard.",
        shortcut: "F",
        keywords: ["flashcard", "flip", "word", "vocabulary"],
        disabled: options.isTimeLocked || !options.selectedVocabularyNote,
        onSelect: () => {
          if (options.selectedVocabularyNote) {
            options.toggleVocabularyFlip(options.selectedVocabularyNote.id);
          }
        },
      },
      {
        id: "new-frame",
        label: "Create frame zone",
        description: "Add a frame zone at viewport center.",
        keywords: ["zone", "container", "frame"],
        disabled: options.isTimeLocked,
        onSelect: () => options.makeZoneAtViewportCenter("frame"),
      },
      {
        id: "new-column",
        label: "Create column zone",
        description: "Add a column zone at viewport center.",
        keywords: ["zone", "column", "layout"],
        disabled: options.isTimeLocked,
        onSelect: () => options.makeZoneAtViewportCenter("column"),
      },
      {
        id: "new-swimlane",
        label: "Create swimlane zone",
        description: "Add a swimlane zone at viewport center.",
        keywords: ["zone", "lane", "layout"],
        disabled: options.isTimeLocked,
        onSelect: () => options.makeZoneAtViewportCenter("swimlane"),
      },
      {
        id: "toggle-quick-capture",
        label: options.quickCaptureOpen ? "Close quick capture" : "Open quick capture",
        description: "Capture notes quickly from text input.",
        shortcut: "Q",
        keywords: ["capture", "quick"],
        disabled: options.isTimeLocked,
        onSelect: () => options.setQuickCaptureOpen((previous) => !previous),
      },
      {
        id: "export",
        label: "Open export panel",
        description: "Export PNG, PDF, Markdown, JSON, or publish snapshot.",
        keywords: ["download", "share", "backup"],
        onSelect: () => options.setExportOpenTracked(true),
      },
      {
        id: "convert-pdf-to-word",
        label: "Open PDF to Word",
        description: "Convert PDF documents into Word files.",
        keywords: ["convert", "pdf", "word", "document"],
        onSelect: () => options.openFileConversion("pdf_to_word"),
      },
      {
        id: "convert-word-to-pdf",
        label: "Open Word to PDF",
        description: "Convert Word documents into PDF files.",
        keywords: ["convert", "word", "pdf", "document"],
        onSelect: () => options.openFileConversion("word_to_pdf"),
      },
      {
        id: "undo",
        label: "Undo",
        description: "Revert the last change.",
        shortcut: "Ctrl/Cmd + Z",
        keywords: ["history", "back"],
        disabled: !options.canUndo || options.isTimeLocked,
        onSelect: options.undo,
      },
      {
        id: "redo",
        label: "Redo",
        description: "Re-apply the last reverted change.",
        shortcut: "Ctrl/Cmd + Shift + Z",
        keywords: ["history", "forward"],
        disabled: !options.canRedo || options.isTimeLocked,
        onSelect: options.redo,
      },
      {
        id: "toggle-reading",
        label: options.readingMode ? "Exit reading mode" : "Enter reading mode",
        description: "Hide wall chrome and focus on note content only.",
        shortcut: "R",
        keywords: ["read", "calm", "focus", "distraction-free"],
        onSelect: options.toggleReadingMode,
      },
      {
        id: "toggle-presentation",
        label: options.presentationMode ? "Exit presentation mode" : "Enter presentation mode",
        description: "Focus on sequential note walkthrough.",
        shortcut: "P",
        keywords: ["present", "slides"],
        onSelect: options.togglePresentationMode,
      },
      {
        id: "zoom-to-fit",
        label: "Zoom to fit all content",
        description: "Frame all visible notes and zones with padding.",
        keywords: ["camera", "zoom", "fit", "frame", "board"],
        onSelect: options.zoomToFitTracked,
      },
      {
        id: "zoom-to-selection",
        label: "Zoom to selection",
        description: "Frame the selected notes.",
        keywords: ["camera", "zoom", "selection", "focus", "frame"],
        disabled: options.selectedNotesCount === 0,
        onSelect: options.zoomToSelection,
      },
      {
        id: "replay-product-tour",
        label: "Replay product tour",
        description: "Start the hybrid wall tour again from the beginning.",
        keywords: ["tour", "onboarding", "help", "guide"],
        onSelect: options.openTour,
      },
      {
        id: "toggle-timeline",
        label: options.timelineMode ? "Exit wall history" : "Enter wall history",
        description: "Replay persisted wall snapshots with the history scrubber.",
        shortcut: "T",
        keywords: ["history", "replay", "time", "wall history"],
        onSelect: options.toggleTimelineMode,
      },
      {
        id: "toggle-timeline-view",
        label: options.timelineViewActive ? "Exit Timeline" : "Open Timeline",
        description: "Review current notes in a vertical chronological stream.",
        shortcut: "V",
        keywords: ["timeline", "stream", "chronological", "story"],
        onSelect: options.toggleTimelineView,
      },
      {
        id: "toggle-heatmap",
        label: options.showHeatmap ? "Hide recency heatmap" : "Show recency heatmap",
        description: "Overlay recency heatmap calendar.",
        shortcut: "H",
        keywords: ["calendar", "activity"],
        onSelect: () => options.setShowHeatmap((previous) => !previous),
      },
      {
        id: "toggle-tools-panel",
        label: options.leftPanelOpen ? "Hide tools panel" : "Show tools panel",
        description: "Toggle the left tools panel.",
        keywords: ["left", "panel", "tools", "show tools"],
        onSelect: options.toggleLeftPanel,
      },
      {
        id: "open-tools-panel",
        label: "Show tools panel",
        description: "Open the left tools panel.",
        keywords: ["left", "panel", "tools", "show", "open"],
        disabled: options.leftPanelOpen,
        onSelect: options.openLeftPanel,
      },
      {
        id: "close-tools-panel",
        label: "Hide tools panel",
        description: "Close the left tools panel.",
        keywords: ["left", "panel", "tools", "hide", "close"],
        disabled: !options.leftPanelOpen,
        onSelect: options.closeLeftPanel,
      },
      {
        id: "toggle-details-panel",
        label: options.rightPanelOpen ? "Hide details panel" : "Show details panel",
        description: "Toggle the right details panel.",
        keywords: ["right", "panel", "details", "sidebar"],
        onSelect: options.toggleRightPanel,
      },
      {
        id: "open-details-panel",
        label: "Open sidebar",
        description: "Open the right details sidebar.",
        keywords: ["right", "panel", "details", "sidebar", "open"],
        disabled: options.rightPanelOpen,
        onSelect: options.openRightPanel,
      },
      {
        id: "close-details-panel",
        label: "Close sidebar",
        description: "Close the right details sidebar.",
        keywords: ["right", "panel", "details", "sidebar", "close", "hide"],
        disabled: !options.rightPanelOpen,
        onSelect: options.closeRightPanel,
      },
      {
        id: "toggle-box-select",
        label: options.boxSelectMode ? "Disable box select mode" : "Enable box select mode",
        description: "Switch drag behavior to marquee selection.",
        keywords: ["multi-select", "selection", "marquee"],
        onSelect: () => options.setBoxSelectMode((value) => !value),
      },
      {
        id: "toggle-clusters",
        label: options.showClusters ? "Hide cluster overlays" : "Show cluster overlays",
        description: "Toggle automatic cluster outlines.",
        keywords: ["cluster", "insight", "overlay"],
        onSelect: () => options.setShowClusters(!options.showClusters),
      },
      {
        id: "collapse-all-groups",
        label: "Collapse all zone groups",
        description: "Hide all grouped zones and grouped notes.",
        keywords: ["groups", "collapse", "declutter"],
        disabled: options.isTimeLocked || options.zoneGroups.every((group) => group.collapsed),
        onSelect: options.collapseAllZoneGroups,
      },
      {
        id: "expand-all-groups",
        label: "Expand all zone groups",
        description: "Show all grouped zones and grouped notes.",
        keywords: ["groups", "expand", "restore"],
        disabled: options.isTimeLocked || options.zoneGroups.every((group) => !group.collapsed),
        onSelect: options.expandAllZoneGroups,
      },
      {
        id: "toggle-dot-matrix",
        label: options.spatialPrefs.showDotMatrix ? "Hide dot matrix" : "Show dot matrix",
        description: "Toggle subtle dot-grid background helper.",
        keywords: ["grid", "dot", "background"],
        onSelect: () =>
          options.setSpatialPrefs((previous) => ({ ...previous, showDotMatrix: !previous.showDotMatrix })),
      },
      {
        id: "toggle-snap-guides",
        label: options.spatialPrefs.snapToGuides ? "Disable snap guides" : "Enable snap guides",
        description: "Toggle alignment guide snapping.",
        keywords: ["snap", "guide", "align"],
        onSelect: () =>
          options.setSpatialPrefs((previous) => ({ ...previous, snapToGuides: !previous.snapToGuides })),
      },
      {
        id: "toggle-snap-grid",
        label: options.spatialPrefs.snapToGrid ? "Disable snap grid" : "Enable snap grid",
        description: "Toggle grid snapping during drag.",
        keywords: ["snap", "grid"],
        onSelect: () =>
          options.setSpatialPrefs((previous) => ({ ...previous, snapToGrid: !previous.snapToGrid })),
      },
      {
        id: "open-help-center",
        label: "Open help center",
        description: "Show task guidance, troubleshooting, and product help.",
        keywords: ["help", "docs", "support", "guide", "troubleshooting"],
        onSelect: options.openHelpCenter,
      },
      {
        id: "open-help-library",
        label: "Open full help library",
        description: "Browse the route-based help center.",
        keywords: ["help", "docs", "library", "articles"],
        onSelect: () => {
          window.location.href = "/help";
        },
      },
      {
        id: "open-shortcuts",
        label: "Open shortcuts help",
        description: "Show keyboard shortcut reference.",
        shortcut: "?",
        keywords: ["help", "keys"],
        onSelect: () => options.setShortcutsOpenTracked(true),
      },
    ],
    [options],
  );
