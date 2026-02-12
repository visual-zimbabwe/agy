"use client";

import type { Note, NoteGroup, TemplateType, Zone, ZoneGroup } from "@/features/wall/types";
import { HistorySection } from "@/components/wall/details/HistorySection";
import { RecallSection } from "@/components/wall/details/RecallSection";
import { SelectionTagsSection } from "@/components/wall/details/SelectionTagsSection";
import { TagGroupsSection } from "@/components/wall/details/TagGroupsSection";
import { type AutoTagGroup, type DetailsSectionKey, type DetailsSectionState, type RecallDateFilter, type SavedRecallSearch } from "@/components/wall/details/DetailsSectionTypes";
import { TemplatesSection } from "@/components/wall/details/TemplatesSection";
import { ZoneGroupsSection } from "@/components/wall/details/ZoneGroupsSection";
import { NoteGroupsSection } from "@/components/wall/details/NoteGroupsSection";

type TemplateOption = {
  value: TemplateType;
  label: string;
};

type WallDetailsContentProps = {
  templateType: TemplateType;
  templateOptions: readonly TemplateOption[];
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
  autoTagGroups: AutoTagGroup[];
  onFocusBounds: (bounds: { x: number; y: number; w: number; h: number }) => void;
};

export const WallDetailsContent = ({
  templateType,
  templateOptions,
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
}: WallDetailsContentProps) => {
  return (
    <>
      <TemplatesSection
        templateType={templateType}
        templateOptions={templateOptions}
        isTimeLocked={isTimeLocked}
        onTemplateTypeChange={onTemplateTypeChange}
        onApplyTemplate={onApplyTemplate}
      />
      <SelectionTagsSection
        tagInput={tagInput}
        onTagInputChange={onTagInputChange}
        onAddTag={onAddTag}
        selectedNoteId={selectedNoteId}
        selectedNoteIdsCount={selectedNoteIdsCount}
        displayedTags={displayedTags}
        isTimeLocked={isTimeLocked}
        onRemoveTag={onRemoveTag}
      />
      <HistorySection
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
      />
      <RecallSection
        detailsSectionsOpen={detailsSectionsOpen}
        onToggleDetailsSection={onToggleDetailsSection}
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
      />
      <ZoneGroupsSection
        detailsSectionsOpen={detailsSectionsOpen}
        onToggleDetailsSection={onToggleDetailsSection}
        groupLabelInput={groupLabelInput}
        onGroupLabelInputChange={onGroupLabelInputChange}
        selectedZone={selectedZone}
        selectedGroup={selectedGroup}
        selectedZoneId={selectedZoneId}
        zoneGroups={zoneGroups}
        isTimeLocked={isTimeLocked}
        onCreateGroupFromSelectedZone={onCreateGroupFromSelectedZone}
        onAssignZoneToGroup={onAssignZoneToGroup}
        onSelectGroup={onSelectGroup}
        onToggleGroupCollapse={onToggleGroupCollapse}
        onCollapseAllGroups={onCollapseAllGroups}
        onExpandAllGroups={onExpandAllGroups}
        onDeleteGroup={onDeleteGroup}
        onClearNoteSelection={onClearNoteSelection}
      />
      <NoteGroupsSection
        detailsSectionsOpen={detailsSectionsOpen}
        onToggleDetailsSection={onToggleDetailsSection}
        noteGroupLabelInput={noteGroupLabelInput}
        onNoteGroupLabelInputChange={onNoteGroupLabelInputChange}
        selectedNoteGroup={selectedNoteGroup}
        activeSelectedNoteIds={activeSelectedNoteIds}
        noteGroups={noteGroups}
        isTimeLocked={isTimeLocked}
        onCreateGroupFromSelection={onCreateGroupFromSelection}
        onSelectNoteGroup={onSelectNoteGroup}
        onToggleNoteGroupCollapse={onToggleNoteGroupCollapse}
        onCollapseAllNoteGroups={onCollapseAllNoteGroups}
        onExpandAllNoteGroups={onExpandAllNoteGroups}
        onDeleteNoteGroup={onDeleteNoteGroup}
        onAddSelectionToNoteGroup={onAddSelectionToNoteGroup}
        onRemoveSelectionFromNoteGroup={onRemoveSelectionFromNoteGroup}
        onSelectNotesForGroup={onSelectNotesForGroup}
      />
      <TagGroupsSection
        detailsSectionsOpen={detailsSectionsOpen}
        onToggleDetailsSection={onToggleDetailsSection}
        showAutoTagGroups={showAutoTagGroups}
        onToggleAutoTagGroups={onToggleAutoTagGroups}
        autoTagGroups={autoTagGroups}
        onFocusBounds={onFocusBounds}
      />
    </>
  );
};
