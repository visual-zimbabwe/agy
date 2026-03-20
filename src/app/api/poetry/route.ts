import { NextRequest, NextResponse } from "next/server";

import {
  DEFAULT_POETRY_MATCH_TYPE,  normalizePoetryMatchType,
  normalizePoetrySearchField,
  normalizePoetrySearchQuery,
} from "@/features/wall/poetry";
import type { PoetrySearchField, PoetrySearchMatchType } from "@/features/wall/types";

type PoetryDbResponse = Array<{
  title?: string;
  author?: string;
  lines?: string[];
  linecount?: string | number;
}>;

const outputFields = "title,author,lines,linecount.json";
const clean = (value?: string | null) => value?.trim() || undefined;

const buildPoetryDbUrl = ({
  field,
  query,
  matchType,
}: {
  field: PoetrySearchField;
  query: string;
  matchType: PoetrySearchMatchType;
}) => {
  if (field === "random") {
    return `https://poetrydb.org/random/1/${outputFields}`;
  }

  const suffix = matchType === "exact" ? ":abs" : "";
  return `https://poetrydb.org/${field}/${encodeURIComponent(query)}${suffix}/${outputFields}`;
};

const toSearchMeta = (searchParams: URLSearchParams) => {
  const field = normalizePoetrySearchField(searchParams.get("field"));
  const query = normalizePoetrySearchQuery(searchParams.get("query"));
  const matchType = normalizePoetryMatchType(searchParams.get("match"));
  return {
    field,
    query,
    matchType: field === "random" ? DEFAULT_POETRY_MATCH_TYPE : matchType,
  };
};

const pickPoem = (payload: PoetryDbResponse) => {
  if (!Array.isArray(payload) || payload.length === 0) {
    return undefined;
  }
  const usable = payload.filter((entry) => Array.isArray(entry.lines) && entry.lines.length > 0);
  if (usable.length === 0) {
    return undefined;
  }
  return usable[Math.floor(Math.random() * usable.length)];
};

export async function GET(request: NextRequest) {
  const search = toSearchMeta(request.nextUrl.searchParams);
  if (search.field !== "random" && !search.query) {
    return NextResponse.json({ error: `Enter a ${search.field} search before fetching poetry.` }, { status: 400 });
  }

  const sourceUrl = buildPoetryDbUrl({
    field: search.field,
    query: search.query,
    matchType: search.matchType,
  });

  try {
    const response = await fetch(sourceUrl, { cache: "no-store" });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return NextResponse.json({ error: body || `PoetryDB request failed with ${response.status}` }, { status: response.status });
    }

    const payload = (await response.json()) as PoetryDbResponse;
    const poem = pickPoem(payload);
    if (!poem || !Array.isArray(poem.lines) || poem.lines.length === 0) {
      return NextResponse.json({ error: "PoetryDB did not return a usable poem for that search" }, { status: 404 });
    }

    return NextResponse.json({
      title: clean(poem.title),
      author: clean(poem.author),
      lines: poem.lines.map((line) => line.trimEnd()),
      lineCount: Number.parseInt(`${poem.linecount ?? poem.lines.length}`, 10) || poem.lines.length,
      sourceUrl,
      searchField: search.field,
      searchQuery: search.field === "random" ? "" : search.query,
      matchType: search.field === "random" ? DEFAULT_POETRY_MATCH_TYPE : search.matchType,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PoetryDB request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
