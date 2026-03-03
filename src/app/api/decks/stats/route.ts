import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/api/auth";
import { collectDeckAndChildrenIds } from "@/lib/decks/tree";

const rangeDaysByKey: Record<string, number | null> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
  deck_life: null,
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const url = new URL(request.url);
  const rangeKey = url.searchParams.get("range") ?? "30d";
  const deckId = url.searchParams.get("deckId");
  const includeChildren = url.searchParams.get("includeChildren") !== "0";

  const [decksResult, cardsResult, reviewsResult] = await Promise.all([
    auth.supabase.from("decks").select("id,parent_id").eq("owner_id", auth.user.id).eq("archived", false),
    auth.supabase
      .from("deck_cards")
      .select("id,deck_id,state,due_at,ease_factor,lapses,reps")
      .eq("owner_id", auth.user.id),
    auth.supabase
      .from("deck_reviews")
      .select("id,deck_id,rating,reviewed_at,state_after")
      .eq("owner_id", auth.user.id)
      .order("reviewed_at", { ascending: false })
      .limit(5000),
  ]);

  if (decksResult.error || cardsResult.error || reviewsResult.error) {
    return NextResponse.json(
      {
        error:
          decksResult.error?.message ??
          cardsResult.error?.message ??
          reviewsResult.error?.message ??
          "Failed to load stats.",
      },
      { status: 500 },
    );
  }

  const deckIds = deckId
    ? includeChildren
      ? collectDeckAndChildrenIds(decksResult.data ?? [], deckId, new Set())
      : [deckId]
    : (decksResult.data ?? []).map((deck) => deck.id);
  const allowed = new Set(deckIds);

  const now = new Date();
  const rangeDays = rangeDaysByKey[rangeKey] ?? 30;
  const floorDate = rangeDays ? new Date(now.getTime() - rangeDays * 86_400_000) : null;

  const reviews = (reviewsResult.data ?? []).filter((review) => {
    if (!allowed.has(review.deck_id)) {
      return false;
    }
    if (floorDate && new Date(review.reviewed_at) < floorDate) {
      return false;
    }
    return true;
  });

  const cards = (cardsResult.data ?? []).filter((card) => allowed.has(card.deck_id));
  const dueTomorrowEnd = new Date(startOfDay(now).getTime() + 2 * 86_400_000).toISOString();
  const dueTomorrowStart = new Date(startOfDay(now).getTime() + 1 * 86_400_000).toISOString();
  const dueTomorrow = cards.filter((card) => card.due_at && card.due_at >= dueTomorrowStart && card.due_at < dueTomorrowEnd).length;

  const workload7 = Array.from({ length: 7 }, (_, index) => {
    const dayStart = new Date(startOfDay(now).getTime() + index * 86_400_000);
    const dayEnd = new Date(dayStart.getTime() + 86_400_000);
    const count = cards.filter((card) => card.due_at && card.due_at >= dayStart.toISOString() && card.due_at < dayEnd.toISOString()).length;
    return { day: dayStart.toISOString().slice(0, 10), due: count };
  });

  const totalReviews = reviews.length;
  const againCount = reviews.filter((entry) => entry.rating === "again").length;
  const retentionRate = totalReviews === 0 ? 0 : Math.round(((totalReviews - againCount) / totalReviews) * 100);

  return NextResponse.json({
    summary: {
      totalCards: cards.length,
      totalReviews,
      retentionRate,
      dueTomorrow,
    },
    workload7,
  });
}
