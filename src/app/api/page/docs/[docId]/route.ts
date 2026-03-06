import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/api/auth";

const paramsSchema = z.object({
  docId: z.string().trim().min(1).max(120),
});

const upsertSchema = z.object({
  snapshot: z.unknown(),
});

export async function GET(_: Request, context: { params: Promise<{ docId: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const rawParams = await context.params;
  const parsedParams = paramsSchema.safeParse(rawParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid doc id." }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("page_docs")
    .select("doc_id,snapshot,updated_at,created_at")
    .eq("owner_id", auth.user.id)
    .eq("doc_id", parsedParams.data.docId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    doc: data
      ? {
          docId: data.doc_id,
          snapshot: data.snapshot,
          updatedAt: data.updated_at,
          createdAt: data.created_at,
        }
      : null,
  });
}

export async function PUT(request: Request, context: { params: Promise<{ docId: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const rawParams = await context.params;
  const parsedParams = paramsSchema.safeParse(rawParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid doc id." }, { status: 400 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsedBody = upsertSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsedBody.error.flatten() },
      { status: 400 },
    );
  }

  const { data, error } = await auth.supabase
    .from("page_docs")
    .upsert(
      {
        owner_id: auth.user.id,
        doc_id: parsedParams.data.docId,
        snapshot: parsedBody.data.snapshot,
      },
      { onConflict: "owner_id,doc_id" },
    )
    .select("doc_id,updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    doc: {
      docId: data.doc_id,
      updatedAt: data.updated_at,
    },
  });
}
