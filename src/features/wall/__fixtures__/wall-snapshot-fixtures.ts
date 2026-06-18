import type { Note, PersistedWallState } from "@/features/wall/types";

export const wallSnapshotNoteFixtures = {
  standard: {
    id: "note-1",
    text: "Ship the wall test harness",
    tags: ["qa"],
    textSize: "md",
    x: 120,
    y: 80,
    w: 220,
    h: 160,
    color: "#FEEA89",
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
  } satisfies Note,
  remoteUpdated: {
    id: "note-1",
    text: "Remote edit from delta feed",
    tags: ["qa"],
    textSize: "md",
    x: 120,
    y: 80,
    w: 220,
    h: 160,
    color: "#FEEA89",
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_010_000,
  } satisfies Note,
  localUpdated: {
    id: "note-1",
    text: "Local edit wins on rebase",
    tags: ["qa", "local"],
    textSize: "md",
    x: 140,
    y: 90,
    w: 220,
    h: 160,
    color: "#FEEA89",
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_020_000,
  } satisfies Note,
  privatePlain: {
    id: "private-1",
    text: "Vault contents",
    tags: ["secret"],
    textSize: "md",
    x: 360,
    y: 120,
    w: 220,
    h: 160,
    color: "#E8D5FF",
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
  } satisfies Note,
};

const emptyCollections = {
  zones: {},
  zoneGroups: {},
  noteGroups: {},
  links: {},
  camera: { x: 0, y: 0, zoom: 1 },
} as const;

export const wallSnapshotFixtures = {
  empty: {
    notes: {},
    ...emptyCollections,
  } satisfies PersistedWallState,
  withSingleNote: {
    notes: {
      [wallSnapshotNoteFixtures.standard.id]: wallSnapshotNoteFixtures.standard,
    },
    ...emptyCollections,
  } satisfies PersistedWallState,
  withLocalShadow: (localNote: Note = wallSnapshotNoteFixtures.localUpdated) => ({
    notes: {
      [localNote.id]: localNote,
    },
    ...emptyCollections,
  }) satisfies PersistedWallState,
};

export const wallDeltaChangeFixtures = {
  noteUpdate: (note: Note = wallSnapshotNoteFixtures.remoteUpdated) => ({
    entity_type: "note" as const,
    entity_id: note.id,
    deleted: false,
    payload: note,
  }),
};
