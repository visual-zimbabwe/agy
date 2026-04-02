import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/walls/[wallId]/sync/route";
import { requireApiUser } from "@/lib/api/auth";

vi.mock("@/lib/api/auth", () => ({
  requireApiUser: vi.fn(),
}));

describe("POST /api/walls/[wallId]/sync", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects stale wall revisions before mutating cloud state", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "wall-1", updated_at: "2026-04-02T12:00:00.000Z" },
      error: null,
    });
    const eqOwner = vi.fn(() => ({ maybeSingle }));
    const eqId = vi.fn(() => ({ eq: eqOwner }));
    const select = vi.fn(() => ({ eq: eqId }));
    const from = vi.fn((table: string) => {
      if (table === "walls") {
        return { select };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(requireApiUser).mockResolvedValue({
      user: { id: "user-1" },
      supabase: { from },
    } as never);

    const request = new Request("http://localhost/api/walls/wall-1/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notes: {},
        zones: {},
        zoneGroups: {},
        noteGroups: {},
        links: {},
        camera: { x: 0, y: 0, zoom: 1 },
        expectedWallUpdatedAt: "2026-04-02T11:00:00.000Z",
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ wallId: "11111111-1111-4111-8111-111111111111" }),
    });
    if (!response) {
      throw new Error("Expected sync route to return a response");
    }

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: "wall_sync_conflict",
      currentWallUpdatedAt: "2026-04-02T12:00:00.000Z",
    });
    expect(from).toHaveBeenCalledTimes(1);
  });
});
