"use client";

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
    <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600">Selection Tags</p>
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
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs disabled:opacity-40"
        />
        <button
          type="button"
          onClick={onAddTag}
          disabled={selectedNoteIdsCount === 0 && !selectedNoteId ? true : isTimeLocked}
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs disabled:opacity-40"
        >
          Add
        </button>
      </div>
      <div className="mt-2 max-h-28 overflow-auto pr-1">
        <div className="flex flex-wrap gap-1">
          {displayedTags.length === 0 && <span className="text-[11px] text-zinc-500">No tags on current selection.</span>}
          {displayedTags.map((tag) => (
            <button
              key={`detail-tag-${tag}`}
              type="button"
              onClick={() => onRemoveTag(tag)}
              disabled={isTimeLocked}
              className="rounded-full border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-700"
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
