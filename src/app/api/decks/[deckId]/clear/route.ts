import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/api/auth";

const paramsSchema = z.object({
  deckId: z.string().uuid(),
});

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
  const { data: deck, error: deckError } = await auth.supabase
    .from("decks")
    .select("id")
    .eq("id", deckId)
    .eq("owner_id", auth.user.id)
    .maybeSingle();
  if (deckError || !deck) {
    return NextResponse.json({ error: "Deck not found." }, { status: 404 });
  }

  const { error: notesDeleteError } = await auth.supabase
    .from("deck_notes")
    .delete()
    .eq("owner_id", auth.user.id)
    .eq("deck_id", deckId);
  if (notesDeleteError) {
    return NextResponse.json({ error: notesDeleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
