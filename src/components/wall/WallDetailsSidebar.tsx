"use client";

import { WallDetailsPanel } from "@/components/wall/WallDetailsPanel";
import { WallDetailsContent } from "@/components/wall/WallDetailsContent";
import type { DetailsSectionKey, DetailsSectionState, RecallDateFilter, SavedRecallSearch } from "@/components/wall/details/DetailsSectionTypes";
import { TEMPLATE_TYPES } from "@/features/wall/constants";
import type { Bounds, Note, NoteGroup, TemplateType, Zone, ZoneGroup } from "@/features/wall/types";

type WallDetailsSidebarProps = {
  presentationMode: boolean;
  showDetailsPanel: boolean;
  isCompactLayout: boolean;
  rightPanelOpen: boolean;
  onClose: () => void;
  templateType: TemplateType;
  isTimeLocked: boolean;
  onTemplateTypeChange: (value: TemplateType) => void;
  onApplyTemplate: () => void;
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onAddTag: () => void;
  selectedNoteId?: string;
  selectedNoteIdsCount: number;
  displayedTags: string[];
  onRemoveTag: (tag: string) => void;
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
  noteGroupLabelInput: string;
  onNoteGroupLabelInputChange: (value: string) => void;
  selectedNoteGroup?: NoteGroup;
  activeSelectedNoteIds: string[];
  noteGroups: NoteGroup[];
  onCreateGroupFromSelection: () => void;
  onSelectNoteGroup: (groupId?: string) => void;
  onToggleNoteGroupCollapse: (groupId: string) => void;
  onCollapseAllNoteGroups: () => void;
  onExpandAllNoteGroups: () => void;
  onDeleteNoteGroup: (groupId: string) => void;
  onAddSelectionToNoteGroup: (groupId: string) => void;
  onRemoveSelectionFromNoteGroup: (groupId: string) => void;
  onSelectNotesForGroup: (groupId: string) => void;
  showAutoTagGroups: boolean;
  onToggleAutoTagGroups: () => void;
  autoTagGroups: Array<{ tag: string; noteIds: string[]; bounds: Bounds }>;
  onFocusBounds: (bounds: Bounds) => void;
  controlsMode: "basic" | "advanced";
};

