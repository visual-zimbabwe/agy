import { beforeEach, describe, expect, it } from "vitest";

import { wallSnapshotNoteFixtures } from "@/features/wall/__fixtures__/wall-snapshot-fixtures";
import {
  createPrivateNoteHiddenFields,
  createPrivateNoteShellPatch,
  decryptPrivateNote,
  encryptPrivateNote,
  isPrivateNote,
} from "@/features/wall/private-notes";
import { useWallStore } from "@/features/wall/store";
import type { PersistedWallState } from "@/features/wall/types";

const emptySnapshot: PersistedWallState = {
  notes: {},
  zones: {},
  zoneGroups: {},
  noteGroups: {},
  links: {},
  camera: { x: 0, y: 0, zoom: 1 },
};

describe("wall P0 private notes", () => {
  beforeEach(() => {
    const state = useWallStore.getState();
    state.hydrate(emptySnapshot);
    state.clearHistory();
    state.resetSelection();
  });

  it("protects, unlocks, edits, and locks a note without leaking plaintext", async () => {
    const password = "phase-five-vault-password";
    const noteId = wallSnapshotNoteFixtures.privatePlain.id;
    const note = wallSnapshotNoteFixtures.privatePlain;

    useWallStore.getState().upsertNote(note);

    const hidden = createPrivateNoteHiddenFields(note);
    const encrypted = await encryptPrivateNote(password, hidden);
    useWallStore.getState().patchNote(noteId, {
      ...createPrivateNoteShellPatch(note),
      privateNote: encrypted,
    });

    const protectedNote = useWallStore.getState().notes[noteId];
    expect(isPrivateNote(protectedNote)).toBe(true);
    expect(protectedNote?.text).toBe("");

    const unlocked = await decryptPrivateNote(password, encrypted);
    expect(unlocked.text).toBe("Vault contents");
    expect(unlocked.tags).toEqual(["secret"]);

    const editedHidden = {
      ...unlocked,
      text: "Updated vault contents",
      tags: [...unlocked.tags, "edited"],
    };
    const reencrypted = await encryptPrivateNote(password, editedHidden);
    useWallStore.getState().patchNote(noteId, {
      ...createPrivateNoteShellPatch(note),
      privateNote: reencrypted,
    });

    const lockedNote = useWallStore.getState().notes[noteId];
    expect(lockedNote?.text).toBe("");
    expect(isPrivateNote(lockedNote)).toBe(true);

    const afterLock = await decryptPrivateNote(password, reencrypted);
    expect(afterLock.text).toBe("Updated vault contents");
    expect(afterLock.tags).toEqual(["secret", "edited"]);

    await expect(decryptPrivateNote("wrong-password", reencrypted)).rejects.toThrow();
  });
});
