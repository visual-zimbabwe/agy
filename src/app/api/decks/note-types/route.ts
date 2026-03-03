import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/api/auth";

const noteTypeSchema = z.object({
  name: z.string().trim().min(1).max(120),
  fields: z.array(z.string().trim().min(1).max(80)).min(1),
  frontTemplate: z.string().trim().min(1),
  backTemplate: z.string().trim().min(1),
  css: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = noteTypeSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("deck_note_types")
    .insert({
      owner_id: auth.user.id,
      name: parsed.data.name,
      fields: parsed.data.fields,
      front_template: parsed.data.frontTemplate,
      back_template: parsed.data.backTemplate,
      css: parsed.data.css ?? "",
      is_builtin: false,
      builtin_key: null,
    })
    .select("id,name,builtin_key,fields,front_template,back_template,css,is_builtin,created_at,updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ noteType: data }, { status: 201 });
}
