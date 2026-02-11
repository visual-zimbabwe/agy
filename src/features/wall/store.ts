import { create } from "zustand";

import type {
  Camera,
  Link,
  LinkType,
  Note,
  PersistedWallState,
  TemplateType,
  WallState,
  Zone,
  ZoneGroup,
} from "@/features/wall/types";

type WallActions = {
  hydrate: (snapshot: PersistedWallState) => void;
  setCamera: (camera: Camera) => void;
  resetSelection: () => void;
  selectNote: (noteId?: string) => void;
  selectZone: (zoneId?: string) => void;
  selectGroup: (groupId?: string) => void;
  selectLink: (linkId?: string) => void;
  setLinkingFromNote: (noteId?: string) => void;
  setLinkType: (linkType: LinkType) => void;
  setTemplateType: (templateType: TemplateType) => void;
  setLastColor: (color: string) => void;
  setSearchOpen: (open: boolean) => void;
  setExportOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  setFlashNote: (noteId?: string) => void;
  setShowClusters: (show: boolean) => void;
  upsertNote: (note: Note) => void;
  patchNote: (noteId: string, patch: Partial<Note>) => void;
  removeNote: (noteId: string) => void;
  upsertZone: (zone: Zone) => void;
  patchZone: (zoneId: string, patch: Partial<Zone>) => void;
  removeZone: (zoneId: string) => void;
  upsertGroup: (group: ZoneGroup) => void;
  patchGroup: (groupId: string, patch: Partial<ZoneGroup>) => void;
  removeGroup: (groupId: string) => void;
  upsertLink: (link: Link) => void;
  patchLink: (linkId: string, patch: Partial<Link>) => void;
  removeLink: (linkId: string) => void;
  undo: () => void;
  redo: () => void;
};

type HistorySnapshot = Pick<WallState, "notes" | "zones" | "zoneGroups" | "links" | "camera"> & {
  lastColor?: string;
};

export type WallStore = WallState &
  WallActions & {
    hydrated: boolean;
    historyPast: HistorySnapshot[];
    historyFuture: HistorySnapshot[];
  };

const historyLimit = 200;

const makeHistorySnapshot = (state: WallStore): HistorySnapshot => ({
  notes: state.notes,
  zones: state.zones,
  zoneGroups: state.zoneGroups,
  links: state.links,
  camera: state.camera,
  lastColor: state.ui.lastColor,
});

const initialCamera: Camera = { x: 0, y: 0, zoom: 1 };

const initialState: WallState = {
  notes: {},
  zones: {},
  zoneGroups: {},
  links: {},
  camera: initialCamera,
  ui: {
    linkType: "cause_effect",
    templateType: "brainstorm",
    isSearchOpen: false,
    isExportOpen: false,
    isShortcutsOpen: false,
    showClusters: false,
  },
};

const applyWithHistory = (state: WallStore, patch: Partial<WallState>) => {
  const nextNotes = patch.notes ?? state.notes;
  const nextZones = patch.zones ?? state.zones;
  const nextZoneGroups = patch.zoneGroups ?? state.zoneGroups;
  const nextLinks = patch.links ?? state.links;
  const nextCamera = patch.camera ?? state.camera;
  const nextUi = patch.ui ?? state.ui;

  const changed =
    nextNotes !== state.notes ||
    nextZones !== state.zones ||
    nextZoneGroups !== state.zoneGroups ||
    nextLinks !== state.links ||
    nextCamera !== state.camera ||
    nextUi !== state.ui;

  if (!changed) {
    return patch;
  }

  const nextPast = [...state.historyPast, makeHistorySnapshot(state)];
  if (nextPast.length > historyLimit) {
    nextPast.splice(0, nextPast.length - historyLimit);
  }

  return {
    ...patch,
    historyPast: nextPast,
    historyFuture: [],
  };
};

