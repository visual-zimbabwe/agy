"use client";

import Fuse from "fuse.js";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import type { CommandPaletteCommand } from "@/components/SearchPalette";
import { getEisenhowerPreview } from "@/features/wall/eisenhower";
import {
  commandMatchesToolFilters,
  matchesWallOmnibarNoteResult,
  omnibarNoteKindDefinitions,
  omnibarStateDefinitions,
  omnibarToolDefinitions,
  parseWallOmnibarQuery,
  type OmnibarToken,
} from "@/features/wall/omnibar";
import { privateNoteTitle } from "@/features/wall/private-notes";
import type { Note } from "@/features/wall/types";

type WallSearchDockProps = {
  open: boolean;
  query: string;
  notes: Note[];
  commands: CommandPaletteCommand[];
  availableTags: string[];
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  onQueryChange: (value: string) => void;
  onSelectNote: (noteId: string) => void;
  onToggleTools: () => void;
  onToggleDetails: () => void;
  toolsOpen: boolean;
  detailsOpen: boolean;
  hidden?: boolean;
};

type OmnibarSuggestion = {
  id: string;
  label: string;
  description: string;
  value: string;
};

type OmnibarItem =
  | { id: string; kind: "suggestion"; suggestion: OmnibarSuggestion }
  | { id: string; kind: "command"; command: CommandPaletteCommand }
  | { id: string; kind: "note"; note: Note };

const actionButtonClassName =
  "inline-flex items-center justify-center rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f675f] transition hover:bg-[#1c1c19]/[0.06] hover:text-[#1c1c19] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a33818]/30";

const replaceTrailingFragment = (query: string, replacement: string) => {
  const next = query.endsWith(" ") || !query ? `${query}${replacement} ` : `${query.replace(/\S+$/, "")}${replacement} `;
  return next.replace(/\s+/g, " ").trimStart();
};

const applyTokenRemoval = (query: string, token: OmnibarToken) =>
  query
    .replace(token.raw, "")
    .replace(/\s+/g, " ")
    .trim();

const getNoteKindLabel = (note: Note) =>
  omnibarNoteKindDefinitions.find((definition) => definition.value === (note.noteKind ?? "standard"))?.label ?? "Note";

