"use client";

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
    <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
      <button
        type="button"
        onClick={() => onToggleDetailsSection("zoneGroups")}
        className="flex w-full items-center justify-between text-left"
      >
        <h3 className="text-sm font-semibold text-zinc-900">Zone Groups</h3>
        <span className="text-[10px] text-zinc-500">{detailsSectionsOpen.zoneGroups ? "Hide" : "Show"}</span>
      </button>
      {detailsSectionsOpen.zoneGroups && (
        <>
          <p className="mt-1 text-xs text-zinc-600">Collapse groups to hide grouped zones and their notes.</p>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onCollapseAllGroups}
              disabled={isTimeLocked || zoneGroups.length === 0}
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-700 disabled:opacity-45"
            >
              Collapse All
            </button>
            <button
              type="button"
              onClick={onExpandAllGroups}
              disabled={isTimeLocked || zoneGroups.length === 0}
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-700 disabled:opacity-45"
            >
              Expand All
            </button>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <input
              value={groupLabelInput}
              onChange={(event) => onGroupLabelInputChange(event.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
              placeholder="Group name"
            />
            <button
              type="button"
              onClick={onCreateGroupFromSelectedZone}
              disabled={!selectedZoneId || isTimeLocked}
              className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs disabled:opacity-45"
            >
              Group Zone
            </button>
          </div>

          {selectedZone && (
            <div className="mt-2">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">Selected Zone Group</label>
              <select
                value={selectedZone.groupId ?? ""}
                onChange={(event) => {
                  if (isTimeLocked) {
                    return;
                  }
                  onAssignZoneToGroup(selectedZone.id, event.target.value || undefined);
                }}
                disabled={isTimeLocked}
                className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
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

          <div className="mt-3 max-h-56 space-y-1 overflow-auto pr-1">
            {zoneGroups.length === 0 && <p className="text-xs text-zinc-500">No groups yet.</p>}
            {zoneGroups.map((group) => (
              <div
                key={group.id}
                className={`rounded-lg border px-2 py-2 ${selectedGroup?.id === group.id ? "border-zinc-700 bg-zinc-50" : "border-zinc-200 bg-white"}`}
              >
                <div className="flex items-center gap-2">
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
                    className="rounded-md border border-zinc-300 px-1.5 py-0.5 text-[10px]"
                  >
                    {group.collapsed ? "Expand" : "Collapse"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClearNoteSelection();
                      onSelectGroup(group.id);
                    }}
                    className="min-w-0 flex-1 truncate text-left text-xs font-medium text-zinc-800"
                  >
                    {group.label}
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
                    className="text-[10px] text-red-700"
                  >
                    Delete
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">
                  {group.zoneIds.length} zones {group.collapsed ? "(collapsed)" : "(expanded)"}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
