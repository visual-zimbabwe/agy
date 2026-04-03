import { NextResponse } from "next/server";
import { z } from "zod";

import type { WallShellResponse } from "@/features/wall/types";
import { requireApiUser } from "@/lib/api/auth";

const paramsSchema = z.object({
  wallId: z.string().uuid(),
});

export async function GET(_: Request, context: { params: Promise<{ wallId: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid wall id" }, { status: 400 });
  }

  const wallResult = await auth.supabase
    .from("walls")
    .select("id,title,camera_x,camera_y,camera_zoom,last_color,updated_at,sync_version")
    .eq("id", parsedParams.data.wallId)
    .eq("owner_id", auth.user.id)
    .maybeSingle();

  if (wallResult.error || !wallResult.data) {
    return NextResponse.json({ error: "Wall not found" }, { status: 404 });
  }

  const payload: WallShellResponse = {
    shell: {
      id: wallResult.data.id,
      title: wallResult.data.title ?? undefined,
      camera: {
        x: wallResult.data.camera_x,
        y: wallResult.data.camera_y,
        zoom: wallResult.data.camera_zoom,
      },
      lastColor: wallResult.data.last_color ?? undefined,
      updatedAt: wallResult.data.updated_at ?? undefined,
      syncVersion: wallResult.data.sync_version ?? 0,
    },
  };

  return NextResponse.json(payload);
}
