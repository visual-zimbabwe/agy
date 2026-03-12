"use client";

import {
  detailButton,
  detailField,
  detailInsetCard,
  detailSectionCard,
  detailSectionDescription,
  detailSectionHeading,
  detailSectionToggle,
} from "@/components/wall/details/detailSectionStyles";
import type { RecallSectionProps } from "@/components/wall/details/DetailsSectionTypes";

export const RecallSection = ({
  detailsSectionsOpen,
  onToggleDetailsSection,
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
}: RecallSectionProps) => {
  return (
    <div className={detailSectionCard}>
      <button
        type="button"
        onClick={() => onToggleDetailsSection("recall")}
        className="flex w-full items-center justify-between text-left"
      >
        <h3 className={detailSectionHeading}>Recall</h3>
        <span className={detailSectionToggle}>{detailsSectionsOpen.recall ? "Hide" : "Show"}</span>
      </button>
      {detailsSectionsOpen.recall && (
        <>
          <p className={detailSectionDescription}>Filter notes by query, zone, tag, and recency. Save frequent searches.</p>
          <input
            value={recallQuery}
            onChange={(event) => onRecallQueryChange(event.target.value)}
            placeholder="Find text or #tag..."
            className={`mt-2 ${detailField}`}
          />
          <div className="mt-2 min-w-0 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              value={recallZoneId}
              onChange={(event) => onRecallZoneIdChange(event.target.value)}
              className={`col-span-1 truncate sm:col-span-1 ${detailField}`}
            >
              <option value="">All zones</option>
              {visibleZones.map((zone) => (
                <option key={`filter-zone-${zone.id}`} value={zone.id}>
                  {zone.label}
                </option>
              ))}
            </select>
            <select
              value={recallTag}
              onChange={(event) => onRecallTagChange(event.target.value)}
              className={`col-span-1 truncate sm:col-span-1 ${detailField}`}
            >
              <option value="">All tags</option>
              {availableRecallTags.map((tag) => (
                <option key={`filter-tag-${tag}`} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
            <select
              value={recallDateFilter}
              onChange={(event) => onRecallDateFilterChange(event.target.value as typeof recallDateFilter)}
              className={`col-span-1 truncate sm:col-span-2 ${detailField}`}
            >
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="7d">Last 7d</option>
              <option value="30d">Last 30d</option>
            </select>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={onSaveRecallSearch} className={detailButton}>
              Save Search
            </button>
            <button type="button" onClick={onClearRecallFilters} className={detailButton}>
              Clear Filters
            </button>
          </div>
          {savedRecallSearches.length > 0 && (
            <div className="mt-2 max-h-24 space-y-1 overflow-auto pr-1">
              {savedRecallSearches.map((item) => (
                <div key={item.id} className={`${detailInsetCard} flex items-center gap-1`}>
                  <button
                    type="button"
                    onClick={() => onApplySavedRecallSearch(item)}
                    className="min-w-0 flex-1 truncate text-left text-[11px] text-[var(--color-text)]"
                  >
                    {item.name}
                  </button>
                  <button type="button" onClick={() => onDeleteSavedRecallSearch(item.id)} className="text-[10px] text-[var(--color-danger)]">
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
