import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/api/auth";

const bulkSchema = z.object({
  cardIds: z.array(z.string().uuid()).min(1),
  action: z.enum(["delete", "suspend", "unsuspend", "flag", "unflag", "move_deck", "add_tag"]),
  deckId: z.string().uuid().optional(),
  tag: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = bulkSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data: cards, error: cardsError } = await auth.supabase
    .from("deck_cards")
    .select("id,note_id")
    .eq("owner_id", auth.user.id)
    .in("id", parsed.data.cardIds);
  if (cardsError) {
    return NextResponse.json({ error: cardsError.message }, { status: 500 });
  }

  const noteIds = [...new Set((cards ?? []).map((entry) => entry.note_id))];
  if (noteIds.length === 0) {
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "delete") {
    const { error } = await auth.supabase.from("deck_cards").delete().eq("owner_id", auth.user.id).in("id", parsed.data.cardIds);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "suspend" || parsed.data.action === "unsuspend" || parsed.data.action === "flag" || parsed.data.action === "unflag") {
    const patch: Record<string, unknown> = {};
    if (parsed.data.action === "suspend") {
      patch.suspended = true;
    } else if (parsed.data.action === "unsuspend") {
      patch.suspended = false;
    } else if (parsed.data.action === "flag") {
      patch.flagged = true;
    } else {
      patch.flagged = false;
    }
    const { error } = await auth.supabase.from("deck_notes").update(patch).eq("owner_id", auth.user.id).in("id", noteIds);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "move_deck") {
    if (!parsed.data.deckId) {
      return NextResponse.json({ error: "deckId is required for move_deck." }, { status: 400 });
    }
    const { error: noteMoveError } = await auth.supabase
      .from("deck_notes")
      .update({ deck_id: parsed.data.deckId })
      .eq("owner_id", auth.user.id)
      .in("id", noteIds);
    if (noteMoveError) {
      return NextResponse.json({ error: noteMoveError.message }, { status: 500 });
    }
    const { error: cardMoveError } = await auth.supabase
      .from("deck_cards")
      .update({ deck_id: parsed.data.deckId })
      .eq("owner_id", auth.user.id)
      .in("id", parsed.data.cardIds);
    if (cardMoveError) {
      return NextResponse.json({ error: cardMoveError.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "add_tag") {
    const tag = (parsed.data.tag ?? "").trim().toLowerCase();
    if (!tag) {
      return NextResponse.json({ error: "tag is required for add_tag." }, { status: 400 });
    }
    const { data: notes, error: notesError } = await auth.supabase
      .from("deck_notes")
      .select("id,tags")
      .eq("owner_id", auth.user.id)
      .in("id", noteIds);
    if (notesError) {
      return NextResponse.json({ error: notesError.message }, { status: 500 });
    }
    for (const note of notes ?? []) {
      const currentTags = Array.isArray(note.tags) ? note.tags.map((entry) => String(entry).toLowerCase()) : [];
      if (!currentTags.includes(tag)) {
        currentTags.push(tag);
      }
      await auth.supabase.from("deck_notes").update({ tags: currentTags }).eq("id", note.id).eq("owner_id", auth.user.id);
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
