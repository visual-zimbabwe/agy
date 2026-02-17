"use client";

import Fuse from "fuse.js";
import { useEffect, useMemo, useRef, useState } from "react";

import { ModalShell } from "@/components/ui/ModalShell";
import { TextField } from "@/components/ui/Field";
import type { Note } from "@/features/wall/types";

export type CommandPaletteCommand = {
  id: string;
  label: string;
  description?: string;
  keywords?: string[];
  shortcut?: string;
  disabled?: boolean;
  onSelect: () => void;
};

type SearchPaletteProps = {
  open: boolean;
  notes: Note[];
  commands: CommandPaletteCommand[];
  onClose: () => void;
  onSelect: (noteId: string) => void;
};

type PaletteResult =
  | { id: string; kind: "command"; command: CommandPaletteCommand }
  | { id: string; kind: "note"; note: Note };

export const SearchPalette = ({ open, notes, commands, onClose, onSelect }: SearchPaletteProps) => {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const trimmedQuery = query.trim();
  const commandsOnly = trimmedQuery.startsWith("/");
  const normalizedQuery = commandsOnly ? trimmedQuery.slice(1).trim() : trimmedQuery;

  const notesFuse = useMemo(
    () =>
      new Fuse(notes, {
        keys: ["text", "tags", "vocabulary.word", "vocabulary.meaning", "vocabulary.sourceContext"],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [notes],
  );

  const commandsFuse = useMemo(
    () =>
      new Fuse(commands, {
        keys: ["label", "description", "keywords"],
        threshold: 0.32,
        ignoreLocation: true,
      }),
    [commands],
  );

  const commandResults = useMemo(() => {
    if (!normalizedQuery) {
      return commands.slice(0, 10);
    }
    return commandsFuse.search(normalizedQuery, { limit: 12 }).map((result) => result.item);
  }, [commands, commandsFuse, normalizedQuery]);

  const noteResults = useMemo(() => {
    if (commandsOnly) {
      return [];
    }
    if (!normalizedQuery) {
      return notes.slice(0, 12);
    }
    return notesFuse.search(normalizedQuery, { limit: 20 }).map((result) => result.item);
  }, [commandsOnly, normalizedQuery, notes, notesFuse]);

  const results = useMemo<PaletteResult[]>(
    () => [
      ...commandResults.map((command) => ({ id: `command-${command.id}`, kind: "command" as const, command })),
      ...noteResults.map((note) => ({ id: `note-${note.id}`, kind: "note" as const, note })),
    ],
    [commandResults, noteResults],
  );

  const safeActiveIndex = results.length === 0 ? -1 : Math.min(activeIndex, results.length - 1);

  useEffect(() => {
    if (!open) {
      return;
    }
    setQuery("");
    setActiveIndex(0);
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
      title="Search + Commands"
      description="Search notes and run actions."
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
            const selected = results[safeActiveIndex];
            if (!selected) {
              return;
            }
            if (selected.kind === "command") {
              if (!selected.command.disabled) {
                selected.command.onSelect();
                onClose();
              }
              return;
            }
            onSelect(selected.note.id);
            onClose();
          }
        }}
        placeholder='Search notes or type "/" for commands'
        className="px-4 py-3"
      />
      <p className="mt-2 px-1 text-[11px] text-[var(--color-text-muted)]">
        `Ctrl/Cmd + K` opens this palette. `?` shows all shortcuts.
      </p>
      <div className="mt-3 max-h-96 overflow-auto rounded-[var(--radius-lg)] border border-[var(--color-border-muted)]">
        {results.length === 0 && <p className="px-4 py-3 text-sm text-[var(--color-text-muted)]">No matches.</p>}
        {commandResults.length > 0 && (
          <p className="border-b border-[var(--color-border-muted)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            Commands
          </p>
        )}
        {results.map((result, index) => {
          if (index === commandResults.length && noteResults.length > 0) {
            return (
              <div key="notes-group-start">
                <p className="border-b border-[var(--color-border-muted)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  Notes
                </p>
                {renderResult(result, index)}
              </div>
            );
          }
          return renderResult(result, index);
        })}
      </div>
    </ModalShell>
  );

  function renderResult(result: PaletteResult, index: number) {
          if (result.kind === "command") {
            const command = result.command;
            return (
              <button
                type="button"
                key={result.id}
                disabled={command.disabled}
                onClick={() => {
                  if (command.disabled) {
                    return;
                  }
                  command.onSelect();
                  onClose();
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`block w-full border-b border-[var(--color-border-muted)] px-4 py-3 text-left transition-colors ${
                  index === safeActiveIndex ? "bg-[var(--color-surface-muted)]" : "hover:bg-[var(--color-surface-muted)]"
                } last:border-b-0 disabled:cursor-not-allowed disabled:opacity-45`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="line-clamp-1 text-sm font-medium text-[var(--color-text)]">{command.label}</p>
                  {command.shortcut && (
                    <span className="rounded border border-[var(--color-border-muted)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-text-muted)]">
                      {command.shortcut}
                    </span>
                  )}
                </div>
                {command.description && <p className="line-clamp-1 text-xs text-[var(--color-text-muted)]">{command.description}</p>}
              </button>
            );
          }

          const note = result.note;
          return (
            <button
              type="button"
              key={result.id}
              onClick={() => {
                onSelect(note.id);
                onClose();
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={`block w-full border-b border-[var(--color-border-muted)] px-4 py-3 text-left transition-colors last:border-b-0 ${
                index === safeActiveIndex ? "bg-[var(--color-surface-muted)]" : "hover:bg-[var(--color-surface-muted)]"
              }`}
            >
              <div className="mb-0.5 flex items-center justify-between gap-3">
                <p className="line-clamp-1 text-sm font-medium text-[var(--color-text)]">
                  {note.text.trim().split("\n")[0] || "Untitled note"}
                </p>
                <span className="rounded border border-[var(--color-border-muted)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-muted)]">
                  Note
                </span>
              </div>
              <p className="line-clamp-2 text-xs text-[var(--color-text-muted)]">{note.text || "(empty note)"}</p>
              {note.tags.length > 0 && (
                <p className="mt-1 line-clamp-1 text-[11px] text-[var(--color-text-muted)]">#{note.tags.join(" #")}</p>
              )}
            </button>
          );
  }
};
