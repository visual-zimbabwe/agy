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
const DAY_MS = 86_400_000;

const buildDaySeries = (start: Date, length: number) =>
  Array.from({ length }, (_, index) => {
    const day = new Date(start.getTime() + index * DAY_MS).toISOString().slice(0, 10);
    return { day };
  });

const dayKey = (iso: string) => iso.slice(0, 10);

const toPct = (value: number) => Number(value.toFixed(1));

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const url = new URL(request.url);
  const rangeKey = url.searchParams.get("range") ?? "30d";
  const deckId = url.searchParams.get("deckId");
  const includeChildren = url.searchParams.get("includeChildren") !== "0";

  const [decksResult, cardsResult, reviewsResult, notesResult] = await Promise.all([
    auth.supabase.from("decks").select("id,parent_id").eq("owner_id", auth.user.id).eq("archived", false),
    auth.supabase
      .from("deck_cards")
      .select("id,deck_id,note_id,state,due_at,interval_days,reps")
      .eq("owner_id", auth.user.id),
    auth.supabase
      .from("deck_reviews")
      .select("id,deck_id,rating,reviewed_at,state_before,state_after,interval_days_after")
      .eq("owner_id", auth.user.id)
      .order("reviewed_at", { ascending: false })
      .limit(5000),
    auth.supabase.from("deck_notes").select("id,deck_id,suspended,created_at").eq("owner_id", auth.user.id),
  ]);

  if (decksResult.error || cardsResult.error || reviewsResult.error || notesResult.error) {
    return NextResponse.json(
      {
        error:
          decksResult.error?.message ??
          cardsResult.error?.message ??
          reviewsResult.error?.message ??
          notesResult.error?.message ??
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
  const monthFloor = new Date(now.getTime() - 30 * DAY_MS);
  const yearFloor = new Date(now.getTime() - 365 * DAY_MS);

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
  const notes = (notesResult.data ?? []).filter((note) => allowed.has(note.deck_id));
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
  const forecastDays = rangeKey === "1y" ? 365 : rangeKey === "deck_life" ? 365 : 30;
  const forecastStart = startOfDay(now);
  const forecastRaw = buildDaySeries(forecastStart, forecastDays).map((entry) => {
    const startIso = entry.day;
    const endIso = new Date(new Date(`${startIso}T00:00:00.000Z`).getTime() + DAY_MS).toISOString();
    const due = cards.filter((card) => card.due_at && card.due_at >= `${startIso}T00:00:00.000Z` && card.due_at < endIso).length;
    return { day: entry.day, due };
  });
  const forecast = forecastDays > 62
    ? Array.from({ length: Math.ceil(forecastRaw.length / 7) }, (_, index) => {
        const slice = forecastRaw.slice(index * 7, index * 7 + 7);
        return {
          day: slice[0]?.day ?? "",
          due: slice.reduce((sum, item) => sum + item.due, 0),
        };
      })
    : forecastRaw;

  const reviewCountByDayMap = new Map<
    string,
    { newCount: number; learning: number; relearning: number; young: number; mature: number }
  >();
  const reviewTimeByDayMap = new Map<string, number>();
  const hourlyMap = new Map<number, { total: number; correct: number }>();
  const answerButtons = {
    new: { again: 0, hard: 0, good: 0, easy: 0 },
    young: { again: 0, hard: 0, good: 0, easy: 0 },
    mature: { again: 0, hard: 0, good: 0, easy: 0 },
  };

  for (const review of reviews) {
    const reviewedDate = new Date(review.reviewed_at);
    const reviewDay = dayKey(review.reviewed_at);
    const bucket = reviewCountByDayMap.get(reviewDay) ?? { newCount: 0, learning: 0, relearning: 0, young: 0, mature: 0 };

    let classKey: "new" | "learning" | "relearning" | "young" | "mature" = "young";
    if (review.state_before === "new") {
      classKey = "new";
    } else if (review.state_before === "learning") {
      classKey = "learning";
    } else if (review.state_before === "review" && review.state_after === "learning") {
      classKey = "relearning";
    } else if ((review.interval_days_after ?? 0) >= 21) {
      classKey = "mature";
    }

    if (classKey === "new") bucket.newCount += 1;
    if (classKey === "learning") bucket.learning += 1;
    if (classKey === "relearning") bucket.relearning += 1;
    if (classKey === "young") bucket.young += 1;
    if (classKey === "mature") bucket.mature += 1;
    reviewCountByDayMap.set(reviewDay, bucket);

    const secondsByClass = classKey === "new" ? 18 : classKey === "learning" || classKey === "relearning" ? 14 : classKey === "young" ? 11 : 8;
    reviewTimeByDayMap.set(reviewDay, (reviewTimeByDayMap.get(reviewDay) ?? 0) + secondsByClass / 60);

    const hour = reviewedDate.getHours();
    const hourBucket = hourlyMap.get(hour) ?? { total: 0, correct: 0 };
    hourBucket.total += 1;
    if (review.rating !== "again") {
      hourBucket.correct += 1;
    }
    hourlyMap.set(hour, hourBucket);

    const answerClass: "new" | "young" | "mature" =
      review.state_before === "new" ? "new" : (review.interval_days_after ?? 0) >= 21 ? "mature" : "young";
    const ratingKey = review.rating as "again" | "hard" | "good" | "easy";
    if (ratingKey in answerButtons[answerClass]) {
      answerButtons[answerClass][ratingKey] += 1;
    }
  }

  const reviewCountSeries = Array.from(reviewCountByDayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, values]) => ({ day, ...values }));

  const reviewTimeSeries = Array.from(reviewTimeByDayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, minutes]) => ({ day, minutes: toPct(minutes) }));

  const hourlyBreakdown = Array.from({ length: 24 }, (_, hour) => {
    const bucket = hourlyMap.get(hour) ?? { total: 0, correct: 0 };
    return {
      hour,
      reviews: bucket.total,
      correctRate: bucket.total === 0 ? 0 : Math.round((bucket.correct / bucket.total) * 100),
    };
  });

  const intervalDistribution = {
    under1: cards.filter((card) => (card.interval_days ?? 0) < 1).length,
    d1to6: cards.filter((card) => (card.interval_days ?? 0) >= 1 && (card.interval_days ?? 0) <= 6).length,
    d7to20: cards.filter((card) => (card.interval_days ?? 0) >= 7 && (card.interval_days ?? 0) <= 20).length,
    d21to90: cards.filter((card) => (card.interval_days ?? 0) >= 21 && (card.interval_days ?? 0) <= 90).length,
    over90: cards.filter((card) => (card.interval_days ?? 0) > 90).length,
  };

  const addedTimeline = Array.from(
    notes.reduce((map, note) => {
      const key = dayKey(note.created_at);
      map.set(key, (map.get(key) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ day, count }));

  const noteById = new Map(notes.map((note) => [note.id, note]));
  const suspendedCount = cards.reduce((sum, card) => sum + (noteById.get(card.note_id)?.suspended ? 1 : 0), 0);
  const newCount = cards.filter((card) => card.state === "new").length;
  const reviewedCount = cards.filter((card) => (card.reps ?? 0) > 0 || card.state !== "new").length;
  const cardCounts = {
    new: newCount,
    suspended: suspendedCount,
    buried: 0,
    reviewed: reviewedCount,
  };

  const monthReviews = (reviewsResult.data ?? []).filter((review) => allowed.has(review.deck_id) && new Date(review.reviewed_at) >= monthFloor);
  const yearReviews = (reviewsResult.data ?? []).filter((review) => allowed.has(review.deck_id) && new Date(review.reviewed_at) >= yearFloor);
  const monthGood = monthReviews.filter((review) => review.rating === "good").length;
  const monthAgain = monthReviews.filter((review) => review.rating === "again").length;
  const yearGood = yearReviews.filter((review) => review.rating === "good").length;
  const yearAgain = yearReviews.filter((review) => review.rating === "again").length;
  const retention = {
    month: monthGood + monthAgain === 0 ? 0 : Math.round((monthGood / (monthGood + monthAgain)) * 100),
    year: yearGood + yearAgain === 0 ? 0 : Math.round((yearGood / (yearGood + yearAgain)) * 100),
  };

  return NextResponse.json({
    summary: {
      totalCards: cards.length,
      totalReviews,
      retentionRate,
      dueTomorrow,
    },
    workload7,
    forecast,
    forecastMode: forecastDays > 62 ? "weekly" : "daily",
    reviewCount: reviewCountSeries,
    reviewTime: reviewTimeSeries,
    intervals: intervalDistribution,
    hourly: hourlyBreakdown,
    answerButtons,
    added: addedTimeline,
    cardCounts,
    retention,
  });
}
