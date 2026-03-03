import { NextResponse } from "next/server";
import { z } from "zod";

import { createDeckCardsFromNote } from "@/features/decks/note-types";
import { requireApiUser } from "@/lib/api/auth";

const createNoteSchema = z.object({
  deckId: z.string().uuid(),
  noteTypeId: z.string().uuid(),
  fields: z.record(z.string(), z.string()),
  tags: z.array(z.string().trim().min(1).max(40)).optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = createNoteSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data: noteType, error: noteTypeError } = await auth.supabase
    .from("deck_note_types")
    .select("id,builtin_key,front_template,back_template")
    .eq("id", parsed.data.noteTypeId)
    .eq("owner_id", auth.user.id)
    .maybeSingle();

  if (noteTypeError || !noteType) {
    return NextResponse.json({ error: "Note type not found." }, { status: 404 });
  }

  const generatedCards = createDeckCardsFromNote({
    builtinKey: noteType.builtin_key,
    frontTemplate: noteType.front_template,
    backTemplate: noteType.back_template,
    fields: parsed.data.fields,
  });

  if (generatedCards.length === 0) {
    return NextResponse.json({ error: "No cards generated from this note." }, { status: 400 });
  }

  const sortField = Object.values(parsed.data.fields)[0] ?? "New note";
  const { data: note, error: noteError } = await auth.supabase
    .from("deck_notes")
    .insert({
      owner_id: auth.user.id,
      deck_id: parsed.data.deckId,
      note_type_id: parsed.data.noteTypeId,
      sort_field: sortField,
      fields: parsed.data.fields,
      tags: parsed.data.tags ?? [],
    })
    .select("id,deck_id,note_type_id,sort_field,fields,tags,suspended,flagged,created_at,updated_at")
    .single();

  if (noteError || !note) {
    return NextResponse.json({ error: noteError?.message ?? "Failed to create note." }, { status: 500 });
  }

  const cardsPayload = generatedCards.map((card) => ({
    owner_id: auth.user.id,
    deck_id: parsed.data.deckId,
    note_id: note.id,
    card_ordinal: card.ordinal,
    prompt: card.prompt,
    answer: card.answer,
    state: "new",
    step: 0,
    interval_days: 0,
    ease_factor: 2.5,
    reps: 0,
    lapses: 0,
    due_at: null,
  }));

  const { data: cards, error: cardsError } = await auth.supabase
    .from("deck_cards")
    .insert(cardsPayload)
    .select("id,note_id,deck_id,card_ordinal,prompt,answer,state,due_at,interval_days,ease_factor,reps,lapses,created_at,updated_at");

  if (cardsError) {
    await auth.supabase.from("deck_notes").delete().eq("id", note.id).eq("owner_id", auth.user.id);
    return NextResponse.json({ error: cardsError.message }, { status: 500 });
  }

  return NextResponse.json({ note, cards: cards ?? [] }, { status: 201 });
}
