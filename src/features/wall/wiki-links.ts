"use client";

import type { Note } from "@/features/wall/types";

export type WikiLinkMatch = {
  raw: string;
  title: string;
  start: number;
  end: number;
};

export type ActiveWikiLinkQuery = {
  start: number;
  end: number;
  query: string;
};

const untitledPrefix = "untitled note";

export const normalizeWikiTitle = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

export const getNoteWikiTitle = (note: Pick<Note, "text">) => {
  const firstLine = note.text
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
  return firstLine || untitledPrefix;
};

export const isUntitledWikiTitle = (value: string) => normalizeWikiTitle(value).startsWith(untitledPrefix);

export const extractWikiLinks = (text: string): WikiLinkMatch[] => {
  const matches = [...text.matchAll(/\[\[([^\]\n]+?)\]\]/g)];
  return matches
    .map((match) => {
      const raw = match[0];
      const title = match[1]?.trim() ?? "";
      const start = match.index ?? -1;
      return title && start >= 0
        ? {
            raw,
            title,
            start,
            end: start + raw.length,
          }
        : null;
    })
    .filter((value): value is WikiLinkMatch => Boolean(value));
};

export const getActiveWikiLinkQuery = (text: string, cursor: number): ActiveWikiLinkQuery | null => {
  const prefix = text.slice(0, cursor);
  const openIndex = prefix.lastIndexOf("[[");
  if (openIndex < 0) {
    return null;
  }
  if (prefix.slice(openIndex + 2).includes("]]")) {
    return null;
  }
  const closingIndex = text.indexOf("]]", openIndex + 2);
  const end = closingIndex >= 0 ? closingIndex + 2 : cursor;
  const query = text.slice(openIndex + 2, cursor);
  if (query.includes("[") || query.includes("\n")) {
    return null;
  }
  return {
    start: openIndex,
    end,
    query,
  };
};

export const replaceWikiLinkQuery = (text: string, query: ActiveWikiLinkQuery, title: string) => {
  const nextValue = `${text.slice(0, query.start)}[[${title}]]${text.slice(query.end)}`;
  const selection = query.start + title.length + 4;
  return {
    nextValue,
    selectionStart: selection,
    selectionEnd: selection,
  };
};

export const buildWikiTitleIndex = (notesById: Record<string, Note>, excludedNoteId?: string) => {
  const index = new Map<string, Note[]>();
  for (const note of Object.values(notesById)) {
    if (note.id === excludedNoteId) {
      continue;
    }
    const normalized = normalizeWikiTitle(getNoteWikiTitle(note));
    if (!normalized) {
      continue;
    }
    const list = index.get(normalized) ?? [];
    list.push(note);
    index.set(normalized, list);
  }
  return index;
};

export const findNoteByWikiTitle = (notesById: Record<string, Note>, title: string, excludedNoteId?: string) => {
  const normalizedTitle = normalizeWikiTitle(title);
  if (!normalizedTitle) {
    return undefined;
  }
  const matches = buildWikiTitleIndex(notesById, excludedNoteId).get(normalizedTitle);
  return matches?.[0];
};
