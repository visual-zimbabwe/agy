import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/api/auth";

const paramsSchema = z.object({
  cardId: z.string().uuid(),
});

const patchCardSchema = z.object({
  prompt: z.string().optional(),
  answer: z.string().optional(),
  suspended: z.boolean().optional(),
  flagged: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  deckId: z.string().uuid().optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ cardId: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid card id" }, { status: 400 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = patchCardSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data: card, error: cardLookupError } = await auth.supabase
    .from("deck_cards")
    .select("id,note_id,deck_id")
    .eq("id", parsedParams.data.cardId)
    .eq("owner_id", auth.user.id)
    .maybeSingle();

  if (cardLookupError || !card) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  if (parsed.data.prompt !== undefined || parsed.data.answer !== undefined || parsed.data.deckId !== undefined) {
    const nextCardPatch: Record<string, unknown> = {};
    if (parsed.data.prompt !== undefined) {
      nextCardPatch.prompt = parsed.data.prompt;
    }
    if (parsed.data.answer !== undefined) {
      nextCardPatch.answer = parsed.data.answer;
    }
    if (parsed.data.deckId !== undefined) {
      nextCardPatch.deck_id = parsed.data.deckId;
    }
    const { error: cardPatchError } = await auth.supabase
      .from("deck_cards")
      .update(nextCardPatch)
      .eq("id", card.id)
      .eq("owner_id", auth.user.id);
    if (cardPatchError) {
      return NextResponse.json({ error: cardPatchError.message }, { status: 500 });
    }
  }

  if (parsed.data.suspended !== undefined || parsed.data.flagged !== undefined || parsed.data.tags !== undefined || parsed.data.deckId !== undefined) {
    const notePatch: Record<string, unknown> = {};
    if (parsed.data.suspended !== undefined) {
      notePatch.suspended = parsed.data.suspended;
    }
    if (parsed.data.flagged !== undefined) {
      notePatch.flagged = parsed.data.flagged;
    }
    if (parsed.data.tags !== undefined) {
      notePatch.tags = parsed.data.tags;
    }
    if (parsed.data.deckId !== undefined) {
      notePatch.deck_id = parsed.data.deckId;
    }
    const { error: notePatchError } = await auth.supabase
      .from("deck_notes")
      .update(notePatch)
      .eq("id", card.note_id)
      .eq("owner_id", auth.user.id);
    if (notePatchError) {
      return NextResponse.json({ error: notePatchError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, context: { params: Promise<{ cardId: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid card id" }, { status: 400 });
  }

  const { data: card, error: cardLookupError } = await auth.supabase
    .from("deck_cards")
    .select("id,note_id")
    .eq("id", parsedParams.data.cardId)
    .eq("owner_id", auth.user.id)
    .maybeSingle();
  if (cardLookupError || !card) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  const { error: cardDeleteError } = await auth.supabase
    .from("deck_cards")
    .delete()
    .eq("id", card.id)
    .eq("owner_id", auth.user.id);
  if (cardDeleteError) {
    return NextResponse.json({ error: cardDeleteError.message }, { status: 500 });
  }

  const { count, error: remainingError } = await auth.supabase
    .from("deck_cards")
    .select("id", { count: "exact", head: true })
    .eq("note_id", card.note_id)
    .eq("owner_id", auth.user.id);

  if (!remainingError && (count ?? 0) === 0) {
    await auth.supabase.from("deck_notes").delete().eq("id", card.note_id).eq("owner_id", auth.user.id);
  }

  return NextResponse.json({ ok: true });
}
