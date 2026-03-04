import { NextResponse } from "next/server";
import { z } from "zod";

import type { CardState, ReviewRating } from "@/features/decks/note-types";
import { scheduleDeckCard } from "@/features/decks/note-types";
import { requireApiUser } from "@/lib/api/auth";
import { collectDeckAndChildrenIds, parseExcludedIds } from "@/lib/decks/tree";

const BASE_DAILY_NEW_LIMIT = 20;
const BASE_DAILY_REVIEW_LIMIT = 200;

const todayKeyUtc = () => new Date().toISOString().slice(0, 10);

const reviewSchema = z.object({
  cardId: z.string().uuid(),
  rating: z.enum(["again", "hard", "good", "easy"]),
  studyDeckId: z.string().uuid().optional(),
  sessionType: z.enum(["default", "custom"]).optional().default("default"),
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

  const today = todayKeyUtc();
  const { data: todayOverride, error: todayOverrideError } = await auth.supabase
    .from("deck_daily_overrides")
    .select("extra_new_limit,extra_review_limit,new_served_count,review_served_count")
    .eq("owner_id", auth.user.id)
    .eq("deck_id", deckId)
    .eq("study_date", today)
    .maybeSingle();
  if (todayOverrideError) {
    return NextResponse.json({ error: todayOverrideError.message }, { status: 500 });
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

  const effectiveNewLimit = BASE_DAILY_NEW_LIMIT + (todayOverride?.extra_new_limit ?? 0);
  const effectiveReviewLimit = BASE_DAILY_REVIEW_LIMIT + (todayOverride?.extra_review_limit ?? 0);
  const newServed = todayOverride?.new_served_count ?? 0;
  const reviewServed = todayOverride?.review_served_count ?? 0;
  const remainingNew = Math.max(0, effectiveNewLimit - newServed);
  const remainingReview = Math.max(0, effectiveReviewLimit - reviewServed);
  const dueReviewLimited = dueReview.slice(0, remainingReview);
  const newCardsLimited = newCards.slice(0, remainingNew);

  const nextCard = dueLearning[0] ?? dueReviewLimited[0] ?? newCardsLimited[0] ?? null;

  return NextResponse.json({
    card: nextCard,
    counts: {
      newCount: newCardsLimited.length,
      learningCount: dueLearning.length,
      reviewCount: dueReviewLimited.length,
    },
    limits: {
      baseNewLimit: BASE_DAILY_NEW_LIMIT,
      baseReviewLimit: BASE_DAILY_REVIEW_LIMIT,
      extraNewLimit: todayOverride?.extra_new_limit ?? 0,
      extraReviewLimit: todayOverride?.extra_review_limit ?? 0,
      effectiveNewLimit,
      effectiveReviewLimit,
      newServed,
      reviewServed,
      remainingNew,
      remainingReview,
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
    .select("id,deck_id,state,step,interval_days,ease_factor,reps,lapses,due_at")
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

  if (parsed.data.sessionType === "default") {
    const bucketDeckId = parsed.data.studyDeckId ?? card.deck_id;
    const today = todayKeyUtc();
    const { data: existing, error: existingError } = await auth.supabase
      .from("deck_daily_overrides")
      .select("extra_new_limit,extra_review_limit,new_served_count,review_served_count")
      .eq("owner_id", auth.user.id)
      .eq("deck_id", bucketDeckId)
      .eq("study_date", today)
      .maybeSingle();
    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }
    const wasDueReview = card.state === "review" && (!card.due_at || card.due_at <= now.toISOString());
    const nextNewServed = (existing?.new_served_count ?? 0) + (card.state === "new" ? 1 : 0);
    const nextReviewServed = (existing?.review_served_count ?? 0) + (wasDueReview ? 1 : 0);
    const nextPayload = {
      owner_id: auth.user.id,
      deck_id: bucketDeckId,
      study_date: today,
      extra_new_limit: existing?.extra_new_limit ?? 0,
      extra_review_limit: existing?.extra_review_limit ?? 0,
      new_served_count: nextNewServed,
      review_served_count: nextReviewServed,
    };
    const updatePayload = {
      extra_new_limit: nextPayload.extra_new_limit,
      extra_review_limit: nextPayload.extra_review_limit,
      new_served_count: nextPayload.new_served_count,
      review_served_count: nextPayload.review_served_count,
    };
    const write = existing
      ? auth.supabase
          .from("deck_daily_overrides")
          .update(updatePayload)
          .eq("owner_id", auth.user.id)
          .eq("deck_id", bucketDeckId)
          .eq("study_date", today)
      : auth.supabase.from("deck_daily_overrides").insert(nextPayload);
    const { error: writeError } = await write;
    if (writeError) {
      return NextResponse.json({ error: writeError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, next: schedule });
}
