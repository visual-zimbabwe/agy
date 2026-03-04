import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/api/auth";
import { collectDeckAndChildrenIds } from "@/lib/decks/tree";

const customStudySchema = z.object({
  deckId: z.string().uuid(),
  includeChildren: z.boolean().optional().default(true),
  excludedDeckIds: z.array(z.string().uuid()).optional().default([]),
  mode: z.enum(["increase_new", "increase_review", "forgotten", "ahead", "preview_new", "state_tag"]),
  limit: z.number().int().min(1).max(500).optional(),
  days: z.number().int().min(1).max(365).optional(),
  stateFilter: z.enum(["new", "due", "all"]).optional(),
  tag: z.string().trim().max(80).optional(),
  tagsInclude: z.array(z.string().trim().min(1).max(80)).optional(),
  tagsExclude: z.array(z.string().trim().min(1).max(80)).optional(),
  reschedule: z.boolean().optional(),
});

type DeckCardRow = {
  id: string;
  note_id: string;
  deck_id: string;
  prompt: string;
  answer: string;
  state: string;
  due_at: string | null;
  created_at: string;
};

const toTags = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((entry) => String(entry).trim()).filter((entry) => entry.length > 0);
};

const clampLimit = (value: number | undefined, fallback: number) => {
  const next = value ?? fallback;
  return Math.max(1, Math.min(500, next));
};

