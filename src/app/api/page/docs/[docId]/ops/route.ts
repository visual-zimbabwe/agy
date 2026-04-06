import { NextResponse } from "next/server";
import { z } from "zod";

import {
  applyPageOperations,
  buildStoredCloudPageSnapshot,
  parseStoredCloudPageSnapshot,
  type PageOperation,
} from "@/features/page/operations";
import { requireApiUser } from "@/lib/api/auth";

const paramsSchema = z.object({
  docId: z.string().trim().min(1).max(120),
});

const operationSchema: z.ZodType<PageOperation> = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("replace_blocks"),
    blocks: z.array(z.any()),
  }),
  z.object({
    type: z.literal("set_camera"),
    camera: z.object({
      x: z.number(),
      y: z.number(),
      zoom: z.number().positive(),
    }),
  }),
  z.object({
    type: z.literal("set_cover"),
    cover: z
      .object({
        path: z.string().optional(),
        externalUrl: z.string().optional(),
        alt: z.string().optional(),
        source: z.enum(["upload", "embed", "unsplash"]).optional(),
        attributionName: z.string().optional(),
        attributionUrl: z.string().optional(),
      })
      .optional(),
  }),
]);

const applyOpsSchema = z.object({
  baseRevision: z.number().int().min(0),
  operations: z.array(operationSchema).min(1),
});

export async function POST(request: Request, context: { params: Promise<{ docId: string }> }) {
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
  const parsedBody = applyOpsSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request", details: parsedBody.error.flatten() }, { status: 400 });
  }

  const existing = await auth.supabase
    .from("page_docs")
    .select("doc_id,snapshot,updated_at,created_at")
    .eq("owner_id", auth.user.id)
    .eq("doc_id", parsedParams.data.docId)
    .maybeSingle();

  if (existing.error) {
    return NextResponse.json({ error: existing.error.message }, { status: 500 });
  }

  const parsedExisting = parseStoredCloudPageSnapshot(existing.data?.snapshot as never);
  if (parsedExisting.revision !== parsedBody.data.baseRevision) {
    return NextResponse.json(
      {
        error: "Revision conflict",
        doc: existing.data
          ? {
              docId: existing.data.doc_id,
              snapshot: parsedExisting.snapshot,
              revision: parsedExisting.revision,
              updatedAt: existing.data.updated_at,
              createdAt: existing.data.created_at,
            }
          : null,
      },
      { status: 409 },
    );
  }

  const nextSnapshot = applyPageOperations(parsedExisting.snapshot, parsedBody.data.operations);
  const nextRevision = parsedExisting.revision + 1;

  const upserted = await auth.supabase
    .from("page_docs")
    .upsert(
      {
        owner_id: auth.user.id,
        doc_id: parsedParams.data.docId,
        snapshot: buildStoredCloudPageSnapshot(nextSnapshot, nextRevision),
      },
      { onConflict: "owner_id,doc_id" },
    )
    .select("doc_id,updated_at,created_at")
    .single();

  if (upserted.error) {
    return NextResponse.json({ error: upserted.error.message }, { status: 500 });
  }

  return NextResponse.json({
    doc: {
      docId: upserted.data.doc_id,
      snapshot: nextSnapshot,
      revision: nextRevision,
      updatedAt: upserted.data.updated_at,
      createdAt: upserted.data.created_at,
    },
  });
}
