"use client";

import { NOTE_COLORS } from "@/features/wall/constants";

type NoteSwatchesProps = {
  value?: string;
  onSelect: (color: string) => void;
};

export const NoteSwatches = ({ value, onSelect }: NoteSwatchesProps) => {
  return (
    <div className="flex items-center gap-2">
      {NOTE_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Select ${color}`}
          className={`h-6 w-6 rounded-full border transition-transform hover:scale-105 ${
            value === color ? "border-zinc-900" : "border-zinc-300"
          }`}
          style={{ backgroundColor: color }}
          onClick={() => onSelect(color)}
        />
      ))}
    </div>
  );
};
