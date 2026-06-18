import "fake-indexeddb/auto";

import Dexie from "dexie";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";

import { wallSnapshotFixtures, wallSnapshotNoteFixtures } from "@/features/wall/__fixtures__/wall-snapshot-fixtures";
import { createSnapshotSaver, loadWallLocalStateWithRepair, replaceWallLocalState } from "@/features/wall/storage";

describe("wall P0 local persistence", () => {
  beforeEach(async () => {
    await Dexie.delete("agy-db");
    await Dexie.delete("idea-wall-db");
  });

  it("scheduled save persists note edits that survive reload", async () => {
    const baseline = wallSnapshotFixtures.withSingleNote;
    await replaceWallLocalState(baseline);

    const editedSnapshot = {
      ...wallSnapshotFixtures.withSingleNote,
      notes: {
        [wallSnapshotNoteFixtures.standard.id]: {
          ...wallSnapshotNoteFixtures.standard,
          text: "Persisted after debounce",
          updatedAt: wallSnapshotNoteFixtures.standard.updatedAt + 1,
        },
      },
    };

    const onSuccess = vi.fn();
    const saver = createSnapshotSaver(50, { onSuccess });
    saver.markCommittedSnapshot(baseline);
    saver.schedule(editedSnapshot);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    const reloaded = await loadWallLocalStateWithRepair();
    expect(reloaded.snapshot.notes[wallSnapshotNoteFixtures.standard.id]?.text).toBe("Persisted after debounce");
  });
});
