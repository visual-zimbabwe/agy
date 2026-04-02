import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/walls/[wallId]/delta/route";
import { requireApiUser } from "@/lib/api/auth";

vi.mock("@/lib/api/auth", () => ({
  requireApiUser: vi.fn(),
}));

describe("wall delta route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns wall changes since a given version", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "wall-1", sync_version: 12 },
      error: null,
    });
    const selectChangesOrder = vi.fn().mockResolvedValue({
      data: [{ id: 11, entity_type: "note", entity_id: "n1", revision: 11, deleted: false, payload: { id: "n1" }, changed_at: "2026-04-02T12:00:00.000Z" }],
      error: null,
    });
    const selectChangesGt = vi.fn(() => ({ order: selectChangesOrder }));
    const selectChangesEqOwner = vi.fn(() => ({ gt: selectChangesGt }));
    const selectChangesEqWall = vi.fn(() => ({ eq: selectChangesEqOwner }));
    const selectWallEqOwner = vi.fn(() => ({ maybeSingle }));
    const selectWallEqId = vi.fn(() => ({ eq: selectWallEqOwner }));
    const from = vi.fn((table: string) => {
      if (table === "walls") {
        return { select: () => ({ eq: selectWallEqId }) };
      }
      if (table === "wall_changes") {
        return { select: () => ({ eq: selectChangesEqWall }) };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(requireApiUser).mockResolvedValue({
      user: { id: "user-1" },
      supabase: { from },
    } as never);

    const response = await GET(new Request("http://localhost/api/walls/11111111-1111-4111-8111-111111111111/delta?since=10"), {
      params: Promise.resolve({ wallId: "11111111-1111-4111-8111-111111111111" }),
    });
    if (!response) {
      throw new Error("Expected response");
    }

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      currentVersion: 12,
      changes: [{ entity_type: "note", entity_id: "n1" }],
    });
    expect(selectChangesGt).toHaveBeenCalledWith("revision", 10);
    expect(selectChangesOrder).toHaveBeenCalledWith("revision", { ascending: true });
  });

  it("rejects stale delta writes when baseVersion lags the wall sync version", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "wall-1", sync_version: 7 },
      error: null,
    });
    const selectEqOwner = vi.fn(() => ({ maybeSingle }));
    const selectEqId = vi.fn(() => ({ eq: selectEqOwner }));
    const from = vi.fn((table: string) => {
      if (table === "walls") {
        return { select: () => ({ eq: selectEqId }) };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(requireApiUser).mockResolvedValue({
      user: { id: "user-1" },
      supabase: { from },
    } as never);

    const response = await POST(
      new Request("http://localhost/api/walls/11111111-1111-4111-8111-111111111111/delta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseVersion: 3 }),
      }),
      {
        params: Promise.resolve({ wallId: "11111111-1111-4111-8111-111111111111" }),
      },
    );
    if (!response) {
      throw new Error("Expected response");
    }

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: "wall_delta_conflict",
      currentVersion: 7,
    });
  });
});
