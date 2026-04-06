import { isPrivateNote } from "@/features/wall/private-notes";
import type { Note } from "@/features/wall/types";

export type OmnibarNoteKind =
  | "standard"
  | "quote"
  | "canon"
  | "journal"
  | "eisenhower"
  | "joker"
  | "throne"
  | "web-bookmark"
  | "apod"
  | "poetry"
  | "image"
  | "file"
  | "audio"
  | "video";

export type OmnibarStateToken = "pinned" | "highlighted";
export type OmnibarToolToken = "tools" | "details" | "capture" | "export" | "timeline" | "view" | "help";

type OmnibarTokenBase<TKind extends string, TValue extends string> = {
  kind: TKind;
  value: TValue;
  raw: `${TKind}:${string}`;
  label: string;
};

export type OmnibarToken =
  | OmnibarTokenBase<"tag", string>
  | OmnibarTokenBase<"type", OmnibarNoteKind>
  | OmnibarTokenBase<"is", OmnibarStateToken>
  | OmnibarTokenBase<"tool", OmnibarToolToken>;

export type ParsedWallOmnibarQuery = {
  raw: string;
  text: string;
  searchText: string;
  commandsOnly: boolean;
  tokens: OmnibarToken[];
  tagFilters: string[];
  typeFilters: OmnibarNoteKind[];
  stateFilters: OmnibarStateToken[];
  toolFilters: OmnibarToolToken[];
};

type NoteKindDefinition = {
  value: OmnibarNoteKind;
  label: string;
  aliases: string[];
};

type ToolDefinition = {
  value: OmnibarToolToken;
  label: string;
  aliases: string[];
};

type StateDefinition = {
  value: OmnibarStateToken;
  label: string;
  aliases: string[];
};

export const omnibarNoteKindDefinitions: NoteKindDefinition[] = [
  { value: "standard", label: "Notes", aliases: ["note", "notes", "standard", "sticky"] },
  { value: "quote", label: "Quotes", aliases: ["quote", "quotes", "citation"] },
  { value: "canon", label: "Canon", aliases: ["canon", "rule", "theorem", "law"] },
  { value: "journal", label: "Journal", aliases: ["journal", "diary"] },
  { value: "eisenhower", label: "Matrix", aliases: ["eisenhower", "matrix", "priority"] },
  { value: "joker", label: "Joker", aliases: ["joker", "joke"] },
  { value: "throne", label: "Throne", aliases: ["throne"] },
  { value: "web-bookmark", label: "Bookmarks", aliases: ["bookmark", "bookmarks", "web", "link"] },
  { value: "apod", label: "APOD", aliases: ["apod", "nasa", "space"] },
  { value: "poetry", label: "Poetry", aliases: ["poetry", "poem", "poems"] },
  { value: "image", label: "Images", aliases: ["image", "images", "photo"] },
  { value: "file", label: "Files", aliases: ["file", "files", "document"] },
  { value: "audio", label: "Audio", aliases: ["audio", "sound", "podcast"] },
  { value: "video", label: "Video", aliases: ["video", "videos"] },
];

export const omnibarToolDefinitions: ToolDefinition[] = [
  { value: "tools", label: "Tools Panel", aliases: ["tools", "tool", "left", "panel-left"] },
  { value: "details", label: "Details Panel", aliases: ["details", "detail", "sidebar", "inspector", "right"] },
  { value: "capture", label: "Quick Capture", aliases: ["capture", "quick-capture", "quick"] },
  { value: "export", label: "Export", aliases: ["export", "download", "share"] },
  { value: "timeline", label: "Timeline", aliases: ["timeline", "history", "time"] },
  { value: "view", label: "View Modes", aliases: ["view", "reading", "presentation", "zoom"] },
  { value: "help", label: "Help Center", aliases: ["help", "docs", "support", "guide"] },
];

export const omnibarStateDefinitions: StateDefinition[] = [
  { value: "pinned", label: "Pinned", aliases: ["pinned", "pin"] },
  { value: "highlighted", label: "Highlighted", aliases: ["highlighted", "highlight", "callout"] },
];

const noteKindAliasMap = new Map(
  omnibarNoteKindDefinitions.flatMap((definition) => definition.aliases.map((alias) => [alias, definition.value] as const)),
);
const toolAliasMap = new Map(
  omnibarToolDefinitions.flatMap((definition) => definition.aliases.map((alias) => [alias, definition.value] as const)),
);
const stateAliasMap = new Map(
  omnibarStateDefinitions.flatMap((definition) => definition.aliases.map((alias) => [alias, definition.value] as const)),
);

