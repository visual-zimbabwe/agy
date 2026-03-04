import { NextResponse } from "next/server";
import { z } from "zod";

import { defaultFsrsParams } from "@/features/decks/note-types";
import { requireApiUser } from "@/lib/api/auth";

const paramsSchema = z.object({
  deckId: z.string().uuid(),
});

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export async function POST(_: Request, context: { params: Promise<{ deckId: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid deck id." }, { status: 400 });
  }

  const deckId = parsedParams.data.deckId;
  const { data: reviews, error: reviewsError } = await auth.supabase
    .from("deck_reviews")
    .select("rating,state_before,state_after")
    .eq("owner_id", auth.user.id)
    .eq("deck_id", deckId)
    .order("reviewed_at", { ascending: false })
    .limit(5000);
  if (reviewsError) {
    return NextResponse.json({ error: reviewsError.message }, { status: 500 });
  }

  const total = reviews?.length ?? 0;
  if (total < 30) {
    return NextResponse.json(
      { error: "Need at least 30 reviews to optimize FSRS reliably." },
      { status: 400 },
    );
  }

  const againCount = (reviews ?? []).filter((entry) => entry.rating === "again").length;
  const hardCount = (reviews ?? []).filter((entry) => entry.rating === "hard").length;
  const easyCount = (reviews ?? []).filter((entry) => entry.rating === "easy").length;
  const lapseEvents = (reviews ?? []).filter((entry) => entry.state_before === "review" && entry.state_after === "learning").length;

  const againRate = againCount / total;
  const hardRate = hardCount / total;
  const easyRate = easyCount / total;
  const lapseRate = lapseEvents / total;

  const optimizedParams = {
    desiredRetention: clamp(0.93 - againRate * 0.22, 0.8, 0.95),
    hardFactor: clamp(1.15 + hardRate * 0.6 - againRate * 0.25, 1.05, 1.7),
    easyBonus: clamp(1.5 + easyRate * 1.0, 1.25, 2.4),
    againPenalty: clamp(0.45 + againRate * 0.8 + lapseRate * 0.3, 0.25, 0.9),
    learningStepsMinutes: againRate > 0.22 ? [1, 10, 60] : defaultFsrsParams.learningStepsMinutes,
    lapseIntervalMinutes: clamp(Math.round(8 + againRate * 30), 5, 120),
    minReviewDays: 1,
    maxIntervalDays: 36500,
  };

  const nowIso = new Date().toISOString();
  const { data: deck, error: updateError } = await auth.supabase
    .from("decks")
    .update({
      scheduler_mode: "fsrs",
      fsrs_params: optimizedParams,
      fsrs_optimized_at: nowIso,
    })
    .eq("id", deckId)
    .eq("owner_id", auth.user.id)
    .select("id,name,scheduler_mode,fsrs_params,fsrs_optimized_at")
    .maybeSingle();
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  if (!deck) {
    return NextResponse.json({ error: "Deck not found." }, { status: 404 });
  }

  return NextResponse.json({
    deck,
    optimization: {
      reviewsAnalyzed: total,
      againRate: Number((againRate * 100).toFixed(1)),
      hardRate: Number((hardRate * 100).toFixed(1)),
      easyRate: Number((easyRate * 100).toFixed(1)),
    },
  });
}
