import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/api/auth";

const paramsSchema = z.object({
  deckId: z.string().uuid(),
});

const patchDeckSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  schedulerMode: z.enum(["legacy", "fsrs"]).optional(),
  fsrsParams: z
    .object({
      desiredRetention: z.number().min(0.7).max(0.99),
      hardFactor: z.number().min(1.05).max(2),
      easyBonus: z.number().min(1.2).max(3),
      againPenalty: z.number().min(0.2).max(0.95),
      learningStepsMinutes: z.array(z.number().int().min(1).max(1440)).min(1).max(6),
      lapseIntervalMinutes: z.number().int().min(1).max(1440),
      minReviewDays: z.number().int().min(1).max(30),
      maxIntervalDays: z.number().int().min(30).max(36500),
    })
    .optional(),
  fsrsOptimizedAt: z.string().datetime().nullable().optional(),
}).refine((value) => value.name !== undefined || value.schedulerMode !== undefined || value.fsrsParams !== undefined || value.fsrsOptimizedAt !== undefined, {
  message: "No changes provided.",
});

export async function PATCH(request: Request, context: { params: Promise<{ deckId: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid deck id." }, { status: 400 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = patchDeckSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) {
    updates.name = parsed.data.name;
  }
  if (parsed.data.schedulerMode !== undefined) {
    updates.scheduler_mode = parsed.data.schedulerMode;
  }
  if (parsed.data.fsrsParams !== undefined) {
    updates.fsrs_params = parsed.data.fsrsParams;
  }
  if (parsed.data.fsrsOptimizedAt !== undefined) {
    updates.fsrs_optimized_at = parsed.data.fsrsOptimizedAt;
  }

  const { data, error } = await auth.supabase
    .from("decks")
    .update(updates)
    .eq("id", parsedParams.data.deckId)
    .eq("owner_id", auth.user.id)
    .select("id,name,scheduler_mode,fsrs_params,fsrs_optimized_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Deck not found." }, { status: 404 });
  }

  return NextResponse.json({ deck: data });
}
