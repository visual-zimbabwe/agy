import { describe, expect, it, vi } from "vitest";

import { __test__ } from "@/app/api/walls/[wallId]/window/route";

describe("GET /api/walls/[wallId]/window batching", () => {
  it("retries with a smaller batch size after a statement timeout", async () => {
    const fetchPage = vi.fn(async (from: number, to: number, batchSize: number) => {
      if (batchSize === 250) {
        return {
          data: null,
          error: { message: "canceling statement due to statement timeout" },
        };
      }

      if (from === 0 && to === 124) {
        return {
          data: [
            { id: "note-2", updated_at: "2026-04-02T12:00:01.000Z" },
            { id: "note-1", updated_at: "2026-04-02T12:00:00.000Z" },
          ],
          error: null,
        };
      }

      return {
        data: [],
        error: null,
      };
    });

    const result = await __test__.fetchBatchedRowsByRecency<{ id: string; updated_at: string }>(fetchPage);

    expect(result.error).toBeNull();
    expect(result.data).toEqual([
      { id: "note-2", updated_at: "2026-04-02T12:00:01.000Z" },
      { id: "note-1", updated_at: "2026-04-02T12:00:00.000Z" },
    ]);
    expect(result.batchSize).toBe(125);
    expect(fetchPage.mock.calls).toEqual([
      [0, 249, 250],
      [0, 124, 125],
    ]);
  });

  it("filters links to only the notes that remain inside the candidate window", () => {
    const filtered = __test__.filterLinksToCandidateNoteIds(
      [
        { from_note_id: "note-1", to_note_id: "note-2" },
        { from_note_id: "note-1", to_note_id: "note-3" },
        { from_note_id: "note-4", to_note_id: "note-2" },
      ],
      new Set(["note-1", "note-2"]),
    );

    expect(filtered).toEqual([{ from_note_id: "note-1", to_note_id: "note-2" }]);
  });
});