const unique = <TValue extends string>(values: TValue[]) => [...new Set(values)];

export const normalizeOmnibarNoteKind = (note: Pick<Note, "noteKind">): OmnibarNoteKind =>
  (note.noteKind ?? "standard") as OmnibarNoteKind;

export const parseWallOmnibarQuery = (query: string): ParsedWallOmnibarQuery => {
  const tokens: OmnibarToken[] = [];
  const textSegments: string[] = [];

  for (const segment of query.trim().split(/\s+/).filter(Boolean)) {
    const match = segment.match(/^(tag|type|is|tool):(.+)$/i);
    if (!match) {
      textSegments.push(segment);
      continue;
    }

    const rawKind = match[1] ?? "";
    const rawValue = match[2] ?? "";
    const kind = rawKind.toLowerCase();
    const normalizedValue = rawValue.trim().toLowerCase();
    if (!normalizedValue) {
      textSegments.push(segment);
      continue;
    }

    if (kind === "tag") {
      tokens.push({
        kind: "tag",
        value: normalizedValue,
        raw: `tag:${rawValue}` as const,
        label: `#${rawValue}`,
      });
      continue;
    }

    if (kind === "type") {
      const value = noteKindAliasMap.get(normalizedValue);
      if (value) {
        tokens.push({
          kind: "type",
          value,
          raw: `type:${rawValue}` as const,
          label: omnibarNoteKindDefinitions.find((definition) => definition.value === value)?.label ?? rawValue,
        });
        continue;
      }
    }

    if (kind === "is") {
      const value = stateAliasMap.get(normalizedValue);
      if (value) {
        tokens.push({
          kind: "is",
          value,
          raw: `is:${rawValue}` as const,
          label: omnibarStateDefinitions.find((definition) => definition.value === value)?.label ?? rawValue,
        });
        continue;
      }
    }

    if (kind === "tool") {
      const value = toolAliasMap.get(normalizedValue);
      if (value) {
        tokens.push({
          kind: "tool",
          value,
          raw: `tool:${rawValue}` as const,
          label: omnibarToolDefinitions.find((definition) => definition.value === value)?.label ?? rawValue,
        });
        continue;
      }
    }

    textSegments.push(segment);
  }

  const text = textSegments.join(" ").trim();
  const commandsOnly = text.startsWith("/");
  const searchText = commandsOnly ? text.slice(1).trim() : text;

  return {
    raw: query,
    text,
    searchText,
    commandsOnly,
    tokens,
    tagFilters: unique(tokens.filter((token) => token.kind === "tag").map((token) => token.value)),
    typeFilters: unique(tokens.filter((token) => token.kind === "type").map((token) => token.value)),
    stateFilters: unique(tokens.filter((token) => token.kind === "is").map((token) => token.value)),
    toolFilters: unique(tokens.filter((token) => token.kind === "tool").map((token) => token.value)),
  };
};

export const serializeWallOmnibarQuery = (tokens: OmnibarToken[], text: string) =>
  [...tokens.map((token) => token.raw), text.trim()].filter(Boolean).join(" ").trim();

export const matchesWallOmnibarNoteFilters = (note: Note, parsed: ParsedWallOmnibarQuery) => {
  if (parsed.tagFilters.length > 0) {
    const noteTags = new Set(note.tags.map((tag) => tag.trim().toLowerCase()));
    for (const tag of parsed.tagFilters) {
      if (!noteTags.has(tag)) {
        return false;
      }
    }
  }

  if (parsed.typeFilters.length > 0 && !parsed.typeFilters.includes(normalizeOmnibarNoteKind(note))) {
    return false;
  }

  for (const state of parsed.stateFilters) {
    if (state === "pinned" && !note.pinned) {
      return false;
    }
    if (state === "highlighted" && !note.highlighted) {
      return false;
    }
  }

  return true;
};

export const matchesWallOmnibarNoteResult = (note: Note, parsed: ParsedWallOmnibarQuery) => {
  if (isPrivateNote(note)) {
    return false;
  }
  return matchesWallOmnibarNoteFilters(note, parsed);
};

export const commandMatchesToolFilters = (
  command: Pick<{ label: string; description?: string; keywords?: string[] }, "label" | "description" | "keywords">,
  toolFilters: OmnibarToolToken[],
) => {
  if (toolFilters.length === 0) {
    return true;
  }

  const haystack = [command.label, command.description ?? "", ...(command.keywords ?? [])].join(" ").toLowerCase();
  return toolFilters.some((tool) =>
    (omnibarToolDefinitions.find((definition) => definition.value === tool)?.aliases ?? []).some((alias) => haystack.includes(alias)),
  );
};




