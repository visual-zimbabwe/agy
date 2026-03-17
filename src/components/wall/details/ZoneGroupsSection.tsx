"use client";

import {
  detailButton,
  detailField,
  detailInsetCard,
  detailMutedPanel,
  detailSectionCard,
  detailSectionDescription,
  detailSectionHeading,
  detailSectionToggle,
} from "@/components/wall/details/detailSectionStyles";
import type { ZoneGroupsSectionProps } from "@/components/wall/details/DetailsSectionTypes";

export const ZoneGroupsSection = ({
  detailsSectionsOpen,
  onToggleDetailsSection,
  groupLabelInput,
  onGroupLabelInputChange,
  selectedZone,
  selectedGroup,
  selectedZoneId,
  zoneGroups,
  isTimeLocked,
  onCreateGroupFromSelectedZone,
  onAssignZoneToGroup,
  onSelectGroup,
  onToggleGroupCollapse,
  onCollapseAllGroups,
  onExpandAllGroups,
  onDeleteGroup,
  onClearNoteSelection,
}: ZoneGroupsSectionProps) => {
  return (
    <div className={detailSectionCard}>
      <button
        type="button"
        onClick={() => onToggleDetailsSection("zoneGroups")}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <h3 className={detailSectionHeading}>Zones</h3>
          <p className={detailSectionDescription}>Primary wall structure for grouping notes, collapsing workstreams, and controlling visibility.</p>
        </div>
        <span className={detailSectionToggle}>{detailsSectionsOpen.zoneGroups ? "Hide" : "Show"}</span>
      </button>
      {detailsSectionsOpen.zoneGroups && (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCollapseAllGroups}
              disabled={isTimeLocked || zoneGroups.length === 0}
              className={detailButton}
            >
              Collapse All
            </button>
            <button
              type="button"
              onClick={onExpandAllGroups}
              disabled={isTimeLocked || zoneGroups.length === 0}
              className={detailButton}
            >
              Expand All
            </button>
          </div>

          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <input
              value={groupLabelInput}
              onChange={(event) => onGroupLabelInputChange(event.target.value)}
              className={detailField}
              placeholder="Group name"
            />
            <button
              type="button"
              onClick={onCreateGroupFromSelectedZone}
              disabled={!selectedZoneId || isTimeLocked}
              className={detailButton}
            >
              Group Zone
            </button>
          </div>

          {selectedZone && (
            <div className="mt-3">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Selected Zone Group</label>
              <select
                value={selectedZone.groupId ?? ""}
                onChange={(event) => {
                  if (isTimeLocked) {
                    return;
                  }
                  onAssignZoneToGroup(selectedZone.id, event.target.value || undefined);
                }}
                disabled={isTimeLocked}
                className={detailField}
              >
                <option value="">No group</option>
                {zoneGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Groups</p>
              <span className="text-[10px] text-[var(--color-text-muted)]">{zoneGroups.length}</span>
            </div>
            <div className="max-h-64 space-y-2 overflow-auto pr-1">
              {zoneGroups.length === 0 && <div className={detailMutedPanel}>No groups yet. Select a zone, name the group, and create the first structural bucket.</div>}
              {zoneGroups.map((group) => (
                <div
                  key={group.id}
                  className={`${detailInsetCard} ${selectedGroup?.id === group.id ? "border-[var(--color-focus)] bg-[color:rgb(2_132_199_/_0.08)]" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (isTimeLocked) {
                          return;
                        }
                        onSelectGroup(group.id);
                        onToggleGroupCollapse(group.id);
                      }}
                      disabled={isTimeLocked}
                      className={detailButton}
                    >
                      {group.collapsed ? "Expand" : "Collapse"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClearNoteSelection();
                        onSelectGroup(group.id);
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-xs font-semibold text-[var(--color-text)]">{group.label}</p>
                      <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">{group.zoneIds.length} zones {group.collapsed ? "collapsed" : "expanded"}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isTimeLocked) {
                          return;
                        }
                        onDeleteGroup(group.id);
                      }}
                      disabled={isTimeLocked}
                      className="text-[10px] font-medium text-[var(--color-danger)]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
