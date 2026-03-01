import { create } from "zustand";

import { CAMERA_DEFAULTS } from "./constants";
import type {
  Camera,
  Link,
  LinkType,
  Note,
  NoteGroup,
  PersistedWallState,
  TemplateType,
  WallState,
  Zone,
  ZoneGroup
} from "./types";

type WallActions = {
  hydrate: (snapshot: PersistedWallState) => void;
  setCamera: (camera: Camera) => void;
  resetSelection: () => void;
  selectNote: (noteId?: string) => void;
  selectZone: (zoneId?: string) => void;
  selectGroup: (groupId?: string) => void;
  selectNoteGroup: (groupId?: string) => void;
  selectLink: (linkId?: string) => void;
  setLinkingFromNote: (noteId?: string) => void;
  setLinkType: (linkType: LinkType) => void;
  setTemplateType: (templateType: TemplateType) => void;
  setLastColor: (color: string) => void;
  setSearchOpen: (open: boolean) => void;
  setExportOpen: (open: boolean) => void;
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
  upsertNoteGroup: (group: NoteGroup) => void;
  patchNoteGroup: (groupId: string, patch: Partial<NoteGroup>) => void;
  removeNoteGroup: (groupId: string) => void;
  upsertLink: (link: Link) => void;
  patchLink: (linkId: string, patch: Partial<Link>) => void;
  removeLink: (linkId: string) => void;
  beginHistoryGroup: () => void;
  endHistoryGroup: () => void;
  clearHistory: () => void;
  undo: () => void;
  redo: () => void;
};

type HistorySnapshot = Pick<WallState, "notes" | "zones" | "zoneGroups" | "noteGroups" | "links" | "camera"> & {
  lastColor?: string;
};

export type WallStore = WallState &
  WallActions & {
    hydrated: boolean;
    historyPast: HistorySnapshot[];
    historyFuture: HistorySnapshot[];
    historyGroupDepth: number;
    historyGroupSnapshot?: HistorySnapshot;
  };

const historyLimit = 200;

const makeHistorySnapshot = (state: WallStore): HistorySnapshot => ({
  notes: state.notes,
  zones: state.zones,
  zoneGroups: state.zoneGroups,
  noteGroups: state.noteGroups,
  links: state.links,
  camera: state.camera,
  lastColor: state.ui.lastColor
});

const initialState: WallState = {
  notes: {},
  zones: {},
  zoneGroups: {},
  noteGroups: {},
  links: {},
  camera: CAMERA_DEFAULTS,
  ui: {
    linkType: "cause_effect",
    templateType: "brainstorm",
    isSearchOpen: false,
    isExportOpen: false,
    showClusters: false
  }
};

const applyWithHistory = (state: WallStore, patch: Partial<WallState>) => {
  const nextNotes = patch.notes ?? state.notes;
  const nextZones = patch.zones ?? state.zones;
  const nextZoneGroups = patch.zoneGroups ?? state.zoneGroups;
  const nextNoteGroups = patch.noteGroups ?? state.noteGroups;
  const nextLinks = patch.links ?? state.links;
  const nextCamera = patch.camera ?? state.camera;
  const nextUi = patch.ui ?? state.ui;

  const changed =
    nextNotes !== state.notes ||
    nextZones !== state.zones ||
    nextZoneGroups !== state.zoneGroups ||
    nextNoteGroups !== state.noteGroups ||
    nextLinks !== state.links ||
    nextCamera !== state.camera ||
    nextUi !== state.ui;

  if (!changed) {
    return patch;
  }

  if (state.historyGroupDepth > 0) {
    return {
      ...patch,
      historyFuture: [],
      historyGroupSnapshot: state.historyGroupSnapshot ?? makeHistorySnapshot(state)
    };
  }

  const historyPast = [...state.historyPast, makeHistorySnapshot(state)];
  if (historyPast.length > historyLimit) {
    historyPast.splice(0, historyPast.length - historyLimit);
  }
  return {
    ...patch,
    historyPast,
    historyFuture: []
  };
};

