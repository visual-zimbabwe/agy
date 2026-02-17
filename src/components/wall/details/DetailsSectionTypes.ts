import type { Note, VocabularyReviewOutcome, Zone, ZoneGroup } from "@/features/wall/types";
import type { SmartMergeSuggestion } from "@/lib/smart-merge";

export type RecallDateFilter = "all" | "today" | "7d" | "30d";

export type SavedRecallSearch = {
  id: string;
  name: string;
  query: string;
  zoneId?: string;
  tag?: string;
  dateFilter: RecallDateFilter;
};

export type DetailsSectionKey = "history" | "recall" | "vocabulary" | "zoneGroups" | "tagGroups" | "smartMerge";
export type DetailsSectionState = Record<DetailsSectionKey, boolean>;

export type AutoTagGroup = {
  tag: string;
  noteIds: string[];
  bounds: { x: number; y: number; w: number; h: number };
};

export type HistorySectionProps = {
  detailsSectionsOpen: DetailsSectionState;
  onToggleDetailsSection: (key: DetailsSectionKey) => void;
  timelineEntriesCount: number;
  visibleNotesCount: number;
  historyUndoDepth: number;
  historyRedoDepth: number;
  notes: Note[];
  onJumpStale: () => void;
  onJumpPriority: () => void;
  onClearHistory: () => void;
};

export type RecallSectionProps = {
  detailsSectionsOpen: DetailsSectionState;
  onToggleDetailsSection: (key: DetailsSectionKey) => void;
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
};

export type VocabularySectionProps = {
  detailsSectionsOpen: DetailsSectionState;
  onToggleDetailsSection: (key: DetailsSectionKey) => void;
  isTimeLocked: boolean;
  selectedNote?: Note;
  isSelectedNoteVocabulary: boolean;
  vocabularyDueCount: number;
  vocabularyFocusCount: number;
  reviewedTodayCount: number;
  reviewRevealMeaning: boolean;
  onToggleRevealMeaning: () => void;
  onCreateWordNote: () => void;
  onFocusNextDueWord: () => void;
  onUpdateVocabularyField: (
    field: "word" | "sourceContext" | "guessMeaning" | "meaning" | "ownSentence",
    value: string,
  ) => void;
  onReviewSelectedWord: (outcome: VocabularyReviewOutcome) => void;
};

export type ZoneGroupsSectionProps = {
  detailsSectionsOpen: DetailsSectionState;
  onToggleDetailsSection: (key: DetailsSectionKey) => void;
  groupLabelInput: string;
  onGroupLabelInputChange: (value: string) => void;
  selectedZone?: Zone;
  selectedGroup?: ZoneGroup;
  selectedZoneId?: string;
  zoneGroups: ZoneGroup[];
  isTimeLocked: boolean;
  onCreateGroupFromSelectedZone: () => void;
  onAssignZoneToGroup: (zoneId: string, groupId?: string) => void;
  onSelectGroup: (groupId?: string) => void;
  onToggleGroupCollapse: (groupId: string) => void;
  onCollapseAllGroups: () => void;
  onExpandAllGroups: () => void;
  onDeleteGroup: (groupId: string) => void;
  onClearNoteSelection: () => void;
};

export type TagGroupsSectionProps = {
  detailsSectionsOpen: DetailsSectionState;
  onToggleDetailsSection: (key: DetailsSectionKey) => void;
  showAutoTagGroups: boolean;
  onToggleAutoTagGroups: () => void;
  autoTagGroups: AutoTagGroup[];
  onFocusBounds: (bounds: { x: number; y: number; w: number; h: number }) => void;
};

export type SmartMergeSectionItem = SmartMergeSuggestion & {
  keepNoteText: string;
  mergeNoteText: string;
};

export type SmartMergeSectionProps = {
  detailsSectionsOpen: DetailsSectionState;
  onToggleDetailsSection: (key: DetailsSectionKey) => void;
  isTimeLocked: boolean;
  suggestions: SmartMergeSectionItem[];
  onPreview: (suggestion: SmartMergeSuggestion) => void;
  onMerge: (suggestion: SmartMergeSuggestion) => void;
};
