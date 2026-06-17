"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { RecallDateFilter, SavedRecallSearch } from "@/components/wall/details/DetailsSectionTypes";
import type { AutoTagGroup } from "@/components/wall/details/DetailsSectionTypes";
import type { SmartMergeSectionItem } from "@/components/wall/details/DetailsSectionTypes";
import type { Bounds, Note, TemplateType, VocabularyReviewOutcome, Zone, ZoneGroup } from "@/features/wall/types";
import type { SmartMergeSuggestion } from "@/lib/smart-merge";
import type { NoteTextFont } from "@/features/wall/types";

export type WallDetailsContextValue = {
  templateType: TemplateType;
  onTemplateTypeChange: (value: TemplateType) => void;
  onApplyTemplate: () => void;
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onAddTag: () => void;
  selectedNote?: Note;
  selectedNoteId?: string;
  selectedNoteIdsCount: number;
  displayedTags: string[];
  onRemoveTag: (tag: string) => void;
  linkingFromNoteId?: string;
  isSelectedNoteFocused: boolean;
  backlinks: Array<{ noteId: string; title: string }>;
  onNavigateLinkedNote: (noteId: string) => void;
  onTextFontChange: (font: NoteTextFont) => void;
  onTextSizeChange: (sizePx: number) => void;
  onTextColorChange: (color: string) => void;
  onTextHorizontalAlignChange: (align: "left" | "center" | "right") => void;
  onTextVerticalAlignChange: (align: "top" | "middle" | "bottom") => void;
  onBackgroundColorChange: (color: string) => void;
  onDuplicateSelectedNote: (noteId: string) => void;
  onTogglePinSelectedNote: (noteId: string) => void;
  onToggleHighlightSelectedNote: (noteId: string) => void;
  onToggleFocusSelectedNote: (noteId: string) => void;
  onStartLinkFromSelectedNote: (noteId: string) => void;
  onUpdateSelectedNote: (noteId: string, patch: Partial<Note>) => void;
  privateNoteSupported: boolean;
  isPrivateEnabled: boolean;
  isPrivateUnlocked: boolean;
  onProtectPrivateNote: (noteId: string) => void;
  onUnlockPrivateNote: (noteId: string) => void;
  onLockPrivateNote: (noteId: string) => void;
  onRemovePrivateProtection: (noteId: string) => void;
  recallQuery: string;
  onRecallQueryChange: (value: string) => void;
  recallZoneId: string;
  onRecallZoneIdChange: (value: string) => void;
  recallTag: string;
  onRecallTagChange: (value: string) => void;
  recallDateFilter: RecallDateFilter;
  onRecallDateFilterChange: (value: RecallDateFilter) => void;
  visibleZones: Zone[];
  availableRecallTags: string[];
  onSaveRecallSearch: () => void;
  onClearRecallFilters: () => void;
  savedRecallSearches: SavedRecallSearch[];
  onApplySavedRecallSearch: (item: SavedRecallSearch) => void;
  onDeleteSavedRecallSearch: (id: string) => void;
  isSelectedNoteVocabulary: boolean;
  vocabularyDueCount: number;
  vocabularyFocusCount: number;
  reviewedTodayCount: number;
  reviewRevealMeaning: boolean;
  onToggleRevealMeaning: () => void;
  onToggleFlipCard: () => void;
  onCreateWordNote: () => void;
  onFocusNextDueWord: () => void;
  onUpdateVocabularyField: (
    field: "word" | "sourceContext" | "guessMeaning" | "meaning" | "ownSentence",
    value: string,
  ) => void;
  onReviewSelectedWord: (outcome: VocabularyReviewOutcome) => void;
  groupLabelInput: string;
  onGroupLabelInputChange: (value: string) => void;
  selectedZone?: Zone;
  selectedGroup?: ZoneGroup;
  selectedZoneId?: string;
  zoneGroups: ZoneGroup[];
  onCreateGroupFromSelectedZone: () => void;
  onAssignZoneToGroup: (zoneId: string, groupId?: string) => void;
  onSelectGroup: (groupId?: string) => void;
  onToggleGroupCollapse: (groupId: string) => void;
  onCollapseAllGroups: () => void;
  onExpandAllGroups: () => void;
  onDeleteGroup: (groupId: string) => void;
  onClearNoteSelection: () => void;
  showAutoTagGroups: boolean;
  onToggleAutoTagGroups: () => void;
  autoTagGroups: AutoTagGroup[];
  onFocusBounds: (bounds: Bounds) => void;
  smartMergeSuggestions: SmartMergeSectionItem[];
  onPreviewSmartMerge: (suggestion: SmartMergeSuggestion) => void;
  onMergeSmartSuggestion: (suggestion: SmartMergeSuggestion) => void;
};