export const WallDetailsSidebar = ({
  presentationMode,
  showDetailsPanel,
  isCompactLayout,
  rightPanelOpen,
  onClose,
  templateType,
  isTimeLocked,
  onTemplateTypeChange,
  onApplyTemplate,
  tagInput,
  onTagInputChange,
  onAddTag,
  selectedNoteId,
  selectedNoteIdsCount,
  displayedTags,
  onRemoveTag,
  detailsSectionsOpen,
  onToggleDetailsSection,
  timelineEntriesCount,
  visibleNotesCount,
  historyUndoDepth,
  historyRedoDepth,
  notes,
  onJumpStale,
  onJumpPriority,
  onClearHistory,
  recallQuery,
  onRecallQueryChange,
  recallZoneId,
  onRecallZoneIdChange,
  recallTag,
  onRecallTagChange,
  recallDateFilter,
  onRecallDateFilterChange,
  visibleZones,
  availableRecallTags,
  onSaveRecallSearch,
  onClearRecallFilters,
  savedRecallSearches,
  onApplySavedRecallSearch,
  onDeleteSavedRecallSearch,
  groupLabelInput,
  onGroupLabelInputChange,
  selectedZone,
  selectedGroup,
  selectedZoneId,
  zoneGroups,
  onCreateGroupFromSelectedZone,
  onAssignZoneToGroup,
  onSelectGroup,
  onToggleGroupCollapse,
  onCollapseAllGroups,
  onExpandAllGroups,
  onDeleteGroup,
  onClearNoteSelection,
  noteGroupLabelInput,
  onNoteGroupLabelInputChange,
  selectedNoteGroup,
  activeSelectedNoteIds,
  noteGroups,
  onCreateGroupFromSelection,
  onSelectNoteGroup,
  onToggleNoteGroupCollapse,
  onCollapseAllNoteGroups,
  onExpandAllNoteGroups,
  onDeleteNoteGroup,
  onAddSelectionToNoteGroup,
  onRemoveSelectionFromNoteGroup,
  onSelectNotesForGroup,
  showAutoTagGroups,
  onToggleAutoTagGroups,
  autoTagGroups,
  onFocusBounds,
  controlsMode,
}: WallDetailsSidebarProps) => {
  if (presentationMode || !showDetailsPanel) {
    return null;
  }

  return (
    <WallDetailsPanel
      isCompactLayout={isCompactLayout}
      rightPanelOpen={rightPanelOpen}
      onClose={onClose}
    >
      <WallDetailsContent
        controlsMode={controlsMode}
        templateType={templateType}
        templateOptions={TEMPLATE_TYPES}
        isTimeLocked={isTimeLocked}
        onTemplateTypeChange={onTemplateTypeChange}
        onApplyTemplate={onApplyTemplate}
        tagInput={tagInput}
        onTagInputChange={onTagInputChange}
        onAddTag={onAddTag}
        selectedNoteId={selectedNoteId}
        selectedNoteIdsCount={selectedNoteIdsCount}
        displayedTags={displayedTags}
        onRemoveTag={onRemoveTag}
        detailsSectionsOpen={detailsSectionsOpen}
        onToggleDetailsSection={onToggleDetailsSection}
        timelineEntriesCount={timelineEntriesCount}
        visibleNotesCount={visibleNotesCount}
        historyUndoDepth={historyUndoDepth}
        historyRedoDepth={historyRedoDepth}
        notes={notes}
        onJumpStale={onJumpStale}
        onJumpPriority={onJumpPriority}
        onClearHistory={onClearHistory}
        recallQuery={recallQuery}
        onRecallQueryChange={onRecallQueryChange}
        recallZoneId={recallZoneId}
        onRecallZoneIdChange={onRecallZoneIdChange}
        recallTag={recallTag}
        onRecallTagChange={onRecallTagChange}
        recallDateFilter={recallDateFilter}
        onRecallDateFilterChange={onRecallDateFilterChange}
        visibleZones={visibleZones}
        availableRecallTags={availableRecallTags}
        onSaveRecallSearch={onSaveRecallSearch}
        onClearRecallFilters={onClearRecallFilters}
        savedRecallSearches={savedRecallSearches}
        onApplySavedRecallSearch={onApplySavedRecallSearch}
        onDeleteSavedRecallSearch={onDeleteSavedRecallSearch}
        groupLabelInput={groupLabelInput}
        onGroupLabelInputChange={onGroupLabelInputChange}
        selectedZone={selectedZone}
        selectedGroup={selectedGroup}
        selectedZoneId={selectedZoneId}
        zoneGroups={zoneGroups}
        onCreateGroupFromSelectedZone={onCreateGroupFromSelectedZone}
        onAssignZoneToGroup={onAssignZoneToGroup}
        onSelectGroup={onSelectGroup}
        onToggleGroupCollapse={onToggleGroupCollapse}
        onCollapseAllGroups={onCollapseAllGroups}
        onExpandAllGroups={onExpandAllGroups}
        onDeleteGroup={onDeleteGroup}
        onClearNoteSelection={onClearNoteSelection}
        noteGroupLabelInput={noteGroupLabelInput}
        onNoteGroupLabelInputChange={onNoteGroupLabelInputChange}
        selectedNoteGroup={selectedNoteGroup}
        activeSelectedNoteIds={activeSelectedNoteIds}
        noteGroups={noteGroups}
        onCreateGroupFromSelection={onCreateGroupFromSelection}
        onSelectNoteGroup={onSelectNoteGroup}
        onToggleNoteGroupCollapse={onToggleNoteGroupCollapse}
        onCollapseAllNoteGroups={onCollapseAllNoteGroups}
        onExpandAllNoteGroups={onExpandAllNoteGroups}
        onDeleteNoteGroup={onDeleteNoteGroup}
        onAddSelectionToNoteGroup={onAddSelectionToNoteGroup}
        onRemoveSelectionFromNoteGroup={onRemoveSelectionFromNoteGroup}
        onSelectNotesForGroup={onSelectNotesForGroup}
        showAutoTagGroups={showAutoTagGroups}
        onToggleAutoTagGroups={onToggleAutoTagGroups}
        autoTagGroups={autoTagGroups}
        onFocusBounds={onFocusBounds}
      />
    </WallDetailsPanel>
  );
};
