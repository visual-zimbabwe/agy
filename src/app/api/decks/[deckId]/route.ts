import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/api/auth";

const paramsSchema = z.object({
  deckId: z.string().uuid(),
});

const patchDeckSchema = z.object({
  name: z.string().trim().min(1).max(120),
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

  const { data, error } = await auth.supabase
    .from("decks")
    .update({ name: parsed.data.name })
    .eq("id", parsedParams.data.deckId)
    .eq("owner_id", auth.user.id)
    .select("id,name")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Deck not found." }, { status: 404 });
  }

  return NextResponse.json({ deck: data });
}
