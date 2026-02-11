"use client";

import Fuse from "fuse.js";
import { useEffect, useMemo, useState } from "react";

import type { Note } from "@/features/wall/types";

type SearchPaletteProps = {
  open: boolean;
  notes: Note[];
  onClose: () => void;
  onSelect: (noteId: string) => void;
};

export const SearchPalette = ({ open, notes, onClose, onSelect }: SearchPaletteProps) => {
  const [query, setQuery] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(notes, {
        keys: ["text", "tags"],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [notes],
  );

  const results = useMemo(() => {
    if (!query.trim()) {
      return notes.slice(0, 12).map((note) => ({ item: note }));
    }

    return fuse.search(query, { limit: 20 });
  }, [fuse, notes, query]);

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/35 px-4 pt-24 backdrop-blur-[1px]">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl">
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search notes by text..."
          className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none ring-0 focus:border-zinc-500"
        />
        <div className="mt-3 max-h-96 overflow-auto rounded-xl border border-zinc-200">
          {results.length === 0 && <p className="px-4 py-3 text-sm text-zinc-500">No matches.</p>}
          {results.map(({ item }) => (
            <button
              type="button"
              key={item.id}
              onClick={() => {
                onSelect(item.id);
                onClose();
              }}
              className="block w-full border-b border-zinc-100 px-4 py-3 text-left last:border-b-0 hover:bg-zinc-50"
            >
              <p className="line-clamp-1 text-sm font-medium text-zinc-900">
                {item.text.trim().split("\n")[0] || "Untitled note"}
              </p>
              <p className="line-clamp-2 text-xs text-zinc-500">{item.text || "(empty note)"}</p>
              {item.tags.length > 0 && (
                <p className="mt-1 line-clamp-1 text-[11px] text-zinc-500">#{item.tags.join(" #")}</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
