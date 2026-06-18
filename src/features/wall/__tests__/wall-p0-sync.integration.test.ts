import { describe, expect, it } from "vitest";

import {
  wallDeltaChangeFixtures,
  wallSnapshotFixtures,
  wallSnapshotNoteFixtures,
} from "@/features/wall/__fixtures__/wall-snapshot-fixtures";
import { applyWallDeltaChanges, rebaseLocalWallSnapshot, resolveWallBootstrapSnapshot } from "@/features/wall/sync";
import type { PersistedWallState } from "@/features/wall/types";

describe("wall P0 cloud sync helpers", () => {
  it("applies delta changes onto a stored cloud baseline during bootstrap", () => {
    const baseline = wallSnapshotFixtures.withSingleNote;
    const deltaPayload = {
      currentVersion: 4,
      changes: [wallDeltaChangeFixtures.noteUpdate()],
    };

    const merged = applyWallDeltaChanges(baseline, deltaPayload.changes);

    expect(merged.notes[wallSnapshotNoteFixtures.standard.id]?.text).toBe(
      wallSnapshotNoteFixtures.remoteUpdated.text,
    );
  });

  it("rebases local shadow edits onto a newer server snapshot without dropping local wins", () => {
    const serverSnapshot: PersistedWallState = {
      ...wallSnapshotFixtures.withSingleNote,
      notes: {
        ...wallSnapshotFixtures.withSingleNote.notes,
        serverOnly: {
          id: "serverOnly",
          text: "Added remotely",
          tags: [],
          textSize: "md",
          x: 480,
          y: 160,
          w: 220,
          h: 160,
          color: "#FEEA89",
          createdAt: 1_700_000_000_000,
          updatedAt: 1_700_000_015_000,
        },
      },
    };

    const localSnapshot = wallSnapshotFixtures.withLocalShadow();
    const rebased = rebaseLocalWallSnapshot(serverSnapshot, localSnapshot);

    expect(rebased.notes[wallSnapshotNoteFixtures.standard.id]?.text).toBe(
      wallSnapshotNoteFixtures.localUpdated.text,
    );
    expect(rebased.notes.serverOnly?.text).toBe("Added remotely");
  });

  it("detects unsynced local shadow during bootstrap conflict resolution", () => {
    const serverSnapshot = wallSnapshotFixtures.withSingleNote;
    const localBaselineSnapshot = wallSnapshotFixtures.withSingleNote;
    const fullLocalSnapshot = wallSnapshotFixtures.withLocalShadow();

    const resolved = resolveWallBootstrapSnapshot({
      serverSnapshot,
      fullLocalSnapshot,
      localBaselineSnapshot,
      latestLocalSnapshot: fullLocalSnapshot,
      localSyncVersion: 3,
      serverSyncVersion: 3,
    });

    expect(resolved.hasUnsyncedLocalShadow).toBe(true);
    expect(resolved.nextSnapshot).toBe(fullLocalSnapshot);
    expect(resolved.replaySnapshot).toBe(fullLocalSnapshot);
  });
});
