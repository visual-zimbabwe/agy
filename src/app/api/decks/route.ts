import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/api/auth";
import { ensureBuiltinDeckNoteTypes } from "@/lib/decks/bootstrap";

const createDeckSchema = z.object({
  name: z.string().trim().min(1).max(120),
  parentId: z.string().uuid().nullable().optional(),
});

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const bootstrap = await ensureBuiltinDeckNoteTypes(auth.supabase, auth.user);
  if ("error" in bootstrap && bootstrap.error) {
    return NextResponse.json({ error: bootstrap.error.message }, { status: 500 });
  }

  const [decksResult, noteTypesResult, cardsResult] = await Promise.all([
    auth.supabase
      .from("decks")
      .select("id,name,parent_id,archived,created_at,updated_at")
      .eq("owner_id", auth.user.id)
      .eq("archived", false)
      .order("name", { ascending: true }),
    auth.supabase
      .from("deck_note_types")
      .select("id,name,builtin_key,fields,front_template,back_template,css,is_builtin,created_at,updated_at")
      .eq("owner_id", auth.user.id)
      .order("is_builtin", { ascending: false })
      .order("name", { ascending: true }),
    auth.supabase
      .from("deck_cards")
      .select("deck_id,state,due_at")
      .eq("owner_id", auth.user.id),
  ]);

  if (decksResult.error || noteTypesResult.error || cardsResult.error) {
    return NextResponse.json(
      {
        error:
          decksResult.error?.message ??
          noteTypesResult.error?.message ??
          cardsResult.error?.message ??
          "Failed to load decks data.",
      },
      { status: 500 },
    );
  }

  const countsByDeck = new Map<string, { newCount: number; learningCount: number; reviewCount: number }>();
  const nowIso = new Date().toISOString();
  for (const card of cardsResult.data ?? []) {
    const bucket = countsByDeck.get(card.deck_id) ?? { newCount: 0, learningCount: 0, reviewCount: 0 };
    if (card.state === "new") {
      bucket.newCount += 1;
    } else if (card.state === "learning" && (!card.due_at || card.due_at <= nowIso)) {
      bucket.learningCount += 1;
    } else if (card.state === "review" && (!card.due_at || card.due_at <= nowIso)) {
      bucket.reviewCount += 1;
    }
    countsByDeck.set(card.deck_id, bucket);
  }

  return NextResponse.json({
    decks: (decksResult.data ?? []).map((deck) => ({
      ...deck,
      counts: countsByDeck.get(deck.id) ?? { newCount: 0, learningCount: 0, reviewCount: 0 },
    })),
    noteTypes: noteTypesResult.data ?? [],
  });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = createDeckSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("decks")
    .insert({
      owner_id: auth.user.id,
      name: parsed.data.name,
      parent_id: parsed.data.parentId ?? null,
    })
    .select("id,name,parent_id,archived,created_at,updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deck: data }, { status: 201 });
}