const todayKeyUtc = () => new Date().toISOString().slice(0, 10);

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = customStudySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;
  const excludedSet = new Set(input.excludedDeckIds);
  const [decksResult, cardsResult, notesResult] = await Promise.all([
    auth.supabase
      .from("decks")
      .select("id,name,parent_id")
      .eq("owner_id", auth.user.id)
      .eq("archived", false),
    auth.supabase
      .from("deck_cards")
      .select("id,note_id,deck_id,prompt,answer,state,due_at,created_at")
      .eq("owner_id", auth.user.id),
    auth.supabase.from("deck_notes").select("id,tags").eq("owner_id", auth.user.id),
  ]);

  if (decksResult.error || cardsResult.error || notesResult.error) {
    return NextResponse.json(
      {
        error:
          decksResult.error?.message ??
          cardsResult.error?.message ??
          notesResult.error?.message ??
          "Failed to build custom study session.",
      },
      { status: 500 },
    );
  }

  const decks = decksResult.data ?? [];
  const selectedDeckIds = input.includeChildren
    ? collectDeckAndChildrenIds(decks, input.deckId, excludedSet)
    : excludedSet.has(input.deckId)
      ? []
      : [input.deckId];
  if (selectedDeckIds.length === 0) {
    return NextResponse.json({
      session: {
        mode: input.mode,
        name: "Custom Study Session",
        reschedule: input.reschedule ?? (input.mode !== "preview_new"),
        cards: [],
        counts: { newCount: 0, learningCount: 0, reviewCount: 0 },
      },
    });
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const selectedSet = new Set(selectedDeckIds);
  const cards = ((cardsResult.data ?? []) as DeckCardRow[]).filter((card) => selectedSet.has(card.deck_id));
  const noteTagsById = new Map((notesResult.data ?? []).map((note) => [note.id, toTags(note.tags)]));

  let selectedCards: DeckCardRow[] = [];
  if (input.mode === "increase_new") {
    const increment = clampLimit(input.limit, 20);
    const today = todayKeyUtc();
    const { data: existing, error: existingError } = await auth.supabase
      .from("deck_daily_overrides")
      .select("extra_new_limit,extra_review_limit,new_served_count,review_served_count")
      .eq("owner_id", auth.user.id)
      .eq("deck_id", input.deckId)
      .eq("study_date", today)
      .maybeSingle();
    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }
    const nextPayload = {
      owner_id: auth.user.id,
      deck_id: input.deckId,
      study_date: today,
      extra_new_limit: (existing?.extra_new_limit ?? 0) + increment,
      extra_review_limit: existing?.extra_review_limit ?? 0,
      new_served_count: existing?.new_served_count ?? 0,
      review_served_count: existing?.review_served_count ?? 0,
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
          .eq("deck_id", input.deckId)
          .eq("study_date", today)
      : auth.supabase.from("deck_daily_overrides").insert(nextPayload);
    const { error: writeError } = await write;
    if (writeError) {
      return NextResponse.json({ error: writeError.message }, { status: 500 });
    }
    return NextResponse.json({
      override: {
        applied: true,
        mode: input.mode,
        increment,
        studyDate: today,
        extraNewLimit: nextPayload.extra_new_limit,
        extraReviewLimit: nextPayload.extra_review_limit,
      },
    });
  } else if (input.mode === "increase_review") {
    const increment = clampLimit(input.limit, 50);
    const today = todayKeyUtc();
    const { data: existing, error: existingError } = await auth.supabase
      .from("deck_daily_overrides")
      .select("extra_new_limit,extra_review_limit,new_served_count,review_served_count")
      .eq("owner_id", auth.user.id)
      .eq("deck_id", input.deckId)
      .eq("study_date", today)
      .maybeSingle();
    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }
    const nextPayload = {
      owner_id: auth.user.id,
      deck_id: input.deckId,
      study_date: today,
      extra_new_limit: existing?.extra_new_limit ?? 0,
      extra_review_limit: (existing?.extra_review_limit ?? 0) + increment,
      new_served_count: existing?.new_served_count ?? 0,
      review_served_count: existing?.review_served_count ?? 0,
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
          .eq("deck_id", input.deckId)
          .eq("study_date", today)
      : auth.supabase.from("deck_daily_overrides").insert(nextPayload);
    const { error: writeError } = await write;
    if (writeError) {
      return NextResponse.json({ error: writeError.message }, { status: 500 });
    }
    return NextResponse.json({
      override: {
        applied: true,
        mode: input.mode,
        increment,
        studyDate: today,
        extraNewLimit: nextPayload.extra_new_limit,
        extraReviewLimit: nextPayload.extra_review_limit,
      },
    });
  } else if (input.mode === "forgotten") {
    const days = input.days ?? 7;
    const cutoff = new Date(now.getTime() - days * 86_400_000).toISOString();
    const reviews = await auth.supabase
      .from("deck_reviews")
      .select("card_id,reviewed_at")
      .eq("owner_id", auth.user.id)
      .eq("rating", "again")
      .in("deck_id", selectedDeckIds)
      .gte("reviewed_at", cutoff)
      .order("reviewed_at", { ascending: false })
      .limit(5000);
    if (reviews.error) {
      return NextResponse.json({ error: reviews.error.message }, { status: 500 });
    }
    const cardById = new Map(cards.map((card) => [card.id, card]));
    const seen = new Set<string>();
    for (const review of reviews.data ?? []) {
      if (seen.has(review.card_id)) {
        continue;
      }
      const card = cardById.get(review.card_id);
      if (!card) {
        continue;
      }
      selectedCards.push(card);
      seen.add(review.card_id);
      if (selectedCards.length >= clampLimit(input.limit, 50)) {
        break;
      }
    }
  } else if (input.mode === "ahead") {
    const days = input.days ?? 2;
    const ceiling = new Date(now.getTime() + days * 86_400_000).toISOString();
    selectedCards = cards
      .filter((card) => (card.state === "review" || card.state === "learning") && card.due_at && card.due_at > nowIso && card.due_at <= ceiling)
      .sort((a, b) => (a.due_at ?? "").localeCompare(b.due_at ?? ""))
      .slice(0, clampLimit(input.limit, 50));
  } else if (input.mode === "preview_new") {
    const days = input.days ?? 7;
    const cutoff = new Date(now.getTime() - days * 86_400_000).toISOString();
    selectedCards = cards
      .filter((card) => card.state === "new" && card.created_at >= cutoff)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, clampLimit(input.limit, 50));
  } else if (input.mode === "state_tag") {
    const stateFilter = input.stateFilter ?? "all";
    const includeTags = new Set(
      [...(input.tagsInclude ?? []), (input.tag ?? "").trim()]
        .map((tag) => tag.toLowerCase())
        .filter((tag) => tag.length > 0),
    );
    const excludeTags = new Set((input.tagsExclude ?? []).map((tag) => tag.toLowerCase()).filter((tag) => tag.length > 0));
    const pool = cards.filter((card) => {
      if (stateFilter === "new" && card.state !== "new") {
        return false;
      }
      if (stateFilter === "due") {
        const isDue = (card.state === "review" || card.state === "learning") && (!card.due_at || card.due_at <= nowIso);
        if (!isDue) {
          return false;
        }
      }
      const tags = noteTagsById.get(card.note_id) ?? [];
      const normalizedTags = tags.map((tag) => tag.toLowerCase());
      if (excludeTags.size > 0 && normalizedTags.some((tag) => excludeTags.has(tag))) {
        return false;
      }
      if (includeTags.size === 0) {
        return true;
      }
      return normalizedTags.some((tag) => includeTags.has(tag));
    });
    selectedCards = pool
      .sort((a, b) => (a.due_at ?? "").localeCompare(b.due_at ?? "") || a.created_at.localeCompare(b.created_at))
      .slice(0, clampLimit(input.limit, 100));
  }

  const counts = selectedCards.reduce(
    (acc, card) => {
      if (card.state === "new") {
        acc.newCount += 1;
      } else if (card.state === "learning") {
        acc.learningCount += 1;
      } else if (card.state === "review") {
        acc.reviewCount += 1;
      }
      return acc;
    },
    { newCount: 0, learningCount: 0, reviewCount: 0 },
  );

  return NextResponse.json({
    session: {
      mode: input.mode,
      name: "Custom Study Session",
      reschedule: input.reschedule ?? (input.mode !== "preview_new"),
      cards: selectedCards.map((card) => ({
        id: card.id,
        prompt: card.prompt,
        answer: card.answer,
        state: card.state,
        due_at: card.due_at,
        created_at: card.created_at,
        tags: noteTagsById.get(card.note_id) ?? [],
      })),
      counts,
    },
  });
}
