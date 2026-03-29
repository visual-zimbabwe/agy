import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/api/auth";
import { collectDeckAndChildrenIds, parseExcludedIds } from "@/lib/decks/tree";

const hasToken = (haystack: string, needle: string) => haystack.toLowerCase().includes(needle.toLowerCase());

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const url = new URL(request.url);
  const deckId = url.searchParams.get("deckId");
  const includeChildren = url.searchParams.get("includeChildren") === "1";
  const excludedIds = parseExcludedIds(url.searchParams.get("excludedDeckIds"));
  const query = (url.searchParams.get("q") ?? "").trim();
  const quick = (url.searchParams.get("quick") ?? "").trim();
  const noteTypeId = (url.searchParams.get("noteTypeId") ?? "").trim();
  const tag = (url.searchParams.get("tag") ?? "").trim();

  const [decksResult, noteTypesResult] = await Promise.all([
    auth.supabase.from("decks").select("id,name,parent_id").eq("owner_id", auth.user.id).eq("archived", false),
    auth.supabase.from("deck_note_types").select("id,name,builtin_key").eq("owner_id", auth.user.id),
  ]);

  if (decksResult.error || noteTypesResult.error) {
    return NextResponse.json(
      {
        error: decksResult.error?.message ?? noteTypesResult.error?.message ?? "Failed to load browser data.",
      },
      { status: 500 },
    );
  }

  const decks = decksResult.data ?? [];
  const deckMap = new Map(decks.map((deck) => [deck.id, deck]));
  const noteTypeMap = new Map((noteTypesResult.data ?? []).map((type) => [type.id, type]));

  let allowedDeckIds: string[] | null = null;
  if (deckId) {
    if (includeChildren) {
      allowedDeckIds = collectDeckAndChildrenIds(decks, deckId, excludedIds);
    } else {
      allowedDeckIds = [deckId];
    }
  }

  let notesQuery = auth.supabase
    .from("deck_notes")
    .select("id,deck_id,note_type_id,sort_field,fields,tags,suspended,flagged,created_at,updated_at")
    .eq("owner_id", auth.user.id);
  if (allowedDeckIds) {
    if (allowedDeckIds.length === 0) {
      return NextResponse.json({
        rows: [],
        sidebar: {
          decks,
          noteTypes: noteTypesResult.data ?? [],
          tags: [],
          quickFilters: ["added_today", "suspended", "flagged"],
        },
      });
    }
    notesQuery = notesQuery.in("deck_id", allowedDeckIds);
  }
  if (noteTypeId) {
    notesQuery = notesQuery.eq("note_type_id", noteTypeId);
  }
  if (tag) {
    notesQuery = notesQuery.contains("tags", [tag]);
  }
  if (quick === "suspended") {
    notesQuery = notesQuery.eq("suspended", true);
  }
  if (quick === "flagged") {
    notesQuery = notesQuery.eq("flagged", true);
  }
  if (quick === "added_today") {
    notesQuery = notesQuery.gte("created_at", `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
  }

  const notesResult = await notesQuery;
  if (notesResult.error) {
    return NextResponse.json({ error: notesResult.error.message }, { status: 500 });
  }

  const notes = notesResult.data ?? [];
  const noteMap = new Map(notes.map((note) => [note.id, note]));
  const noteIds = notes.map((note) => note.id);
  if (noteIds.length === 0) {
    return NextResponse.json({
      rows: [],
      sidebar: {
        decks,
        noteTypes: noteTypesResult.data ?? [],
        tags: [],
        quickFilters: ["added_today", "suspended", "flagged"],
      },
    });
  }

  let cardsQuery = auth.supabase
    .from("deck_cards")
    .select("id,note_id,deck_id,card_ordinal,prompt,answer,state,due_at,interval_days,reps,lapses,last_reviewed_at,created_at,updated_at")
    .eq("owner_id", auth.user.id)
    .in("note_id", noteIds);
  if (allowedDeckIds) {
    cardsQuery = cardsQuery.in("deck_id", allowedDeckIds);
  }

  const cardsResult = await cardsQuery;
  if (cardsResult.error) {
    return NextResponse.json({ error: cardsResult.error.message }, { status: 500 });
  }

  const filteredRows = (cardsResult.data ?? []).filter((card) => {
    const note = noteMap.get(card.note_id);
    if (!note) {
      return false;
    }
    if (query) {
      const text = [
        card.prompt,
        card.answer,
        note.sort_field,
        JSON.stringify(note.fields),
        JSON.stringify(note.tags),
        deckMap.get(card.deck_id)?.name ?? "",
      ].join(" ");
      if (!hasToken(text, query)) {
        return false;
      }
    }
    return true;
  });

  const rows = filteredRows.map((card) => {
    const note = noteMap.get(card.note_id);
    const deck = deckMap.get(card.deck_id);
    const noteType = note ? noteTypeMap.get(note.note_type_id) : undefined;
    return {
      ...card,
      deckName: deck?.name ?? "Unknown deck",
      noteTypeName: noteType?.name ?? "Unknown type",
      note: note ?? null,
    };
  });

  const tags = new Set<string>();
  for (const note of notes) {
    if (!Array.isArray(note.tags)) {
      continue;
    }
    for (const entry of note.tags) {
      const value = String(entry).trim();
      if (value) {
        tags.add(value);
      }
    }
  }

  return NextResponse.json({
    rows,
    sidebar: {
      decks,
      noteTypes: noteTypesResult.data ?? [],
      tags: [...tags].sort((a, b) => a.localeCompare(b)),
      quickFilters: ["added_today", "suspended", "flagged"],
    },
  });
}