export const useWallStore = create<WallStore>((set) => ({
  ...initialState,
  hydrated: false,
  historyPast: [],
  historyFuture: [],
  historyGroupDepth: 0,
  historyGroupSnapshot: undefined,

  hydrate: (snapshot) =>
    set((state) => ({
      notes: snapshot.notes,
      zones: snapshot.zones,
      zoneGroups: snapshot.zoneGroups,
      noteGroups: snapshot.noteGroups,
      links: snapshot.links,
      camera: snapshot.camera,
      ui: {
        ...state.ui,
        lastColor: snapshot.lastColor
      },
      hydrated: true,
      historyPast: [],
      historyFuture: [],
      historyGroupDepth: 0,
      historyGroupSnapshot: undefined
    })),

  setCamera: (camera) => set(() => ({ camera })),

  resetSelection: () =>
    set((state) => ({
      ui: {
        ...state.ui,
        selectedNoteId: undefined,
        selectedZoneId: undefined,
        selectedGroupId: undefined,
        selectedNoteGroupId: undefined,
        selectedLinkId: undefined,
        linkingFromNoteId: undefined
      }
    })),

  selectNote: (noteId) =>
    set((state) => ({
      ui: {
        ...state.ui,
        selectedNoteId: noteId,
        selectedZoneId: undefined,
        selectedGroupId: undefined,
        selectedNoteGroupId: undefined,
        selectedLinkId: undefined
      }
    })),

  selectZone: (zoneId) =>
    set((state) => ({
      ui: {
        ...state.ui,
        selectedZoneId: zoneId,
        selectedGroupId: undefined,
        selectedNoteGroupId: undefined,
        selectedNoteId: undefined,
        selectedLinkId: undefined
      }
    })),

  selectGroup: (groupId) =>
    set((state) => ({
      ui: {
        ...state.ui,
        selectedGroupId: groupId,
        selectedNoteId: undefined,
        selectedZoneId: undefined,
        selectedNoteGroupId: undefined,
        selectedLinkId: undefined
      }
    })),

  selectNoteGroup: (groupId) =>
    set((state) => ({
      ui: {
        ...state.ui,
        selectedNoteGroupId: groupId,
        selectedNoteId: undefined,
        selectedZoneId: undefined,
        selectedGroupId: undefined,
        selectedLinkId: undefined
      }
    })),

  selectLink: (linkId) =>
    set((state) => ({
      ui: {
        ...state.ui,
        selectedLinkId: linkId,
        selectedNoteId: undefined,
        selectedZoneId: undefined,
        selectedNoteGroupId: undefined
      }
    })),

  setLinkingFromNote: (noteId) =>
    set((state) => ({
      ui: {
        ...state.ui,
        linkingFromNoteId: noteId
      }
    })),

  setLinkType: (linkType) =>
    set((state) => ({
      ui: {
        ...state.ui,
        linkType
      }
    })),

  setTemplateType: (templateType) =>
    set((state) => ({
      ui: {
        ...state.ui,
        templateType
      }
    })),

  setLastColor: (lastColor) => set((state) => ({ ui: { ...state.ui, lastColor } })),
  setSearchOpen: (isSearchOpen) => set((state) => ({ ui: { ...state.ui, isSearchOpen } })),
  setExportOpen: (isExportOpen) => set((state) => ({ ui: { ...state.ui, isExportOpen } })),
  setFlashNote: (flashNoteId) => set((state) => ({ ui: { ...state.ui, flashNoteId } })),
  setShowClusters: (showClusters) => set((state) => ({ ui: { ...state.ui, showClusters } })),

  upsertNote: (note) =>
    set((state) =>
      applyWithHistory(state, {
        notes: {
          ...state.notes,
          [note.id]: note
        }
      })
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
            updatedAt: Date.now()
          }
        }
      });
    }),

  removeNote: (noteId) =>
    set((state) => {
      const notes = { ...state.notes };
      if (!notes[noteId]) {
        return state;
      }
      delete notes[noteId];
      const links = Object.fromEntries(
        Object.entries(state.links).filter(([, link]) => link.fromNoteId !== noteId && link.toNoteId !== noteId)
      );
      const noteGroups = Object.fromEntries(
        Object.entries(state.noteGroups).map(([groupId, group]) => [
          groupId,
          {
            ...group,
            noteIds: group.noteIds.filter((id) => id !== noteId),
            updatedAt: Date.now()
          }
        ])
      );
      return applyWithHistory(state, {
        notes,
        links,
        noteGroups,
        ui: {
          ...state.ui,
          selectedNoteId: state.ui.selectedNoteId === noteId ? undefined : state.ui.selectedNoteId,
          linkingFromNoteId: state.ui.linkingFromNoteId === noteId ? undefined : state.ui.linkingFromNoteId
        }
      });
    }),

  upsertZone: (zone) =>
    set((state) =>
      applyWithHistory(state, {
        zones: {
          ...state.zones,
          [zone.id]: zone
        }
      })
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
            updatedAt: Date.now()
          }
        }
      });
    }),

  removeZone: (zoneId) =>
    set((state) => {
      const zones = { ...state.zones };
      if (!zones[zoneId]) {
        return state;
      }
      delete zones[zoneId];
      const zoneGroups = Object.fromEntries(
        Object.entries(state.zoneGroups).map(([groupId, group]) => [
          groupId,
          {
            ...group,
            zoneIds: group.zoneIds.filter((id) => id !== zoneId),
            updatedAt: Date.now()
          }
        ])
      );
      return applyWithHistory(state, {
        zones,
        zoneGroups,
        ui: {
          ...state.ui,
          selectedZoneId: state.ui.selectedZoneId === zoneId ? undefined : state.ui.selectedZoneId
        }
      });
    }),

  upsertGroup: (group) =>
    set((state) =>
      applyWithHistory(state, {
        zoneGroups: {
          ...state.zoneGroups,
          [group.id]: group
        }
      })
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
            updatedAt: Date.now()
          }
        }
      });
    }),

  removeGroup: (groupId) =>
    set((state) => {
      const zoneGroups = { ...state.zoneGroups };
      if (!zoneGroups[groupId]) {
        return state;
      }
      delete zoneGroups[groupId];
      const zones = Object.fromEntries(
        Object.entries(state.zones).map(([zoneId, zone]) => [
          zoneId,
          zone.groupId === groupId ? { ...zone, groupId: undefined, updatedAt: Date.now() } : zone
        ])
      );
      return applyWithHistory(state, {
        zoneGroups,
        zones,
        ui: {
          ...state.ui,
          selectedGroupId: state.ui.selectedGroupId === groupId ? undefined : state.ui.selectedGroupId
        }
      });
    }),

  upsertNoteGroup: (group) =>
    set((state) =>
      applyWithHistory(state, {
        noteGroups: {
          ...state.noteGroups,
          [group.id]: group
        }
      })
    ),

  patchNoteGroup: (groupId, patch) =>
    set((state) => {
      const current = state.noteGroups[groupId];
      if (!current) {
        return state;
      }
      return applyWithHistory(state, {
        noteGroups: {
          ...state.noteGroups,
          [groupId]: {
            ...current,
            ...patch,
            updatedAt: Date.now()
          }
        }
      });
    }),

  removeNoteGroup: (groupId) =>
    set((state) => {
      const noteGroups = { ...state.noteGroups };
      if (!noteGroups[groupId]) {
        return state;
      }
      delete noteGroups[groupId];
      return applyWithHistory(state, {
        noteGroups,
        ui: {
          ...state.ui,
          selectedNoteGroupId: state.ui.selectedNoteGroupId === groupId ? undefined : state.ui.selectedNoteGroupId
        }
      });
    }),

  upsertLink: (link) =>
    set((state) =>
      applyWithHistory(state, {
        links: {
          ...state.links,
          [link.id]: link
        }
      })
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
            updatedAt: Date.now()
          }
        }
      });
    }),

  removeLink: (linkId) =>
    set((state) => {
      const links = { ...state.links };
      if (!links[linkId]) {
        return state;
      }
      delete links[linkId];
      return applyWithHistory(state, {
        links,
        ui: {
          ...state.ui,
          selectedLinkId: state.ui.selectedLinkId === linkId ? undefined : state.ui.selectedLinkId
        }
      });
    }),

  beginHistoryGroup: () => set((state) => ({ historyGroupDepth: state.historyGroupDepth + 1 })),

  endHistoryGroup: () =>
    set((state) => {
      if (state.historyGroupDepth <= 0) {
        return state;
      }
      const nextDepth = state.historyGroupDepth - 1;
      if (nextDepth > 0) {
        return { historyGroupDepth: nextDepth };
      }
      if (!state.historyGroupSnapshot) {
        return { historyGroupDepth: 0, historyGroupSnapshot: undefined };
      }
      const historyPast = [...state.historyPast, state.historyGroupSnapshot];
      if (historyPast.length > historyLimit) {
        historyPast.splice(0, historyPast.length - historyLimit);
      }
      return {
        historyPast,
        historyGroupDepth: 0,
        historyGroupSnapshot: undefined
      };
    }),

  clearHistory: () =>
    set(() => ({
      historyPast: [],
      historyFuture: [],
      historyGroupDepth: 0,
      historyGroupSnapshot: undefined
    })),

  undo: () =>
    set((state) => {
      const previous = state.historyPast[state.historyPast.length - 1];
      if (!previous) {
        return state;
      }
      const historyPast = state.historyPast.slice(0, -1);
      const historyFuture = [makeHistorySnapshot(state), ...state.historyFuture].slice(0, historyLimit);
      return {
        notes: previous.notes,
        zones: previous.zones,
        zoneGroups: previous.zoneGroups,
        noteGroups: previous.noteGroups,
        links: previous.links,
        camera: previous.camera,
        ui: {
          ...state.ui,
          lastColor: previous.lastColor,
          selectedNoteId: undefined,
          selectedZoneId: undefined,
          selectedGroupId: undefined,
          selectedNoteGroupId: undefined,
          selectedLinkId: undefined,
          linkingFromNoteId: undefined
        },
        historyPast,
        historyFuture,
        historyGroupDepth: 0,
        historyGroupSnapshot: undefined
      };
    }),

  redo: () =>
    set((state) => {
      const next = state.historyFuture[0];
      if (!next) {
        return state;
      }
      const historyFuture = state.historyFuture.slice(1);
      const historyPast = [...state.historyPast, makeHistorySnapshot(state)].slice(-historyLimit);
      return {
        notes: next.notes,
        zones: next.zones,
        zoneGroups: next.zoneGroups,
        noteGroups: next.noteGroups,
        links: next.links,
        camera: next.camera,
        ui: {
          ...state.ui,
          lastColor: next.lastColor,
          selectedNoteId: undefined,
          selectedZoneId: undefined,
          selectedGroupId: undefined,
          selectedNoteGroupId: undefined,
          selectedLinkId: undefined,
          linkingFromNoteId: undefined
        },
        historyPast,
        historyFuture,
        historyGroupDepth: 0,
        historyGroupSnapshot: undefined
      };
    })
}));

export const selectPersistedSnapshot = (state: WallStore): PersistedWallState => ({
  notes: state.notes,
  zones: state.zones,
  zoneGroups: state.zoneGroups,
  noteGroups: state.noteGroups,
  links: state.links,
  camera: state.camera,
  lastColor: state.ui.lastColor
});