export const WallSearchDock = ({
  open,
  query,
  notes,
  commands,
  availableTags,
  onOpenSearch,
  onCloseSearch,
  onQueryChange,
  onSelectNote,
  onToggleTools,
  onToggleDetails,
  toolsOpen,
  detailsOpen,
  hidden = false,
}: WallSearchDockProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const deferredQuery = useDeferredValue(query);
  const parsedQuery = useMemo(() => parseWallOmnibarQuery(deferredQuery), [deferredQuery]);
  const activeFragment = query.endsWith(" ") ? "" : (query.match(/\S+$/)?.[0] ?? "");

  const filteredCommands = useMemo(
    () => commands.filter((command) => commandMatchesToolFilters(command, parsedQuery.toolFilters)),
    [commands, parsedQuery.toolFilters],
  );
  const filteredNotes = useMemo(
    () => notes.filter((note) => matchesWallOmnibarNoteResult(note, parsedQuery)),
    [notes, parsedQuery],
  );

  const commandsFuse = useMemo(
    () =>
      new Fuse(filteredCommands, {
        keys: ["label", "description", "keywords"],
        threshold: 0.32,
        ignoreLocation: true,
      }),
    [filteredCommands],
  );
  const notesFuse = useMemo(
    () =>
      new Fuse(filteredNotes, {
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
    [filteredNotes],
  );

  const suggestions = useMemo<OmnibarSuggestion[]>(() => {
    const trimmedFragment = activeFragment.trim().toLowerCase();
    const defaultSuggestions: OmnibarSuggestion[] = [
      { id: "starter-tag", label: "tag:", description: "Filter by note tag.", value: "tag:" },
      { id: "starter-type", label: "type:", description: "Filter by note type.", value: "type:" },
      { id: "starter-is", label: "is:", description: "Filter by pinned or highlighted notes.", value: "is:" },
      { id: "starter-tool", label: "tool:", description: "Focus wall actions and panels.", value: "tool:" },
    ];

    if (!trimmedFragment) {
      return [
        ...defaultSuggestions,
        ...availableTags.slice(0, 4).map((tag) => ({
          id: `tag-${tag}`,
          label: `tag:${tag}`,
          description: `Filter to #${tag}.`,
          value: `tag:${tag}`,
        })),
      ].slice(0, 8);
    }

    const tokenMatch = trimmedFragment.match(/^(tag|type|is|tool):(.*)$/);
    if (!tokenMatch) {
      return defaultSuggestions;
    }

    const kind = tokenMatch[1] ?? "";
    const value = tokenMatch[2] ?? "";
    if (kind === "tag") {
      return availableTags
        .filter((tag) => tag.toLowerCase().includes(value))
        .slice(0, 8)
        .map((tag) => ({
          id: `tag-${tag}`,
          label: `tag:${tag}`,
          description: `Filter to #${tag}.`,
          value: `tag:${tag}`,
        }));
    }

    if (kind === "type") {
      return omnibarNoteKindDefinitions
        .filter((definition) => definition.aliases.some((alias) => alias.includes(value)))
        .slice(0, 8)
        .map((definition) => ({
          id: `type-${definition.value}`,
          label: `type:${definition.aliases[0]}`,
          description: `Filter to ${definition.label.toLowerCase()}.`,
          value: `type:${definition.aliases[0]}`,
        }));
    }

    if (kind === "is") {
      return omnibarStateDefinitions
        .filter((definition) => definition.aliases.some((alias) => alias.includes(value)))
        .map((definition) => ({
          id: `is-${definition.value}`,
          label: `is:${definition.aliases[0]}`,
          description: `Show ${definition.label.toLowerCase()} notes only.`,
          value: `is:${definition.aliases[0]}`,
        }));
    }

    return omnibarToolDefinitions
      .filter((definition) => definition.aliases.some((alias) => alias.includes(value)))
      .map((definition) => ({
        id: `tool-${definition.value}`,
        label: `tool:${definition.aliases[0]}`,
        description: `Prioritize ${definition.label.toLowerCase()} actions.`,
        value: `tool:${definition.aliases[0]}`,
      }));
  }, [activeFragment, availableTags]);

  const commandResults = useMemo(() => {
    if (!parsedQuery.searchText) {
      return filteredCommands.slice(0, 8);
    }
    return commandsFuse.search(parsedQuery.searchText, { limit: 10 }).map((result) => result.item);
  }, [commandsFuse, filteredCommands, parsedQuery.searchText]);

  const noteResults = useMemo(() => {
    if (parsedQuery.commandsOnly) {
      return [];
    }
    if (!parsedQuery.searchText) {
      return filteredNotes.slice(0, 10);
    }
    return notesFuse.search(parsedQuery.searchText, { limit: 14 }).map((result) => result.item);
  }, [filteredNotes, notesFuse, parsedQuery.commandsOnly, parsedQuery.searchText]);

  const items = useMemo<OmnibarItem[]>(
    () => [
      ...suggestions.map((suggestion) => ({ id: `suggestion-${suggestion.id}`, kind: "suggestion" as const, suggestion })),
      ...commandResults.map((command) => ({ id: `command-${command.id}`, kind: "command" as const, command })),
      ...noteResults.map((note) => ({ id: `note-${note.id}`, kind: "note" as const, note })),
    ],
    [commandResults, noteResults, suggestions],
  );

  const safeActiveIndex = items.length === 0 ? -1 : Math.min(activeIndex, items.length - 1);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        onCloseSearch();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [onCloseSearch, open]);

  if (hidden) {
    return null;
  }

  return (
    <div ref={containerRef} className="pointer-events-auto absolute bottom-5 left-1/2 z-[34] w-[min(92vw,52rem)] -translate-x-1/2">
      {open ? (
        <div className="mb-3 overflow-hidden rounded-[28px] border border-[#efe6db] bg-[rgba(252,249,244,0.97)] shadow-[0_28px_80px_rgba(28,28,25,0.14)] backdrop-blur-xl">
          <div className="border-b border-[#efe6db] px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[#887c70]">
              <span className="rounded-full bg-[#f4ede4] px-2.5 py-1 font-semibold">Hybrid omnibar</span>
              <span>Use `tag:`, `type:`, `is:`, or `tool:` tokens.</span>
              <span>`/` still limits results to actions.</span>
            </div>
            {parsedQuery.tokens.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {parsedQuery.tokens.map((token, index) => (
                  <button
                    type="button"
                    key={`${token.raw}-${index}`}
                    onClick={() => onQueryChange(applyTokenRemoval(query, token))}
                    className="inline-flex items-center gap-2 rounded-full bg-[#f4ede4] px-3 py-1.5 text-xs text-[#5e544b] transition hover:bg-[#eadfce]"
                    title={`Remove ${token.raw}`}
                  >
                    <span className="font-semibold uppercase tracking-[0.12em] text-[#8a7d70]">{token.kind}</span>
                    <span>{token.label}</span>
                    <span aria-hidden="true">x</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="max-h-[min(46vh,34rem)] overflow-y-auto px-3 py-3 sm:px-4">
            {items.length === 0 ? <p className="px-3 py-6 text-sm text-[#8d8278]">No omnibar matches.</p> : null}
            {suggestions.length > 0 ? <SectionLabel label="Suggestions" /> : null}
            {items.map((item, index) => {
              if (index === suggestions.length && commandResults.length > 0) {
                return (
                  <div key="commands-group-start">
                    <SectionLabel label="Actions" />
                    {renderItem(item, index)}
                  </div>
                );
              }
              if (index === suggestions.length + commandResults.length && noteResults.length > 0) {
                return (
                  <div key="notes-group-start">
                    <SectionLabel label="Notes" />
                    {renderItem(item, index)}
                  </div>
                );
              }
              return renderItem(item, index);
            })}
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-2 rounded-[22px] border border-[#efe6db] bg-[rgba(252,249,244,0.92)] px-3 py-2 shadow-[0_18px_50px_rgba(28,28,25,0.08)] backdrop-blur-xl">
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full bg-white/78 px-4 py-3 shadow-[inset_0_0_0_1px_rgba(223,192,184,0.42)] transition focus-within:bg-white">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f4ede3] text-[#7f7369]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M16 16L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onFocus={onOpenSearch}
            onChange={(event) => {
              if (!open) {
                onOpenSearch();
              }
              onQueryChange(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" && items.length > 0) {
                event.preventDefault();
                setActiveIndex((previous) => Math.min(previous + 1, items.length - 1));
                return;
              }
              if (event.key === "ArrowUp" && items.length > 0) {
                event.preventDefault();
                setActiveIndex((previous) => Math.max(previous - 1, 0));
                return;
              }
              if (event.key === "Enter") {
                const active = items[safeActiveIndex] ?? items[0];
                if (!active) {
                  return;
                }
                event.preventDefault();
                activateItem(active);
                return;
              }
              if (event.key === "Escape") {
                event.preventDefault();
                if (query.trim()) {
                  onQueryChange("");
                } else {
                  onCloseSearch();
                }
              }
            }}
            placeholder="Search notes or type tag:, type:, is:, tool:"
            className="min-w-0 flex-1 border-none bg-transparent text-sm text-[#1c1c19] outline-none placeholder:text-[#8d8278]"
            aria-label="Wall omnibar"
          />
          <span className="hidden rounded-full bg-[#f3eee7] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a7c6f] md:inline-flex">
            Ctrl/Cmd + K
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleTools}
          className={`${actionButtonClassName} ${toolsOpen ? "bg-[#a33818] text-white hover:bg-[#8d2f13] hover:text-white" : ""}`}
        >
          Tools
        </button>
        <button
          type="button"
          onClick={onToggleDetails}
          className={`${actionButtonClassName} ${detailsOpen ? "bg-[#4d6356] text-white hover:bg-[#425649] hover:text-white" : ""}`}
        >
          Details
        </button>
      </div>
    </div>
  );

  function activateItem(item: OmnibarItem) {
    if (item.kind === "suggestion") {
      onQueryChange(replaceTrailingFragment(query, item.suggestion.value));
      onOpenSearch();
      return;
    }
    if (item.kind === "command") {
      if (!item.command.disabled) {
        item.command.onSelect();
        onCloseSearch();
      }
      return;
    }
    onSelectNote(item.note.id);
    onCloseSearch();
  }

  function renderItem(item: OmnibarItem, index: number) {
    if (item.kind === "suggestion") {
      return (
        <button
          type="button"
          key={item.id}
          onClick={() => activateItem(item)}
          onMouseEnter={() => setActiveIndex(index)}
          className={`mb-1 block w-full rounded-[20px] px-4 py-3 text-left transition ${
            index === safeActiveIndex ? "bg-[#f4ede4]" : "hover:bg-white/86"
          }`}
        >
          <p className="text-sm font-semibold text-[#1c1c19]">{item.suggestion.label}</p>
          <p className="mt-1 text-xs text-[#766b61]">{item.suggestion.description}</p>
        </button>
      );
    }

    if (item.kind === "command") {
      return (
        <button
          type="button"
          key={item.id}
          disabled={item.command.disabled}
          onClick={() => activateItem(item)}
          onMouseEnter={() => setActiveIndex(index)}
          className={`mb-1 block w-full rounded-[20px] px-4 py-3 text-left transition ${
            index === safeActiveIndex ? "bg-[#f4ede4]" : "hover:bg-white/86"
          } disabled:cursor-not-allowed disabled:opacity-45`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="line-clamp-1 text-sm font-semibold text-[#1c1c19]">{item.command.label}</p>
            {item.command.shortcut ? (
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a7f73] shadow-[inset_0_0_0_1px_rgba(223,192,184,0.4)]">
                {item.command.shortcut}
              </span>
            ) : null}
          </div>
          {item.command.description ? <p className="mt-1 line-clamp-2 text-xs text-[#766b61]">{item.command.description}</p> : null}
        </button>
      );
    }

    const note = item.note;
    const noteTitle = note.noteKind === "canon" ? note.canon?.title?.trim() || note.text.trim().split("\n")[0] : note.text.trim().split("\n")[0] || privateNoteTitle(note);
    const notePreview =
      note.noteKind === "canon"
        ? note.canon?.mode === "list"
          ? note.canon.items
              .filter((entry) => entry.title.trim() || entry.text.trim())
              .slice(0, 2)
              .map((entry, entryIndex) => `${entryIndex + 1}. ${entry.title.trim() || entry.text.trim() || "Item"}`)
              .join(" ")
          : [note.canon?.statement, note.canon?.interpretation].filter(Boolean).join(" ")
        : note.noteKind === "eisenhower"
          ? getEisenhowerPreview(note)
          : note.text;

    return (
      <button
        type="button"
        key={item.id}
        onClick={() => activateItem(item)}
        onMouseEnter={() => setActiveIndex(index)}
        className={`mb-1 block w-full rounded-[20px] px-4 py-3 text-left transition ${
          index === safeActiveIndex ? "bg-[#f4ede4]" : "hover:bg-white/86"
        }`}
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="line-clamp-1 font-[Newsreader] text-[1.25rem] italic leading-[1.05] text-[#1c1c19]">{noteTitle || "Untitled note"}</p>
            {(note.quoteAuthor || note.quoteSource) ? (
              <p className="mt-1 line-clamp-1 text-[11px] uppercase tracking-[0.12em] text-[#8d8278]">{[note.quoteAuthor, note.quoteSource].filter(Boolean).join(" • ")}</p>
            ) : null}
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7c7065] shadow-[inset_0_0_0_1px_rgba(223,192,184,0.36)]">
            {getNoteKindLabel(note)}
          </span>
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-[#5d554e]">{notePreview || "(empty note)"}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#8b7e72]">
          {note.tags.length > 0 ? <span>#{note.tags.join(" #")}</span> : null}
          {note.pinned ? <span>Pinned</span> : null}
          {note.highlighted ? <span>Highlighted</span> : null}
        </div>
      </button>
    );
  }
};

const SectionLabel = ({ label }: { label: string }) => (
  <p className="px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8f8478]">{label}</p>
);



