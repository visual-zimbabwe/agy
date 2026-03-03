import { NextResponse } from "next/server";
import { z } from "zod";

import type { CardState, ReviewRating } from "@/features/decks/note-types";
import { scheduleDeckCard } from "@/features/decks/note-types";
import { requireApiUser } from "@/lib/api/auth";
import { collectDeckAndChildrenIds, parseExcludedIds } from "@/lib/decks/tree";

const reviewSchema = z.object({
  cardId: z.string().uuid(),
  rating: z.enum(["again", "hard", "good", "easy"]),
});

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
    .select("id,name,parent_id")
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
    return NextResponse.json({
      card: null,
      counts: { newCount: 0, learningCount: 0, reviewCount: 0 },
      selectedDeckIds: [],
      childDecks: (decks ?? []).filter((deck) => deck.parent_id === deckId),
    });
  }

  const { data: cards, error: cardsError } = await auth.supabase
    .from("deck_cards")
    .select("id,deck_id,note_id,prompt,answer,state,step,interval_days,ease_factor,reps,lapses,due_at,last_reviewed_at,created_at")
    .eq("owner_id", auth.user.id)
    .in("deck_id", selectedDeckIds);
  if (cardsError) {
    return NextResponse.json({ error: cardsError.message }, { status: 500 });
  }

  const nowIso = new Date().toISOString();
  const dueLearning = (cards ?? [])
    .filter((card) => card.state === "learning" && (!card.due_at || card.due_at <= nowIso))
    .sort((a, b) => (a.due_at ?? "").localeCompare(b.due_at ?? ""));
  const dueReview = (cards ?? [])
    .filter((card) => card.state === "review" && (!card.due_at || card.due_at <= nowIso))
    .sort((a, b) => (a.due_at ?? "").localeCompare(b.due_at ?? ""));
  const newCards = (cards ?? [])
    .filter((card) => card.state === "new")
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  const nextCard = dueLearning[0] ?? dueReview[0] ?? newCards[0] ?? null;

  return NextResponse.json({
    card: nextCard,
    counts: {
      newCount: newCards.length,
      learningCount: dueLearning.length,
      reviewCount: dueReview.length,
    },
    selectedDeckIds,
    childDecks: (decks ?? []).filter((deck) => deck.parent_id === deckId),
  });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = reviewSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data: card, error: cardError } = await auth.supabase
    .from("deck_cards")
    .select("id,deck_id,state,step,interval_days,ease_factor,reps,lapses")
    .eq("owner_id", auth.user.id)
    .eq("id", parsed.data.cardId)
    .maybeSingle();
  if (cardError || !card) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  const now = new Date();
  const schedule = scheduleDeckCard({
    state: card.state as CardState,
    step: card.step,
    intervalDays: card.interval_days,
    easeFactor: card.ease_factor,
    reps: card.reps,
    lapses: card.lapses,
    rating: parsed.data.rating as ReviewRating,
    now,
  });

  const { error: updateError } = await auth.supabase
    .from("deck_cards")
    .update({
      state: schedule.nextState,
      step: schedule.nextStep,
      interval_days: schedule.nextIntervalDays,
      ease_factor: schedule.nextEaseFactor,
      reps: schedule.nextReps,
      lapses: schedule.nextLapses,
      due_at: schedule.dueAt.toISOString(),
      last_reviewed_at: now.toISOString(),
    })
    .eq("id", card.id)
    .eq("owner_id", auth.user.id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: reviewError } = await auth.supabase.from("deck_reviews").insert({
    owner_id: auth.user.id,
    deck_id: card.deck_id,
    card_id: card.id,
    rating: parsed.data.rating,
    state_before: card.state,
    state_after: schedule.nextState,
    interval_days_after: schedule.nextIntervalDays,
    reviewed_at: now.toISOString(),
  });
  if (reviewError) {
    return NextResponse.json({ error: reviewError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, next: schedule });
}