export const useWallStore = create<WallStore>((set) => ({
  ...initialState,
  hydrated: false,
  historyPast: [],
  historyFuture: [],

  hydrate: (snapshot) =>
    set((state) => ({
      notes: snapshot.notes,
      zones: snapshot.zones,
      zoneGroups: snapshot.zoneGroups,
      links: snapshot.links,
      camera: snapshot.camera,
      ui: {
        ...state.ui,
        lastColor: snapshot.lastColor,
      },
      hydrated: true,
      historyPast: [],
      historyFuture: [],
    })),

  setCamera: (camera) => set({ camera }),

  resetSelection: () =>
    set((state) => ({
      ui: {
        ...state.ui,
        selectedNoteId: undefined,
        selectedZoneId: undefined,
        selectedGroupId: undefined,
        selectedLinkId: undefined,
        linkingFromNoteId: undefined,
      },
    })),

  selectNote: (noteId) =>
    set((state) => ({
      ui: {
        ...state.ui,
        selectedNoteId: noteId,
        selectedZoneId: undefined,
        selectedGroupId: undefined,
        selectedLinkId: undefined,
      },
    })),

  selectZone: (zoneId) =>
    set((state) => ({
      ui: {
        ...state.ui,
        selectedZoneId: zoneId,
        selectedGroupId: undefined,
        selectedNoteId: undefined,
        selectedLinkId: undefined,
      },
    })),

  selectGroup: (groupId) =>
    set((state) => ({
      ui: {
        ...state.ui,
        selectedGroupId: groupId,
        selectedNoteId: undefined,
        selectedZoneId: undefined,
        selectedLinkId: undefined,
      },
    })),

  selectLink: (linkId) =>
    set((state) => ({
      ui: {
        ...state.ui,
        selectedLinkId: linkId,
        selectedNoteId: undefined,
        selectedZoneId: undefined,
      },
    })),

  setLinkingFromNote: (noteId) =>
    set((state) => ({
      ui: {
        ...state.ui,
        linkingFromNoteId: noteId,
      },
    })),

  setLinkType: (linkType) =>
    set((state) => ({
      ui: {
        ...state.ui,
        linkType,
      },
    })),

  setTemplateType: (templateType) =>
    set((state) => ({
      ui: {
        ...state.ui,
        templateType,
      },
    })),

  setLastColor: (color) => set((state) => ({ ui: { ...state.ui, lastColor: color } })),
  setSearchOpen: (open) => set((state) => ({ ui: { ...state.ui, isSearchOpen: open } })),
  setExportOpen: (open) => set((state) => ({ ui: { ...state.ui, isExportOpen: open } })),
  setShortcutsOpen: (open) =>
    set((state) => ({
      ui: {
        ...state.ui,
        isShortcutsOpen: open,
      },
    })),
  setFlashNote: (noteId) => set((state) => ({ ui: { ...state.ui, flashNoteId: noteId } })),
  setShowClusters: (show) => set((state) => ({ ui: { ...state.ui, showClusters: show } })),

  upsertNote: (note) =>
    set((state) =>
      applyWithHistory(state, {
        notes: {
          ...state.notes,
          [note.id]: note,
        },
      }),
    ),

  patchNote: (noteId, patch) =>
    set((state) => {
      const current = state.notes[noteId];
      if (!current) {
        return state;
      }

      return applyWithHistory(state, {
        notes: {
          ...state.notes,
          [noteId]: {
            ...current,
            ...patch,
            updatedAt: Date.now(),
          },
        },
      });
    }),

  removeNote: (noteId) =>
    set((state) => {
      const rest = { ...state.notes };
      delete rest[noteId];
      const links = Object.fromEntries(
        Object.entries(state.links).filter(([, link]) => link.fromNoteId !== noteId && link.toNoteId !== noteId),
      );
      return applyWithHistory(state, {
        notes: rest,
        links,
        ui: {
          ...state.ui,
          selectedNoteId: state.ui.selectedNoteId === noteId ? undefined : state.ui.selectedNoteId,
          linkingFromNoteId: state.ui.linkingFromNoteId === noteId ? undefined : state.ui.linkingFromNoteId,
        },
      });
    }),

  upsertZone: (zone) =>
    set((state) =>
      applyWithHistory(state, {
        zones: {
          ...state.zones,
          [zone.id]: zone,
        },
      }),
    ),

  patchZone: (zoneId, patch) =>
    set((state) => {
      const current = state.zones[zoneId];
      if (!current) {
        return state;
      }

      return applyWithHistory(state, {
        zones: {
          ...state.zones,
          [zoneId]: {
            ...current,
            ...patch,
            updatedAt: Date.now(),
          },
        },
      });
    }),

  removeZone: (zoneId) =>
    set((state) => {
      const rest = { ...state.zones };
      delete rest[zoneId];
      const zoneGroups = Object.fromEntries(
        Object.entries(state.zoneGroups).map(([groupId, group]) => [
          groupId,
          {
            ...group,
            zoneIds: group.zoneIds.filter((id) => id !== zoneId),
            updatedAt: Date.now(),
          },
        ]),
      );
      return applyWithHistory(state, {
        zones: rest,
        zoneGroups,
        ui: {
          ...state.ui,
          selectedZoneId: state.ui.selectedZoneId === zoneId ? undefined : state.ui.selectedZoneId,
        },
      });
    }),

  upsertGroup: (group) =>
    set((state) =>
      applyWithHistory(state, {
        zoneGroups: {
          ...state.zoneGroups,
          [group.id]: group,
        },
      }),
    ),

  patchGroup: (groupId, patch) =>
    set((state) => {
      const current = state.zoneGroups[groupId];
      if (!current) {
        return state;
      }

      return applyWithHistory(state, {
        zoneGroups: {
          ...state.zoneGroups,
          [groupId]: {
            ...current,
            ...patch,
            updatedAt: Date.now(),
          },
        },
      });
    }),

  removeGroup: (groupId) =>
    set((state) => {
      const remainingGroups = { ...state.zoneGroups };
      delete remainingGroups[groupId];

      const zones = Object.fromEntries(
        Object.entries(state.zones).map(([zoneId, zone]) => [
          zoneId,
          zone.groupId === groupId ? { ...zone, groupId: undefined, updatedAt: Date.now() } : zone,
        ]),
      );

      return applyWithHistory(state, {
        zoneGroups: remainingGroups,
        zones,
        ui: {
          ...state.ui,
          selectedGroupId: state.ui.selectedGroupId === groupId ? undefined : state.ui.selectedGroupId,
        },
      });
    }),

  upsertLink: (link) =>
    set((state) =>
      applyWithHistory(state, {
        links: {
          ...state.links,
          [link.id]: link,
        },
      }),
    ),

  patchLink: (linkId, patch) =>
    set((state) => {
      const current = state.links[linkId];
      if (!current) {
        return state;
      }

      return applyWithHistory(state, {
        links: {
          ...state.links,
          [linkId]: {
            ...current,
            ...patch,
            updatedAt: Date.now(),
          },
        },
      });
    }),

  removeLink: (linkId) =>
    set((state) => {
      const rest = { ...state.links };
      delete rest[linkId];
      return applyWithHistory(state, {
        links: rest,
        ui: {
          ...state.ui,
          selectedLinkId: state.ui.selectedLinkId === linkId ? undefined : state.ui.selectedLinkId,
        },
      });
    }),

  undo: () =>
    set((state) => {
      const previous = state.historyPast[state.historyPast.length - 1];
      if (!previous) {
        return state;
      }

      const remainingPast = state.historyPast.slice(0, -1);
      const nextFuture = [makeHistorySnapshot(state), ...state.historyFuture];
      if (nextFuture.length > historyLimit) {
        nextFuture.splice(historyLimit);
      }

      return {
        notes: previous.notes,
        zones: previous.zones,
        zoneGroups: previous.zoneGroups,
        links: previous.links,
        camera: previous.camera,
        ui: {
          ...state.ui,
          lastColor: previous.lastColor,
          selectedNoteId: undefined,
          selectedZoneId: undefined,
          selectedGroupId: undefined,
          selectedLinkId: undefined,
          linkingFromNoteId: undefined,
        },
        historyPast: remainingPast,
        historyFuture: nextFuture,
      };
    }),

  redo: () =>
    set((state) => {
      const next = state.historyFuture[0];
      if (!next) {
        return state;
      }

      const remainingFuture = state.historyFuture.slice(1);
      const nextPast = [...state.historyPast, makeHistorySnapshot(state)];
      if (nextPast.length > historyLimit) {
        nextPast.splice(0, nextPast.length - historyLimit);
      }

      return {
        notes: next.notes,
        zones: next.zones,
        zoneGroups: next.zoneGroups,
        links: next.links,
        camera: next.camera,
        ui: {
          ...state.ui,
          lastColor: next.lastColor,
          selectedNoteId: undefined,
          selectedZoneId: undefined,
          selectedGroupId: undefined,
          selectedLinkId: undefined,
          linkingFromNoteId: undefined,
        },
        historyPast: nextPast,
        historyFuture: remainingFuture,
      };
    }),
}));

export const selectPersistedSnapshot = (state: WallStore): PersistedWallState => ({
  notes: state.notes,
  zones: state.zones,
  zoneGroups: state.zoneGroups,
  links: state.links,
  camera: state.camera,
  lastColor: state.ui.lastColor,
});
