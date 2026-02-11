"use client";

import Fuse from "fuse.js";
import { useEffect, useMemo, useRef, useState } from "react";

import { ModalShell } from "@/components/ui/ModalShell";
import { TextField } from "@/components/ui/Field";
import type { Note } from "@/features/wall/types";

type SearchPaletteProps = {
  open: boolean;
  notes: Note[];
  onClose: () => void;
  onSelect: (noteId: string) => void;
};

export const SearchPalette = ({ open, notes, onClose, onSelect }: SearchPaletteProps) => {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

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
  const safeActiveIndex = results.length === 0 ? -1 : Math.min(activeIndex, results.length - 1);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Search Notes"
      description="Find notes by text and tags."
      maxWidthClassName="max-w-2xl"
      position="top"
    >
      <TextField
        ref={inputRef}
        autoFocus
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          if (activeIndex !== 0) {
            setActiveIndex(0);
          }
        }}
        onKeyDown={(event) => {
          if (results.length === 0) {
            return;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((previous) => Math.min(previous + 1, results.length - 1));
            return;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((previous) => Math.max(previous - 1, 0));
            return;
          }
          if (event.key === "Enter") {
            event.preventDefault();
            const selected = results[safeActiveIndex]?.item;
            if (selected) {
              onSelect(selected.id);
              onClose();
            }
          }
        }}
        placeholder="Search notes by text..."
        className="px-4 py-3"
      />
      <div className="mt-3 max-h-96 overflow-auto rounded-[var(--radius-lg)] border border-[var(--color-border-muted)]">
        {results.length === 0 && <p className="px-4 py-3 text-sm text-[var(--color-text-muted)]">No matches.</p>}
        {results.map(({ item }, index) => (
          <button
            type="button"
            key={item.id}
            onClick={() => {
              onSelect(item.id);
              onClose();
            }}
            onMouseEnter={() => setActiveIndex(index)}
            className={`block w-full border-b border-[var(--color-border-muted)] px-4 py-3 text-left transition-colors last:border-b-0 ${
              index === safeActiveIndex ? "bg-[var(--color-surface-muted)]" : "hover:bg-[var(--color-surface-muted)]"
            }`}
          >
            <p className="line-clamp-1 text-sm font-medium text-[var(--color-text)]">
              {item.text.trim().split("\n")[0] || "Untitled note"}
            </p>
            <p className="line-clamp-2 text-xs text-[var(--color-text-muted)]">{item.text || "(empty note)"}</p>
            {item.tags.length > 0 && (
              <p className="mt-1 line-clamp-1 text-[11px] text-[var(--color-text-muted)]">#{item.tags.join(" #")}</p>
            )}
          </button>
        ))}
      </div>
    </ModalShell>
  );
};
