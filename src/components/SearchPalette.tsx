"use client";

import Fuse from "fuse.js";
import { useEffect, useMemo, useRef, useState } from "react";

import { getEisenhowerPreview } from "@/features/wall/eisenhower";
import { isPrivateNote, privateNoteTitle } from "@/features/wall/private-notes";
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
        keys: [
          "text",
          "quoteAuthor",
          "quoteSource",
          "canon.title",
          "canon.statement",
          "canon.interpretation",
          "canon.example",
          "canon.source",
          "canon.items.title",
          "canon.items.text",
          "canon.items.interpretation",
          "tags",
          "vocabulary.word",
          "vocabulary.meaning",
          "vocabulary.sourceContext",
          "eisenhower.displayDate",
          "eisenhower.quadrants.doFirst.title",
          "eisenhower.quadrants.doFirst.content",
          "eisenhower.quadrants.schedule.title",
          "eisenhower.quadrants.schedule.content",
          "eisenhower.quadrants.delegate.title",
          "eisenhower.quadrants.delegate.content",
          "eisenhower.quadrants.delete.title",
          "eisenhower.quadrants.delete.content",
        ],
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
    const searchableNotes = notes.filter((note) => !isPrivateNote(note));
    if (!normalizedQuery) {
      return searchableNotes.slice(0, 12);
    }
    return notesFuse.search(normalizedQuery, { limit: 20 }).map((result) => result.item).filter((note) => !isPrivateNote(note));
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

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120]" role="dialog" aria-modal="true" aria-label="Search notes and commands">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-[rgba(28,28,25,0.18)] backdrop-blur-[2px]" aria-label="Close search" />
      <div className="pointer-events-none absolute inset-x-0 top-[10vh] flex justify-center px-4">
        <div className="pointer-events-auto w-full max-w-[52rem] overflow-hidden rounded-[32px] border border-[#ede3d8] bg-[rgba(252,249,244,0.96)] shadow-[0_30px_80px_rgba(28,28,25,0.12)] backdrop-blur-2xl">
          <div className="border-b border-[#efe5da] px-5 pb-4 pt-5 sm:px-6">
            <div className="flex items-center gap-3 rounded-[22px] bg-white/78 px-4 py-3 shadow-[inset_0_0_0_1px_rgba(223,192,184,0.4)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-[#7b7067]">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M16 16L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
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
                placeholder='Search notes, tags, metadata, or type "/" for commands'
                className="min-w-0 flex-1 border-none bg-transparent text-[15px] text-[#1c1c19] outline-none placeholder:text-[#8d8278]"
              />
              <span className="hidden rounded-full bg-[#f4ede4] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8e8174] md:inline-flex">Esc</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[#887c70]">
              <span className="rounded-full bg-[#f4ede4] px-2.5 py-1 font-semibold">Search notes + actions</span>
              <span>`Ctrl/Cmd + K` opens this palette.</span>
              <span>Use `/` to filter commands only.</span>
            </div>
          </div>

          <div className="max-h-[min(65vh,44rem)] overflow-y-auto px-3 pb-3 pt-2 sm:px-4">
            {results.length === 0 ? <p className="px-3 py-8 text-center text-sm text-[#8d8278]">No matches.</p> : null}
            {commandResults.length > 0 ? <SectionLabel label="Commands" /> : null}
            {results.map((result, index) => {
              if (index === commandResults.length && noteResults.length > 0) {
                return (
                  <div key="notes-group-start">
                    <SectionLabel label="Notes" />
                    {renderResult(result, index)}
                  </div>
                );
              }
              return renderResult(result, index);
            })}
          </div>
        </div>
      </div>
    </div>
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
          className={`mb-1 block w-full rounded-[22px] px-4 py-3 text-left transition ${
            index === safeActiveIndex ? "bg-[#f4ede4] shadow-[inset_0_0_0_1px_rgba(163,56,24,0.08)]" : "hover:bg-white/86"
          } disabled:cursor-not-allowed disabled:opacity-45`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="line-clamp-1 text-sm font-semibold text-[#1c1c19]">{command.label}</p>
            {command.shortcut ? (
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a7f73] shadow-[inset_0_0_0_1px_rgba(223,192,184,0.4)]">
                {command.shortcut}
              </span>
            ) : null}
          </div>
          {command.description ? <p className="mt-1 line-clamp-2 text-xs text-[#766b61]">{command.description}</p> : null}
        </button>
      );
    }

    const note = result.note;
    const noteTitle = isPrivateNote(note)
      ? privateNoteTitle(note)
      : note.noteKind === "canon"
        ? note.canon?.title?.trim() || note.text.trim().split("\n")[0]
        : note.text.trim().split("\n")[0];
    const notePreview =
      note.noteKind === "canon"
        ? note.canon?.mode === "list"
          ? note.canon.items
              .filter((item) => item.title.trim() || item.text.trim())
              .slice(0, 2)
              .map((item, entryIndex) => `${entryIndex + 1}. ${item.title.trim() || item.text.trim() || "Item"}`)
              .join(" ")
          : [note.canon?.statement, note.canon?.interpretation].filter(Boolean).join(" ")
        : note.noteKind === "eisenhower"
          ? getEisenhowerPreview(note)
          : isPrivateNote(note)
            ? "Protected content is hidden from search results."
            : note.text;

    return (
      <button
        type="button"
        key={result.id}
        onClick={() => {
          onSelect(note.id);
          onClose();
        }}
        onMouseEnter={() => setActiveIndex(index)}
        className={`mb-1 block w-full rounded-[22px] px-4 py-3 text-left transition ${
          index === safeActiveIndex ? "bg-[#f4ede4] shadow-[inset_0_0_0_1px_rgba(77,99,86,0.1)]" : "hover:bg-white/86"
        }`}
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="line-clamp-1 font-[Newsreader] text-[1.35rem] italic leading-[1.05] text-[#1c1c19]">{noteTitle || "Untitled note"}</p>
            {(note.quoteAuthor || note.quoteSource) ? (
              <p className="mt-1 line-clamp-1 text-[11px] uppercase tracking-[0.12em] text-[#8d8278]">{[note.quoteAuthor, note.quoteSource].filter(Boolean).join(" • ")}</p>
            ) : null}
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7c7065] shadow-[inset_0_0_0_1px_rgba(223,192,184,0.36)]">
            {note.noteKind === "quote" ? "Quote" : note.noteKind === "canon" ? "Canon" : note.noteKind === "eisenhower" ? "Matrix" : note.noteKind === "web-bookmark" ? "Bookmark" : "Note"}
          </span>
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-[#5d554e]">{notePreview || "(empty note)"}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#8b7e72]">
          {note.noteKind === "eisenhower" && note.eisenhower?.displayDate ? <span>{note.eisenhower.displayDate}</span> : null}
          {note.tags.length > 0 ? <span>#{note.tags.join(" #")}</span> : null}
        </div>
      </button>
    );
  }
};

const SectionLabel = ({ label }: { label: string }) => (
  <p className="px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8f8478]">{label}</p>
);
