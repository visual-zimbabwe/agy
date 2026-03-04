import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/api/auth";
import { collectDeckAndChildrenIds, parseExcludedIds } from "@/lib/decks/tree";

const toTags = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((entry) => String(entry).trim()).filter((entry) => entry.length > 0);
};

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const url = new URL(request.url);
  const deckId = url.searchParams.get("deckId");
  if (!deckId) {
    return NextResponse.json({ error: "deckId is required" }, { status: 400 });
  }
  const includeChildren = url.searchParams.get("includeChildren") !== "0";
  const excluded = parseExcludedIds(url.searchParams.get("excludedDeckIds"));

  const { data: decks, error: decksError } = await auth.supabase
    .from("decks")
    .select("id,parent_id")
    .eq("owner_id", auth.user.id)
    .eq("archived", false);
  if (decksError) {
    return NextResponse.json({ error: decksError.message }, { status: 500 });
  }

  const selectedDeckIds = includeChildren
    ? collectDeckAndChildrenIds(decks ?? [], deckId, excluded)
    : excluded.has(deckId)
      ? []
      : [deckId];
  if (selectedDeckIds.length === 0) {
    return NextResponse.json({ tags: [] });
  }

  const { data: notes, error: notesError } = await auth.supabase
    .from("deck_notes")
    .select("tags")
    .eq("owner_id", auth.user.id)
    .in("deck_id", selectedDeckIds);
  if (notesError) {
    return NextResponse.json({ error: notesError.message }, { status: 500 });
  }

  const unique = new Set<string>();
  for (const note of notes ?? []) {
    for (const tag of toTags(note.tags)) {
      unique.add(tag);
    }
  }

  return NextResponse.json({
    tags: [...unique].sort((a, b) => a.localeCompare(b)),
  });
}
