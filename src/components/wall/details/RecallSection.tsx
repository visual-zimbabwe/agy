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
import { useWallChrome } from "@/components/wall/session/wall-chrome-context";
import { useWallDetails } from "@/components/wall/session/wall-details-context";
import { useWallLayout } from "@/components/wall/session/wall-layout-context";

export const RecallSection = () => {
  const { detailsSectionsOpen } = useWallLayout();
  const { onToggleDetailsSection } = useWallChrome();
  const {
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
  } = useWallDetails();

  return (
    <div className={detailSectionCard}>
      <button
        type="button"
        onClick={() => onToggleDetailsSection("recall")}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <h3 className={detailSectionHeading}>Recall</h3>
          <p className={detailSectionDescription}>Search notes, filter by zone or tag, and save repeatable recall workflows.</p>
        </div>
        <span className={detailSectionToggle}>{detailsSectionsOpen.recall ? "Hide" : "Show"}</span>
      </button>
      {detailsSectionsOpen.recall && (
        <>
          <div className="mt-3 grid gap-2">
            <input
              className={detailField}
              type="search"
              value={recallQuery}
              onChange={(event) => onRecallQueryChange(event.target.value)}
              placeholder="Search notes..."
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <select className={detailField} value={recallZoneId} onChange={(event) => onRecallZoneIdChange(event.target.value)}>
                <option value="">All zones</option>
                {visibleZones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.label}
                  </option>
                ))}
              </select>
              <select className={detailField} value={recallTag} onChange={(event) => onRecallTagChange(event.target.value)}>
                <option value="">All tags</option>
                {availableRecallTags.map((tag) => (
                  <option key={tag} value={tag}>
                    #{tag}
                  </option>
                ))}
              </select>
            </div>
            <select className={detailField} value={recallDateFilter} onChange={(event) => onRecallDateFilterChange(event.target.value as typeof recallDateFilter)}>
              <option value="all">Any time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={detailButton} onClick={onSaveRecallSearch}>
              Save search
            </button>
            <button type="button" className={detailButton} onClick={onClearRecallFilters}>
              Clear filters
            </button>
          </div>
          {savedRecallSearches.length > 0 ? (
            <div className={detailMutedPanel}>
              <p className="text-xs font-medium text-[var(--color-text-muted)]">Saved searches</p>
              <div className="mt-2 space-y-2">
                {savedRecallSearches.map((item) => (
                  <div key={item.id} className={detailInsetCard}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text)]">{item.name}</p>
                        <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                          {item.query || "All notes"}
                          {item.zoneId ? ` · zone` : ""}
                          {item.tag ? ` · #${item.tag}` : ""}
                          {item.dateFilter !== "all" ? ` · ${item.dateFilter}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button type="button" className={detailButton} onClick={() => onApplySavedRecallSearch(item)}>
                          Apply
                        </button>
                        <button type="button" className={detailButton} onClick={() => onDeleteSavedRecallSearch(item.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};