const noop = () => undefined;

const defaultWallDetailsContext: WallDetailsContextValue = {
  templateType: "brainstorm",
  onTemplateTypeChange: noop,
  onApplyTemplate: noop,
  tagInput: "",
  onTagInputChange: noop,
  onAddTag: noop,
  selectedNoteIdsCount: 0,
  displayedTags: [],
  onRemoveTag: noop,
  isSelectedNoteFocused: false,
  backlinks: [],
  onNavigateLinkedNote: noop,
  onTextFontChange: noop,
  onTextSizeChange: noop,
  onTextColorChange: noop,
  onTextHorizontalAlignChange: noop,
  onTextVerticalAlignChange: noop,
  onBackgroundColorChange: noop,
  onDuplicateSelectedNote: noop,
  onTogglePinSelectedNote: noop,
  onToggleHighlightSelectedNote: noop,
  onToggleFocusSelectedNote: noop,
  onStartLinkFromSelectedNote: noop,
  onUpdateSelectedNote: noop,
  privateNoteSupported: false,
  isPrivateEnabled: false,
  isPrivateUnlocked: false,
  onProtectPrivateNote: noop,
  onUnlockPrivateNote: noop,
  onLockPrivateNote: noop,
  onRemovePrivateProtection: noop,
  recallQuery: "",
  onRecallQueryChange: noop,
  recallZoneId: "",
  onRecallZoneIdChange: noop,
  recallTag: "",
  onRecallTagChange: noop,
  recallDateFilter: "all",
  onRecallDateFilterChange: noop,
  visibleZones: [],
  availableRecallTags: [],
  onSaveRecallSearch: noop,
  onClearRecallFilters: noop,
  savedRecallSearches: [],
  onApplySavedRecallSearch: noop,
  onDeleteSavedRecallSearch: noop,
  isSelectedNoteVocabulary: false,
  vocabularyDueCount: 0,
  vocabularyFocusCount: 0,
  reviewedTodayCount: 0,
  reviewRevealMeaning: false,
  onToggleRevealMeaning: noop,
  onToggleFlipCard: noop,
  onCreateWordNote: noop,
  onFocusNextDueWord: noop,
  onUpdateVocabularyField: noop,
  onReviewSelectedWord: noop,
  groupLabelInput: "",
  onGroupLabelInputChange: noop,
  zoneGroups: [],
  onCreateGroupFromSelectedZone: noop,
  onAssignZoneToGroup: noop,
  onSelectGroup: noop,
  onToggleGroupCollapse: noop,
  onCollapseAllGroups: noop,
  onExpandAllGroups: noop,
  onDeleteGroup: noop,
  onClearNoteSelection: noop,
  showAutoTagGroups: false,
  onToggleAutoTagGroups: noop,
  autoTagGroups: [],
  onFocusBounds: noop,
  smartMergeSuggestions: [],
  onPreviewSmartMerge: noop,
  onMergeSmartSuggestion: noop,
};

const WallDetailsContext = createContext<WallDetailsContextValue>(defaultWallDetailsContext);

export type WallDetailsProviderProps = {
  value?: Partial<WallDetailsContextValue>;
  children: ReactNode;
};

export const WallDetailsProvider = ({ value, children }: WallDetailsProviderProps) => (
  <WallDetailsContext.Provider value={{ ...defaultWallDetailsContext, ...value }}>
    {children}
  </WallDetailsContext.Provider>
);

export const useWallDetails = () => useContext(WallDetailsContext);
