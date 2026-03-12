"use client";

import { detailButton, detailChip, detailField, detailSectionCard, detailSectionTitle } from "@/components/wall/details/detailSectionStyles";

type SelectionTagsSectionProps = {
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onAddTag: () => void;
  selectedNoteId?: string;
  selectedNoteIdsCount: number;
  displayedTags: string[];
  isTimeLocked: boolean;
  onRemoveTag: (tag: string) => void;
};

export const SelectionTagsSection = ({
  tagInput,
  onTagInputChange,
  onAddTag,
  selectedNoteId,
  selectedNoteIdsCount,
  displayedTags,
  isTimeLocked,
  onRemoveTag,
}: SelectionTagsSectionProps) => {
  return (
    <div className={detailSectionCard}>
      <p className={detailSectionTitle}>Selection Tags</p>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={tagInput}
          onChange={(event) => onTagInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAddTag();
            }
          }}
          placeholder={selectedNoteIdsCount > 0 || selectedNoteId ? "add-tag" : "select note first"}
          disabled={selectedNoteIdsCount === 0 && !selectedNoteId ? true : isTimeLocked}
          className={`flex-1 ${detailField}`}
        />
        <button
          type="button"
          onClick={onAddTag}
          disabled={selectedNoteIdsCount === 0 && !selectedNoteId ? true : isTimeLocked}
          className={detailButton}
        >
          Add
        </button>
      </div>
      <div className="mt-2 max-h-28 overflow-auto pr-1">
        <div className="flex flex-wrap gap-1">
          {displayedTags.length === 0 && <span className="text-[11px] text-[var(--color-text-muted)]">No tags on current selection.</span>}
          {displayedTags.map((tag) => (
            <button
              key={`detail-tag-${tag}`}
              type="button"
              onClick={() => onRemoveTag(tag)}
              disabled={isTimeLocked}
              className={detailChip}
              title="Remove tag"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
