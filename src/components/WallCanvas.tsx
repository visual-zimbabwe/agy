"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Arrow, Group, Layer, Rect, Stage, Text, Transformer } from "react-konva";
import type Konva from "konva";

import { ExportModal, type ExportScope } from "@/components/ExportModal";
import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { NoteSwatches } from "@/components/NoteCard";
import { QuickCaptureBar } from "@/components/QuickCaptureBar";
import { SearchPalette } from "@/components/SearchPalette";
import { ShortcutsHelp } from "@/components/ShortcutsHelp";
import {
  applyTemplate,
  assignZoneToGroup,
  createNote,
  createLink,
  createZone,
  createZoneGroup,
  deleteGroup,
  deleteLink,
  deleteNote,
  deleteZone,
  duplicateNote,
  moveNote,
  moveZone,
  toggleGroupCollapse,
  updateNote,
  updateLinkType,
  updateZone,
} from "@/features/wall/commands";
import { LINK_TYPES, NOTE_DEFAULTS, TEMPLATE_TYPES, ZONE_DEFAULTS } from "@/features/wall/constants";
import { selectPersistedSnapshot, useWallStore } from "@/features/wall/store";
import { createSnapshotSaver, createTimelineRecorder, loadTimelineEntries, loadWallSnapshot, type TimelineEntry } from "@/features/wall/storage";
import type { Link, LinkType, Note, PersistedWallState, TemplateType, Zone } from "@/features/wall/types";
import { clamp, computeContentBounds, detectClusters, notesToMarkdown } from "@/lib/wall-utils";

type EditingState = {
  id: string;
  text: string;
};

type LinkContextMenuState = {
  open: boolean;
  x: number;
  y: number;
  linkId?: string;
};

type Bounds = { x: number; y: number; w: number; h: number };
type TagGroup = { tag: string; noteIds: string[]; bounds: Bounds };
type SelectionBox = { startX: number; startY: number; x: number; y: number; w: number; h: number };

const flashDurationMs = 1200;

const isTypingInField = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null;
  if (!target) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || target.isContentEditable;
};

const toWorldPoint = (screenX: number, screenY: number, camera: { x: number; y: number; zoom: number }) => ({
  x: (screenX - camera.x) / camera.zoom,
  y: (screenY - camera.y) / camera.zoom,
});

const toScreenPoint = (worldX: number, worldY: number, camera: { x: number; y: number; zoom: number }) => ({
  x: worldX * camera.zoom + camera.x,
  y: worldY * camera.zoom + camera.y,
});

const zoneContainsNote = (zone: Zone, note: Note) =>
  note.x < zone.x + zone.w &&
  note.x + note.w > zone.x &&
  note.y < zone.y + zone.h &&
  note.y + note.h > zone.y;

const noteInAnyZone = (note: Note, zones: Zone[]) => zones.some((zone) => zoneContainsNote(zone, note));

const linkColorByType: Record<LinkType, string> = {
  cause_effect: "#ef4444",
  dependency: "#2563eb",
  idea_execution: "#16a34a",
};

const linkStrokeByType: Record<LinkType, number[]> = {
  cause_effect: [0, 0],
  dependency: [8, 6],
  idea_execution: [2, 4],
};

const noteCenter = (note: Note) => ({
  x: note.x + note.w / 2,
  y: note.y + note.h / 2,
});

const linkPoints = (from: Note, to: Note) => {
  const fromCenter = noteCenter(from);
  const toCenter = noteCenter(to);
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / distance;
  const uy = dy / distance;
  const fromInset = Math.min(from.w, from.h) * 0.36;
  const toInset = Math.min(to.w, to.h) * 0.38;

  return {
    points: [
      fromCenter.x + ux * fromInset,
      fromCenter.y + uy * fromInset,
      toCenter.x - ux * toInset,
      toCenter.y - uy * toInset,
    ],
    mid: {
      x: (fromCenter.x + toCenter.x) / 2,
      y: (fromCenter.y + toCenter.y) / 2,
    },
  };
};

const graphPathLinks = (selectedNoteId: string | undefined, links: Link[]) => {
  if (!selectedNoteId) {
    return new Set<string>();
  }

  const outgoing = new Map<string, Link[]>();
  const incoming = new Map<string, Link[]>();
  for (const link of links) {
    const out = outgoing.get(link.fromNoteId) ?? [];
    out.push(link);
    outgoing.set(link.fromNoteId, out);

    const inLinks = incoming.get(link.toNoteId) ?? [];
    inLinks.push(link);
    incoming.set(link.toNoteId, inLinks);
  }

  const traversed = new Set<string>();
  const seenOut = new Set<string>([selectedNoteId]);
  const seenIn = new Set<string>([selectedNoteId]);
  const outQueue = [selectedNoteId];
  const inQueue = [selectedNoteId];

  while (outQueue.length > 0) {
    const node = outQueue.shift();
    if (!node) {
      continue;
    }
    for (const link of outgoing.get(node) ?? []) {
      traversed.add(link.id);
      if (!seenOut.has(link.toNoteId)) {
        seenOut.add(link.toNoteId);
        outQueue.push(link.toNoteId);
      }
    }
  }

  while (inQueue.length > 0) {
    const node = inQueue.shift();
    if (!node) {
      continue;
    }
    for (const link of incoming.get(node) ?? []) {
      traversed.add(link.id);
      if (!seenIn.has(link.fromNoteId)) {
        seenIn.add(link.fromNoteId);
        inQueue.push(link.fromNoteId);
      }
    }
  }

  return traversed;
};

const fitBoundsCamera = (bounds: Bounds, viewport: { w: number; h: number }, padding = 64) => {
  const width = Math.max(1, bounds.w + padding * 2);
  const height = Math.max(1, bounds.h + padding * 2);
  const zoom = clamp(Math.min(viewport.w / width, viewport.h / height), 0.2, 2.2);
  const centerX = bounds.x + bounds.w / 2;
  const centerY = bounds.y + bounds.h / 2;

  return {
    x: viewport.w / 2 - centerX * zoom,
    y: viewport.h / 2 - centerY * zoom,
    zoom,
  };
};

const waitForPaint = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

const downloadDataUrl = (filename: string, dataUrl: string) => {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
};

const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const tagGroupColor = (tag: string) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i += 1) {
    hash = (hash * 31 + tag.charCodeAt(i)) % 360;
  }
  return `hsl(${hash} 80% 45%)`;
};

const recencyIntensity = (updatedAt: number, referenceTs: number, windowMs = 1000 * 60 * 60 * 24 * 7) => {
  const age = Math.max(0, referenceTs - updatedAt);
  return clamp(1 - age / windowMs, 0, 1);
};

const boundsIntersect = (a: Bounds, b: Bounds) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const makeDownloadId = () => new Date().toISOString().replace(/[:.]/g, "-");

export const WallCanvas = () => {
  const notesMap = useWallStore((state) => state.notes);
  const zonesMap = useWallStore((state) => state.zones);
  const zoneGroupsMap = useWallStore((state) => state.zoneGroups);
  const linksMap = useWallStore((state) => state.links);
  const camera = useWallStore((state) => state.camera);
  const ui = useWallStore((state) => state.ui);
  const hydrated = useWallStore((state) => state.hydrated);

  const hydrate = useWallStore((state) => state.hydrate);
  const setCamera = useWallStore((state) => state.setCamera);
  const selectNote = useWallStore((state) => state.selectNote);
  const selectZone = useWallStore((state) => state.selectZone);
  const selectGroup = useWallStore((state) => state.selectGroup);
  const selectLink = useWallStore((state) => state.selectLink);
  const resetSelection = useWallStore((state) => state.resetSelection);
  const setLinkingFromNote = useWallStore((state) => state.setLinkingFromNote);
  const setLinkType = useWallStore((state) => state.setLinkType);
  const setTemplateType = useWallStore((state) => state.setTemplateType);
  const setSearchOpen = useWallStore((state) => state.setSearchOpen);
  const setExportOpen = useWallStore((state) => state.setExportOpen);
  const setShortcutsOpen = useWallStore((state) => state.setShortcutsOpen);
  const setLastColor = useWallStore((state) => state.setLastColor);
  const setFlashNote = useWallStore((state) => state.setFlashNote);
  const setShowClusters = useWallStore((state) => state.setShowClusters);
  const undo = useWallStore((state) => state.undo);
  const redo = useWallStore((state) => state.redo);
  const canUndo = useWallStore((state) => state.historyPast.length > 0);
  const canRedo = useWallStore((state) => state.historyFuture.length > 0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const noteTransformerRef = useRef<Konva.Transformer | null>(null);
  const zoneTransformerRef = useRef<Konva.Transformer | null>(null);
  const noteNodeRefs = useRef<Record<string, Konva.Group | null>>({});
  const zoneNodeRefs = useRef<Record<string, Konva.Group | null>>({});

  const [viewport, setViewport] = useState({ w: 1200, h: 800 });
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [isMiddleDragging, setIsMiddleDragging] = useState(false);
  const [isLeftCanvasDragging, setIsLeftCanvasDragging] = useState(false);
  const [linkMenu, setLinkMenu] = useState<LinkContextMenuState>({ open: false, x: 0, y: 0 });
  const [tagInput, setTagInput] = useState("");
  const [groupLabelInput, setGroupLabelInput] = useState("New Group");
  const [showAutoTagGroups, setShowAutoTagGroups] = useState(true);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [timelineMode, setTimelineMode] = useState(false);
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [wallClockTs, setWallClockTs] = useState(() => Date.now());
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [boxSelectMode, setBoxSelectMode] = useState(false);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const dragSelectionStartRef = useRef<Record<string, { x: number; y: number }> | null>(null);
  const dragAnchorRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const lastTimelineRecordedAt = useRef(0);
  const lastTimelineSerialized = useRef("");
  const activeTimelineEntry = timelineMode
    ? timelineEntries[Math.min(timelineIndex, Math.max(0, timelineEntries.length - 1))]
    : undefined;
  const activeTimelineSnapshot = activeTimelineEntry?.snapshot;
  const renderSnapshot: PersistedWallState = activeTimelineSnapshot ?? {
    notes: notesMap,
    zones: zonesMap,
    zoneGroups: zoneGroupsMap,
    links: linksMap,
    camera,
    lastColor: ui.lastColor,
  };
  const notes = useMemo(() => Object.values(renderSnapshot.notes), [renderSnapshot.notes]);
  const zones = useMemo(() => Object.values(renderSnapshot.zones), [renderSnapshot.zones]);
  const zoneGroups = useMemo(() => Object.values(renderSnapshot.zoneGroups), [renderSnapshot.zoneGroups]);
  const links = useMemo(() => Object.values(renderSnapshot.links), [renderSnapshot.links]);
  const isTimeLocked = timelineMode;

  useEffect(() => {
    const timer = setInterval(() => {
      setWallClockTs(Date.now());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const saver = createSnapshotSaver(320);
    const timelineRecorder = createTimelineRecorder({ delayMs: 1100, minIntervalMs: 1400, maxEntries: 500 });
    let cancelled = false;

    const load = async () => {
      const [snapshot, loadedTimeline] = await Promise.all([loadWallSnapshot(), loadTimelineEntries(500)]);
      if (!cancelled) {
        hydrate(snapshot);
        setTimelineEntries(loadedTimeline);
        if (loadedTimeline.length > 0) {
          setTimelineIndex(loadedTimeline.length - 1);
        }
      }
    };

    void load();

    const unsubscribe = useWallStore.subscribe((state) => {
      if (!state.hydrated) {
        return;
      }
      const snapshot = selectPersistedSnapshot(state);
      saver.schedule(snapshot);
      timelineRecorder.schedule(snapshot);

      const serialized = JSON.stringify(snapshot);
      const now = Date.now();
      if (serialized !== lastTimelineSerialized.current && now - lastTimelineRecordedAt.current > 1400) {
        lastTimelineSerialized.current = serialized;
        lastTimelineRecordedAt.current = now;
        setTimelineEntries((previous) => {
          const next = [...previous, { ts: now, snapshot }];
          if (next.length > 500) {
            next.splice(0, next.length - 500);
          }
          return next;
        });
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
      void saver.flush();
      void timelineRecorder.flush();
    };
  }, [hydrate]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setViewport({
        w: Math.max(600, Math.round(entry.contentRect.width)),
        h: Math.max(420, Math.round(entry.contentRect.height)),
      });
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!ui.selectedNoteId || !noteTransformerRef.current) {
      noteTransformerRef.current?.nodes([]);
      return;
    }

    const node = noteNodeRefs.current[ui.selectedNoteId];
    if (node) {
      noteTransformerRef.current.nodes([node]);
      noteTransformerRef.current.getLayer()?.batchDraw();
    }
  }, [renderSnapshot.notes, ui.selectedNoteId]);

  useEffect(() => {
    if (!ui.selectedZoneId || !zoneTransformerRef.current) {
      zoneTransformerRef.current?.nodes([]);
      return;
    }

    const node = zoneNodeRefs.current[ui.selectedZoneId];
    if (node) {
      zoneTransformerRef.current.nodes([node]);
      zoneTransformerRef.current.getLayer()?.batchDraw();
    }
  }, [renderSnapshot.zones, ui.selectedZoneId]);

  useEffect(() => {
    if (!editing?.id) {
      return;
    }

    const timer = setTimeout(() => {
      updateNote(editing.id, { text: editing.text });
    }, 280);

    return () => clearTimeout(timer);
  }, [editing]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === " ") {
        setIsSpaceDown(true);
      }

      const typing = isTypingInField(event);

      if ((event.key === "?" || (event.shiftKey && event.key === "/")) && !typing) {
        event.preventDefault();
        setShortcutsOpen(!ui.isShortcutsOpen);
        return;
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setExportOpen(false);
        setShortcutsOpen(false);
        setQuickCaptureOpen(false);
        setEditing(null);
        resetSelection();
        setSelectedNoteIds([]);
        selectNote(undefined);
        return;
      }

      if (typing) {
        return;
      }

      const key = event.key.toLowerCase();
      const ctrlOrMeta = event.ctrlKey || event.metaKey;

      if (!ctrlOrMeta && key === "t") {
        event.preventDefault();
        setTimelineMode((previous) => {
          const next = !previous;
          if (next && timelineEntries.length > 0) {
            setTimelineIndex(timelineEntries.length - 1);
          }
          if (!next) {
            setIsTimelinePlaying(false);
          }
          return next;
        });
        return;
      }

      if (!ctrlOrMeta && key === "h") {
        event.preventDefault();
        setShowHeatmap((previous) => !previous);
        return;
      }

      if (!ctrlOrMeta && key === "q") {
        event.preventDefault();
        setQuickCaptureOpen((previous) => !previous);
        return;
      }

      if (ctrlOrMeta && key === "j") {
        event.preventDefault();
        setQuickCaptureOpen((previous) => !previous);
        return;
      }

      if ((key === "n" && !event.altKey) || (ctrlOrMeta && key === "n")) {
        if (isTimeLocked) {
          return;
        }
        event.preventDefault();
        const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
        const createdId = createNote(world.x - NOTE_DEFAULTS.width / 2, world.y - NOTE_DEFAULTS.height / 2, ui.lastColor);
        const createdNote = notesMap[createdId];
        setSelectedNoteIds([createdId]);
        selectNote(createdId);
        setEditing({ id: createdId, text: createdNote?.text ?? "" });
        return;
      }

      if (ctrlOrMeta && key === "k") {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }

      if (ctrlOrMeta && key === "a") {
        event.preventDefault();
        if (isTimeLocked) {
          return;
        }
        const ids = notes.map((note) => note.id);
        setSelectedNoteIds(ids);
        selectNote(ids.length === 1 ? ids[0] : undefined);
        return;
      }

      if (ctrlOrMeta && key === "z") {
        event.preventDefault();
        if (isTimeLocked) {
          return;
        }
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (ctrlOrMeta && key === "y") {
        event.preventDefault();
        if (isTimeLocked) {
          return;
        }
        redo();
        return;
      }

      if (ctrlOrMeta && key === "l") {
        if (isTimeLocked) {
          return;
        }
        event.preventDefault();
        if (ui.selectedNoteId) {
          setLinkingFromNote(ui.selectedNoteId);
        }
        return;
      }

      if ((ctrlOrMeta && key === "d") || (event.shiftKey && key === "d")) {
        if (isTimeLocked) {
          return;
        }
        if (ui.selectedNoteId) {
          event.preventDefault();
          duplicateNote(ui.selectedNoteId);
        }
        return;
      }

      if ((key === "delete" || key === "backspace") && !editing) {
        if (isTimeLocked) {
          return;
        }
        if (selectedNoteIds.length > 1) {
          const ok = window.confirm(`Delete ${selectedNoteIds.length} selected notes?`);
          if (ok) {
            for (const id of selectedNoteIds) {
              deleteNote(id);
            }
            setSelectedNoteIds([]);
            selectNote(undefined);
          }
          return;
        }
        if (ui.selectedNoteId) {
          const ok = window.confirm("Delete selected note?");
          if (ok) {
            deleteNote(ui.selectedNoteId);
          }
          return;
        }

        if (ui.selectedZoneId) {
          const ok = window.confirm("Delete selected zone?");
          if (ok) {
            deleteZone(ui.selectedZoneId);
          }
          return;
        }

        if (ui.selectedLinkId) {
          const ok = window.confirm("Delete selected link?");
          if (ok) {
            deleteLink(ui.selectedLinkId);
          }
          return;
        }

        if (ui.selectedGroupId) {
          const ok = window.confirm("Delete selected zone group?");
          if (ok) {
            deleteGroup(ui.selectedGroupId);
          }
        }
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === " ") {
        setIsSpaceDown(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [
    camera,
    editing,
    isTimeLocked,
    notesMap,
    notes,
    selectedNoteIds,
    resetSelection,
    redo,
    setExportOpen,
    setLinkingFromNote,
    setQuickCaptureOpen,
    setSearchOpen,
    setShortcutsOpen,
    selectNote,
    undo,
    ui.isShortcutsOpen,
    ui.lastColor,
    ui.linkType,
    ui.selectedGroupId,
    ui.selectedLinkId,
    ui.selectedNoteId,
    ui.selectedZoneId,
    timelineEntries.length,
    viewport.h,
    viewport.w,
  ]);

  useEffect(() => {
    if (!ui.flashNoteId) {
      return;
    }

    const timer = setTimeout(() => setFlashNote(undefined), flashDurationMs);
    return () => clearTimeout(timer);
  }, [setFlashNote, ui.flashNoteId]);

  useEffect(() => {
    if (!isTimelinePlaying || timelineEntries.length < 2) {
      return;
    }

    const timer = setInterval(() => {
      setTimelineIndex((previous) => {
        if (previous >= timelineEntries.length - 1) {
          setIsTimelinePlaying(false);
          return previous;
        }
        return previous + 1;
      });
    }, 700);

    return () => clearInterval(timer);
  }, [isTimelinePlaying, timelineEntries.length, timelineMode]);

  useEffect(() => {
    if (!linkMenu.open) {
      return;
    }

    const close = () => setLinkMenu((previous) => ({ ...previous, open: false }));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [linkMenu.open]);

  const collapsedGroupIds = useMemo(
    () => new Set(zoneGroups.filter((group) => group.collapsed).map((group) => group.id)),
    [zoneGroups],
  );
  const visibleZones = useMemo(
    () => zones.filter((zone) => !zone.groupId || !collapsedGroupIds.has(zone.groupId)),
    [collapsedGroupIds, zones],
  );
  const hiddenNotes = useMemo(() => {
    const collapsedZones = zones.filter((zone) => zone.groupId && collapsedGroupIds.has(zone.groupId));
    return new Set(notes.filter((note) => noteInAnyZone(note, collapsedZones)).map((note) => note.id));
  }, [collapsedGroupIds, notes, zones]);
  const visibleNotes = useMemo(() => notes.filter((note) => !hiddenNotes.has(note.id)), [hiddenNotes, notes]);
  const visibleLinks = useMemo(
    () => links.filter((link) => !hiddenNotes.has(link.fromNoteId) && !hiddenNotes.has(link.toNoteId)),
    [hiddenNotes, links],
  );
  const autoTagGroups = useMemo<TagGroup[]>(() => {
    const byTag = new Map<string, Note[]>();
    for (const note of visibleNotes) {
      const uniqueTags = [...new Set(note.tags)];
      for (const tag of uniqueTags) {
        const normalized = tag.trim().toLowerCase();
        if (!normalized) {
          continue;
        }
        const list = byTag.get(normalized) ?? [];
        list.push(note);
        byTag.set(normalized, list);
      }
    }

    return [...byTag.entries()]
      .filter(([, taggedNotes]) => taggedNotes.length > 1)
      .map(([tag, taggedNotes]) => {
        const bounds = computeContentBounds(taggedNotes, []);
        if (!bounds) {
          return null;
        }
        return {
          tag,
          noteIds: taggedNotes.map((note) => note.id),
          bounds: {
            x: bounds.x - 26,
            y: bounds.y - 26,
            w: bounds.w + 52,
            h: bounds.h + 52,
          },
        };
      })
      .filter((group): group is TagGroup => Boolean(group))
      .sort((a, b) => b.noteIds.length - a.noteIds.length || a.tag.localeCompare(b.tag));
  }, [visibleNotes]);
  const clusterBounds = useMemo(() => detectClusters(visibleNotes), [visibleNotes]);
  const pathLinkIds = useMemo(() => graphPathLinks(ui.selectedNoteId, visibleLinks), [ui.selectedNoteId, visibleLinks]);
  const maxViewportWidth = typeof window !== "undefined" ? window.innerWidth : viewport.w;
  const maxViewportHeight = typeof window !== "undefined" ? window.innerHeight : viewport.h;
  const activeSelectedNoteIds = selectedNoteIds.filter((id) => Boolean(renderSnapshot.notes[id]));
  const selectedNotes = activeSelectedNoteIds
    .map((id) => renderSnapshot.notes[id])
    .filter((note): note is Note => Boolean(note));

  const syncPrimarySelection = (ids: string[]) => {
    const nextIds = ids.filter((id) => Boolean(renderSnapshot.notes[id]));
    setSelectedNoteIds(nextIds);
    if (nextIds.length === 1) {
      selectNote(nextIds[0]);
    } else {
      selectNote(undefined);
    }
  };

  const selectSingleNote = (noteId: string) => {
    syncPrimarySelection([noteId]);
    setEditing((previous) => (previous?.id === noteId ? previous : null));
  };

  const toggleSelectNote = (noteId: string) => {
    const exists = activeSelectedNoteIds.includes(noteId);
    const next = exists ? activeSelectedNoteIds.filter((id) => id !== noteId) : [...activeSelectedNoteIds, noteId];
    setSelectedNoteIds(next);
    if (next.length === 1) {
      selectNote(next[0]);
    } else {
      selectNote(undefined);
    }
  };

  const clearNoteSelection = () => {
    setSelectedNoteIds([]);
    selectNote(undefined);
  };

  const applyColorToSelection = (color: string) => {
    if (isTimeLocked) {
      return;
    }
    if (activeSelectedNoteIds.length === 0) {
      if (ui.selectedNoteId) {
        updateNote(ui.selectedNoteId, { color });
      }
      setLastColor(color);
      return;
    }

    for (const id of activeSelectedNoteIds) {
      updateNote(id, { color });
    }
    setLastColor(color);
  };

  const alignSelected = (axis: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
    if (isTimeLocked || selectedNotes.length < 2) {
      return;
    }
    const minX = Math.min(...selectedNotes.map((n) => n.x));
    const maxX = Math.max(...selectedNotes.map((n) => n.x + n.w));
    const minY = Math.min(...selectedNotes.map((n) => n.y));
    const maxY = Math.max(...selectedNotes.map((n) => n.y + n.h));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    for (const note of selectedNotes) {
      if (axis === "left") updateNote(note.id, { x: minX });
      if (axis === "right") updateNote(note.id, { x: maxX - note.w });
      if (axis === "center") updateNote(note.id, { x: centerX - note.w / 2 });
      if (axis === "top") updateNote(note.id, { y: minY });
      if (axis === "bottom") updateNote(note.id, { y: maxY - note.h });
      if (axis === "middle") updateNote(note.id, { y: centerY - note.h / 2 });
    }
  };

  const distributeSelected = (direction: "horizontal" | "vertical") => {
    if (isTimeLocked || selectedNotes.length < 3) {
      return;
    }

    const sorted =
      direction === "horizontal"
        ? [...selectedNotes].sort((a, b) => a.x - b.x)
        : [...selectedNotes].sort((a, b) => a.y - b.y);

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (!first || !last) {
      return;
    }
    const span = direction === "horizontal" ? last.x - first.x : last.y - first.y;
    const gap = span / (sorted.length - 1);

    sorted.forEach((note, index) => {
      if (direction === "horizontal") {
        updateNote(note.id, { x: first.x + gap * index });
      } else {
        updateNote(note.id, { y: first.y + gap * index });
      }
    });
  };

  const makeNoteAtViewportCenter = () => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const id = createNote(world.x - NOTE_DEFAULTS.width / 2, world.y - NOTE_DEFAULTS.height / 2, ui.lastColor);
    syncPrimarySelection([id]);
  };

  const makeZoneAtViewportCenter = () => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    createZone(world.x - ZONE_DEFAULTS.width / 2, world.y - ZONE_DEFAULTS.height / 2, "Zone");
  };

  const applySelectedTemplate = () => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    applyTemplate(ui.templateType, world.x, world.y);
  };

  const addTagToSelectedNote = () => {
    if (isTimeLocked) {
      return;
    }
    const targetIds = activeSelectedNoteIds.length > 0 ? activeSelectedNoteIds : ui.selectedNoteId ? [ui.selectedNoteId] : [];
    if (targetIds.length === 0) {
      return;
    }
    const tag = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (!tag) {
      return;
    }
    for (const noteId of targetIds) {
      const note = renderSnapshot.notes[noteId];
      if (!note || note.tags.includes(tag)) {
        continue;
      }
      updateNote(note.id, { tags: [...note.tags, tag] });
    }
    setTagInput("");
  };

  const removeTagFromSelectedNote = (tag: string) => {
    if (isTimeLocked) {
      return;
    }
    const targetIds = activeSelectedNoteIds.length > 0 ? activeSelectedNoteIds : ui.selectedNoteId ? [ui.selectedNoteId] : [];
    if (targetIds.length === 0) {
      return;
    }
    for (const noteId of targetIds) {
      const note = renderSnapshot.notes[noteId];
      if (!note) {
        continue;
      }
      updateNote(note.id, { tags: note.tags.filter((value) => value !== tag) });
    }
  };

  const createGroupFromSelectedZone = () => {
    if (isTimeLocked) {
      return;
    }
    if (!ui.selectedZoneId) {
      return;
    }
    const label = groupLabelInput.trim() || "Group";
    createZoneGroup(label, [ui.selectedZoneId]);
  };

  const captureNotes = (items: Array<{ text: string; tags: string[] }>) => {
    if (isTimeLocked || items.length === 0) {
      return;
    }

    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const columns = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(items.length))));
    const gapX = NOTE_DEFAULTS.width + 24;
    const gapY = NOTE_DEFAULTS.height + 20;

    const createdIds: string[] = [];
    items.forEach((item, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      const x = world.x + (col - (columns - 1) / 2) * gapX;
      const y = world.y + row * gapY;
      const id = createNote(x, y, ui.lastColor);
      updateNote(id, { text: item.text, tags: item.tags });
      createdIds.push(id);
    });

    syncPrimarySelection(createdIds);
  };

  const resetView = () => {
    const bounds = computeContentBounds(visibleNotes, visibleZones);
    if (!bounds) {
      setCamera({ x: 0, y: 0, zoom: 1 });
      return;
    }

    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    setCamera({
      zoom: 1,
      x: viewport.w / 2 - centerX,
      y: viewport.h / 2 - centerY,
    });
  };

  const focusBounds = (bounds: Bounds) => {
    setCamera(fitBoundsCamera(bounds, viewport));
  };

  const jumpToTimelineDay = (day: string) => {
    if (timelineEntries.length === 0) {
      return;
    }

    const index = (() => {
      for (let i = timelineEntries.length - 1; i >= 0; i -= 1) {
        const candidate = new Date(timelineEntries[i].ts);
        const key = `${candidate.getFullYear()}-${String(candidate.getMonth() + 1).padStart(2, "0")}-${String(
          candidate.getDate(),
        ).padStart(2, "0")}`;
        if (key === day) {
          return i;
        }
      }
      return -1;
    })();

    if (index >= 0) {
      setTimelineMode(true);
      setIsTimelinePlaying(false);
      setTimelineIndex(index);
    }
  };

  const finalizeBoxSelection = () => {
    if (!selectionBox) {
      return;
    }

    const normalized: Bounds = {
      x: Math.min(selectionBox.startX, selectionBox.x),
      y: Math.min(selectionBox.startY, selectionBox.y),
      w: Math.abs(selectionBox.w),
      h: Math.abs(selectionBox.h),
    };

    const hitIds = visibleNotes
      .filter((note) => boundsIntersect(normalized, { x: note.x, y: note.y, w: note.w, h: note.h }))
      .map((note) => note.id);

    syncPrimarySelection(hitIds);
    setSelectionBox(null);
  };

  const focusNote = (noteId: string) => {
    const note = renderSnapshot.notes[noteId];
    if (!note) {
      return;
    }

    const zoom = clamp(Math.max(camera.zoom, 1), 0.2, 2.5);
    setCamera({
      zoom,
      x: viewport.w / 2 - (note.x + note.w / 2) * zoom,
      y: viewport.h / 2 - (note.y + note.h / 2) * zoom,
    });
    syncPrimarySelection([noteId]);
    setFlashNote(noteId);
  };

  const exportPng = async (scope: ExportScope, pixelRatio: number) => {
    if (!stageRef.current) {
      return;
    }

    if (scope === "view") {
      const dataUrl = stageRef.current.toDataURL({ pixelRatio });
      downloadDataUrl(`idea-wall-view-${makeDownloadId()}.png`, dataUrl);
      return;
    }

    const previousCamera = camera;
    let bounds: Bounds | null = null;

    if (scope === "whole") {
      bounds = computeContentBounds(visibleNotes, visibleZones);
    } else if (scope === "selection") {
      const selected = visibleNotes.filter((note) => activeSelectedNoteIds.includes(note.id));
      bounds = computeContentBounds(selected, []);
    } else if (scope === "zone" && ui.selectedZoneId) {
      const zone = renderSnapshot.zones[ui.selectedZoneId];
      if (zone) {
        bounds = { x: zone.x, y: zone.y, w: zone.w, h: zone.h };
      }
    }

    if (!bounds) {
      window.alert("No target content selected for export.");
      return;
    }

    setCamera(fitBoundsCamera(bounds, viewport));
    await waitForPaint();

    const dataUrl = stageRef.current.toDataURL({ pixelRatio });
    downloadDataUrl(`idea-wall-${scope}-${makeDownloadId()}.png`, dataUrl);

    setCamera(previousCamera);
  };

  const exportMarkdown = () => {
    const selectedZone = ui.selectedZoneId ? renderSnapshot.zones[ui.selectedZoneId] : undefined;
    const selectedNotes = activeSelectedNoteIds.length > 0
      ? visibleNotes.filter((note) => activeSelectedNoteIds.includes(note.id))
      : ui.selectedNoteId
      ? visibleNotes.filter((note) => note.id === ui.selectedNoteId)
      : selectedZone
        ? visibleNotes.filter((note) => zoneContainsNote(selectedZone, note))
        : visibleNotes;

    const content = notesToMarkdown(selectedNotes, zones);
    downloadTextFile(`idea-wall-${makeDownloadId()}.md`, content);
    setExportOpen(false);
  };

  const selectedNote = ui.selectedNoteId ? renderSnapshot.notes[ui.selectedNoteId] : undefined;
  const selectedZone = ui.selectedZoneId ? renderSnapshot.zones[ui.selectedZoneId] : undefined;
  const selectedGroup = ui.selectedGroupId ? renderSnapshot.zoneGroups[ui.selectedGroupId] : undefined;
  const displayedTags =
    selectedNotes.length > 1
      ? selectedNotes
          .map((note) => note.tags)
          .reduce<string[]>((common, tags) => (common.length === 0 ? [...tags] : common.filter((tag) => tags.includes(tag))), [])
      : selectedNote?.tags ?? [];

  return (
    <div className="flex h-screen flex-col bg-[radial-gradient(circle_at_top_left,_#fdf1b2_0,_#fff6d8_35%,_#f8f6f1_100%)] text-zinc-900">
      <header className="flex flex-wrap items-center gap-2 border-b border-zinc-300/70 bg-white/70 px-3 py-2 backdrop-blur-md md:px-4">
        <button
          type="button"
          onClick={makeNoteAtViewportCenter}
          disabled={isTimeLocked}
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-45"
        >
          New Note (N)
        </button>
        <button
          type="button"
          onClick={makeZoneAtViewportCenter}
          disabled={isTimeLocked}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium disabled:opacity-45"
        >
          New Zone
        </button>
        <button
          type="button"
          onClick={() => setQuickCaptureOpen((previous) => !previous)}
          disabled={isTimeLocked}
          className={`rounded-lg px-3 py-2 text-sm ${quickCaptureOpen ? "bg-zinc-900 text-white" : "border border-zinc-300 bg-white"} disabled:opacity-45`}
        >
          Quick Capture (Q)
        </button>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          Search (Ctrl+K)
        </button>
        <button
          type="button"
          onClick={() => setExportOpen(true)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          Export
        </button>
        <button
          type="button"
          onClick={resetView}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          Reset View
        </button>
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo || isTimeLocked}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm disabled:opacity-45"
        >
          Undo (Ctrl+Z)
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo || isTimeLocked}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm disabled:opacity-45"
        >
          Redo (Ctrl+Shift+Z)
        </button>
        <button
          type="button"
          onClick={() => setShowClusters(!ui.showClusters)}
          className={`rounded-lg px-3 py-2 text-sm ${
            ui.showClusters ? "bg-zinc-900 text-white" : "border border-zinc-300 bg-white"
          }`}
        >
          Detect Clusters
        </button>
        <button
          type="button"
          onClick={() => setBoxSelectMode((value) => !value)}
          className={`rounded-lg px-3 py-2 text-sm ${boxSelectMode ? "bg-blue-600 text-white" : "border border-zinc-300 bg-white"}`}
        >
          Box Select
        </button>
        <select
          value={ui.linkType}
          onChange={(event) => setLinkType(event.target.value as LinkType)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          {LINK_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            if (isTimeLocked) {
              return;
            }
            if (!ui.selectedNoteId) {
              return;
            }
            setLinkingFromNote(ui.selectedNoteId);
          }}
          disabled={!ui.selectedNoteId || isTimeLocked}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-45"
        >
          {ui.linkingFromNoteId ? "Select target note..." : "Start Link (Ctrl+L)"}
        </button>
        <select
          value={ui.templateType}
          onChange={(event) => setTemplateType(event.target.value as TemplateType)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          {TEMPLATE_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              Template: {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={applySelectedTemplate}
          disabled={isTimeLocked}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm disabled:opacity-45"
        >
          Apply Template
        </button>
        <button
          type="button"
          onClick={() => {
            setTimelineMode((previous) => {
              const next = !previous;
              if (next && timelineEntries.length > 0) {
                setTimelineIndex(timelineEntries.length - 1);
              }
              if (!next) {
                setIsTimelinePlaying(false);
              }
              return next;
            });
          }}
          className={`rounded-lg px-3 py-2 text-sm ${timelineMode ? "bg-zinc-900 text-white" : "border border-zinc-300 bg-white"}`}
        >
          Timeline (T)
        </button>
        <button
          type="button"
          onClick={() => setShowHeatmap((previous) => !previous)}
          className={`rounded-lg px-3 py-2 text-sm ${showHeatmap ? "bg-orange-500 text-white" : "border border-zinc-300 bg-white"}`}
        >
          Heatmap (H)
        </button>

        <div className="mx-1 h-6 w-px bg-zinc-300" />

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => alignSelected("left")}
            disabled={selectedNotes.length < 2 || isTimeLocked}
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs disabled:opacity-40"
          >
            Align L
          </button>
          <button
            type="button"
            onClick={() => alignSelected("center")}
            disabled={selectedNotes.length < 2 || isTimeLocked}
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs disabled:opacity-40"
          >
            Align C
          </button>
          <button
            type="button"
            onClick={() => alignSelected("right")}
            disabled={selectedNotes.length < 2 || isTimeLocked}
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs disabled:opacity-40"
          >
            Align R
          </button>
          <button
            type="button"
            onClick={() => alignSelected("top")}
            disabled={selectedNotes.length < 2 || isTimeLocked}
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs disabled:opacity-40"
          >
            Align T
          </button>
          <button
            type="button"
            onClick={() => alignSelected("middle")}
            disabled={selectedNotes.length < 2 || isTimeLocked}
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs disabled:opacity-40"
          >
            Align M
          </button>
          <button
            type="button"
            onClick={() => alignSelected("bottom")}
            disabled={selectedNotes.length < 2 || isTimeLocked}
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs disabled:opacity-40"
          >
            Align B
          </button>
          <button
            type="button"
            onClick={() => distributeSelected("horizontal")}
            disabled={selectedNotes.length < 3 || isTimeLocked}
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs disabled:opacity-40"
          >
            Dist H
          </button>
          <button
            type="button"
            onClick={() => distributeSelected("vertical")}
            disabled={selectedNotes.length < 3 || isTimeLocked}
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs disabled:opacity-40"
          >
            Dist V
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Color</span>
          <NoteSwatches
            value={selectedNotes[0]?.color ?? selectedNote?.color ?? ui.lastColor}
            onSelect={(color) => {
              applyColorToSelection(color);
            }}
          />
        </div>

        <div className="mx-1 h-6 w-px bg-zinc-300" />

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Tags</span>
          <input
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addTagToSelectedNote();
              }
            }}
            placeholder={activeSelectedNoteIds.length > 0 || ui.selectedNoteId ? "add-tag" : "select note"}
            disabled={activeSelectedNoteIds.length === 0 && !ui.selectedNoteId ? true : isTimeLocked}
            className="w-28 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs disabled:opacity-40"
          />
          <button
            type="button"
            onClick={addTagToSelectedNote}
            disabled={activeSelectedNoteIds.length === 0 && !ui.selectedNoteId ? true : isTimeLocked}
            className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs disabled:opacity-40"
          >
            Add
          </button>
          {displayedTags.slice(0, 3).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => removeTagFromSelectedNote(tag)}
              disabled={isTimeLocked}
              className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] text-zinc-700"
              title="Remove tag"
            >
              #{tag}
            </button>
          ))}
        </div>

        <div className="ml-auto text-xs text-zinc-600">
          {activeSelectedNoteIds.length > 1
            ? `${activeSelectedNoteIds.length} notes selected`
            : ui.linkingFromNoteId
            ? `Link mode: pick a target note for ${renderSnapshot.notes[ui.linkingFromNoteId]?.text.split("\n")[0] || "selected note"}`
            : "Press `?` for shortcuts"}
        </div>
      </header>

      <div
        ref={containerRef}
        className={`relative flex-1 overflow-hidden ${
          isSpaceDown || isMiddleDragging || isLeftCanvasDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onMouseUp={() => {
          setIsMiddleDragging(false);
          setIsLeftCanvasDragging(false);
          finalizeBoxSelection();
        }}
        onMouseLeave={() => {
          setIsMiddleDragging(false);
          setIsLeftCanvasDragging(false);
          finalizeBoxSelection();
        }}
        onContextMenu={(event) => {
          event.preventDefault();
        }}
      >
        {!hydrated && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-white/60 backdrop-blur-sm">
            <p className="rounded-lg bg-white px-4 py-2 text-sm text-zinc-700 shadow">Loading wall...</p>
          </div>
        )}

        <Stage
          ref={(node) => {
            stageRef.current = node;
          }}
          width={viewport.w}
          height={viewport.h}
          x={camera.x}
          y={camera.y}
          scaleX={camera.zoom}
          scaleY={camera.zoom}
          draggable={isSpaceDown || isMiddleDragging || (isLeftCanvasDragging && !boxSelectMode)}
          onMouseDown={(event) => {
            const stage = event.target.getStage();
            if (event.evt.button === 1) {
              setIsMiddleDragging(true);
            }

            const clickedOnEmpty = event.target === stage;
            if (clickedOnEmpty) {
              if (event.evt.button === 0) {
                if (boxSelectMode && !isTimeLocked) {
                  const pointer = stage?.getPointerPosition();
                  if (pointer) {
                    const start = toWorldPoint(pointer.x, pointer.y, camera);
                    setSelectionBox({
                      startX: start.x,
                      startY: start.y,
                      x: start.x,
                      y: start.y,
                      w: 0,
                      h: 0,
                    });
                  }
                } else {
                  setIsLeftCanvasDragging(true);
                  stage?.startDrag();
                }
              }
              resetSelection();
              clearNoteSelection();
              setEditing(null);
            }
          }}
          onMouseMove={(event) => {
            if (!selectionBox) {
              return;
            }
            const stage = event.target.getStage();
            const pointer = stage?.getPointerPosition();
            if (!pointer) {
              return;
            }
            const current = toWorldPoint(pointer.x, pointer.y, camera);
            setSelectionBox((previous) =>
              previous
                ? {
                    ...previous,
                    x: current.x,
                    y: current.y,
                    w: current.x - previous.startX,
                    h: current.y - previous.startY,
                  }
                : previous,
            );
          }}
          onDragEnd={(event) => {
            const stage = event.target.getStage();
            if (!stage || event.target !== stage) {
              return;
            }
            setCamera({ ...camera, x: stage.x(), y: stage.y() });
            setIsLeftCanvasDragging(false);
            setIsMiddleDragging(false);
          }}
          onWheel={(event) => {
            event.evt.preventDefault();

            const stage = event.target.getStage();
            if (!stage) {
              return;
            }

            const pointer = stage.getPointerPosition();
            if (!pointer) {
              return;
            }

            if (event.evt.ctrlKey || event.evt.metaKey) {
              const oldScale = camera.zoom;
              const scaleBy = 1.06;
              const direction = event.evt.deltaY > 0 ? -1 : 1;
              const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
              const zoom = clamp(newScale, 0.2, 2.8);

              const mousePoint = {
                x: (pointer.x - camera.x) / oldScale,
                y: (pointer.y - camera.y) / oldScale,
              };

              setCamera({
                zoom,
                x: pointer.x - mousePoint.x * zoom,
                y: pointer.y - mousePoint.y * zoom,
              });
            } else {
              setCamera({
                ...camera,
                x: camera.x - event.evt.deltaX,
                y: camera.y - event.evt.deltaY,
              });
            }
          }}
        >
          <Layer>
            {visibleLinks.map((link) => {
              const from = renderSnapshot.notes[link.fromNoteId];
              const to = renderSnapshot.notes[link.toNoteId];
              if (!from || !to) {
                return null;
              }

              const geometry = linkPoints(from, to);
              const isSelected = ui.selectedLinkId === link.id;
              const inPath = pathLinkIds.has(link.id);
              const showDimmed = Boolean(ui.selectedNoteId) && !inPath;
              const stroke = linkColorByType[link.type];
              const opacity = isSelected ? 1 : showDimmed ? 0.15 : 0.78;

              return (
                <Group
                  key={link.id}
                  onClick={(event) => {
                    event.cancelBubble = true;
                    setLinkMenu((previous) => ({ ...previous, open: false }));
                    clearNoteSelection();
                    selectLink(link.id);
                  }}
                  onTap={(event) => {
                    event.cancelBubble = true;
                    setLinkMenu((previous) => ({ ...previous, open: false }));
                    clearNoteSelection();
                    selectLink(link.id);
                  }}
                  onContextMenu={(event) => {
                    event.evt.preventDefault();
                    event.cancelBubble = true;
                    clearNoteSelection();
                    selectLink(link.id);
                    setLinkMenu({
                      open: true,
                      x: event.evt.clientX,
                      y: event.evt.clientY,
                      linkId: link.id,
                    });
                  }}
                >
                  <Arrow
                    points={geometry.points}
                    pointerLength={11}
                    pointerWidth={10}
                    stroke={stroke}
                    fill={stroke}
                    dash={linkStrokeByType[link.type]}
                    strokeWidth={isSelected ? 3.2 : inPath ? 2.6 : 2}
                    opacity={opacity}
                    lineCap="round"
                    lineJoin="round"
                  />
                  <Text
                    x={geometry.mid.x - 48}
                    y={geometry.mid.y - 16}
                    width={96}
                    align="center"
                    fontSize={11}
                    fontStyle="bold"
                    fill={stroke}
                    text={link.label}
                    opacity={opacity}
                  />
                </Group>
              );
            })}

            {visibleZones.map((zone) => {
              const isSelected = ui.selectedZoneId === zone.id;
              return (
                <Group
                  key={zone.id}
                  ref={(node) => {
                    zoneNodeRefs.current[zone.id] = node;
                  }}
                  x={zone.x}
                  y={zone.y}
                  width={zone.w}
                  height={zone.h}
                  draggable={!isTimeLocked}
                  onClick={() => {
                    clearNoteSelection();
                    selectZone(zone.id);
                    if (zone.groupId) {
                      selectGroup(zone.groupId);
                    }
                  }}
                  onTap={() => {
                    clearNoteSelection();
                    selectZone(zone.id);
                    if (zone.groupId) {
                      selectGroup(zone.groupId);
                    }
                  }}
                  onDragEnd={(event) => {
                    if (isTimeLocked) {
                      return;
                    }
                    moveZone(zone.id, event.target.x(), event.target.y());
                  }}
                  onTransformEnd={(event) => {
                    if (isTimeLocked) {
                      return;
                    }
                    const node = event.target;
                    const width = Math.max(ZONE_DEFAULTS.minWidth, node.width() * node.scaleX());
                    const height = Math.max(ZONE_DEFAULTS.minHeight, node.height() * node.scaleY());
                    node.scaleX(1);
                    node.scaleY(1);
                    updateZone(zone.id, { x: node.x(), y: node.y(), w: width, h: height });
                  }}
                >
                  <Rect
                    width={zone.w}
                    height={zone.h}
                    cornerRadius={18}
                    fill={zone.color}
                    opacity={0.38}
                    stroke={isSelected ? "#111827" : "#a1a1aa"}
                    strokeWidth={isSelected ? 2 : 1}
                    dash={[8, 6]}
                  />
                  <Rect width={zone.w} height={34} cornerRadius={18} fill="rgba(255,255,255,0.6)" />
                  <Text x={12} y={8} fontSize={14} fontStyle="bold" text={zone.label || "Zone"} fill="#1f2937" />
                </Group>
              );
            })}

            {visibleNotes.map((note) => {
              const isSelected = activeSelectedNoteIds.includes(note.id) || ui.selectedNoteId === note.id;
              const isFlashing = ui.flashNoteId === note.id;

              return (
                <Group
                  key={note.id}
                  ref={(node) => {
                    noteNodeRefs.current[note.id] = node;
                  }}
                  x={note.x}
                  y={note.y}
                  width={note.w}
                  height={note.h}
                  draggable={!isTimeLocked}
                  onClick={(event) => {
                    if (isTimeLocked) {
                      selectSingleNote(note.id);
                      return;
                    }
                    if (ui.linkingFromNoteId && ui.linkingFromNoteId !== note.id) {
                      createLink(ui.linkingFromNoteId, note.id, ui.linkType);
                      setLinkingFromNote(undefined);
                      return;
                    }
                    if (event.evt.shiftKey || event.evt.ctrlKey || event.evt.metaKey) {
                      toggleSelectNote(note.id);
                    } else {
                      selectSingleNote(note.id);
                    }
                    if (editing?.id !== note.id) {
                      setEditing(null);
                    }
                  }}
                  onTap={(event) => {
                    if (isTimeLocked) {
                      selectSingleNote(note.id);
                      return;
                    }
                    if (ui.linkingFromNoteId && ui.linkingFromNoteId !== note.id) {
                      createLink(ui.linkingFromNoteId, note.id, ui.linkType);
                      setLinkingFromNote(undefined);
                      return;
                    }
                    if (event.evt.shiftKey || event.evt.ctrlKey || event.evt.metaKey) {
                      toggleSelectNote(note.id);
                    } else {
                      selectSingleNote(note.id);
                    }
                  }}
                  onDblClick={() => {
                    if (isTimeLocked) {
                      return;
                    }
                    selectSingleNote(note.id);
                    setEditing({ id: note.id, text: note.text });
                  }}
                  onDragStart={(event) => {
                    if (isTimeLocked) {
                      return;
                    }
                    if (!activeSelectedNoteIds.includes(note.id)) {
                      syncPrimarySelection([note.id]);
                    }
                    const activeIds = activeSelectedNoteIds.includes(note.id) ? activeSelectedNoteIds : [note.id];
                    if (activeIds.length > 1) {
                      dragSelectionStartRef.current = Object.fromEntries(
                        activeIds
                          .map((id) => renderSnapshot.notes[id])
                          .filter((entry): entry is Note => Boolean(entry))
                          .map((entry) => [entry.id, { x: entry.x, y: entry.y }]),
                      );
                      dragAnchorRef.current = { id: note.id, x: event.target.x(), y: event.target.y() };
                    }
                  }}
                  onDragMove={(event) => {
                    if (isTimeLocked) {
                      return;
                    }
                    const anchor = dragAnchorRef.current;
                    const startMap = dragSelectionStartRef.current;
                    if (!anchor || !startMap) {
                      return;
                    }
                    const dx = event.target.x() - anchor.x;
                    const dy = event.target.y() - anchor.y;
                    for (const [id, start] of Object.entries(startMap)) {
                      if (id === note.id) {
                        continue;
                      }
                      updateNote(id, { x: start.x + dx, y: start.y + dy });
                    }
                  }}
                  onDragEnd={(event) => {
                    if (isTimeLocked) {
                      return;
                    }
                    moveNote(note.id, event.target.x(), event.target.y());
                    dragSelectionStartRef.current = null;
                    dragAnchorRef.current = null;
                  }}
                  onTransformEnd={(event) => {
                    if (isTimeLocked) {
                      return;
                    }
                    const node = event.target;
                    const width = Math.max(NOTE_DEFAULTS.minWidth, node.width() * node.scaleX());
                    const height = Math.max(NOTE_DEFAULTS.minHeight, node.height() * node.scaleY());
                    node.scaleX(1);
                    node.scaleY(1);
                    updateNote(note.id, { x: node.x(), y: node.y(), w: width, h: height });
                  }}
                >
                  <Rect
                    width={note.w}
                    height={note.h}
                    cornerRadius={14}
                    fill={note.color}
                    stroke={isSelected ? "#111827" : "#d4d4d8"}
                    strokeWidth={isSelected ? 2 : 1}
                    shadowColor="#101010"
                    shadowBlur={isFlashing ? 28 : 14}
                    shadowOpacity={isFlashing ? 0.36 : 0.18}
                    shadowOffsetY={3}
                  />
                  {showHeatmap && (
                    <Rect
                      width={note.w}
                      height={note.h}
                      cornerRadius={14}
                      fill="#ef4444"
                      opacity={0.08 + recencyIntensity(note.updatedAt, activeTimelineEntry?.ts ?? wallClockTs) * 0.35}
                    />
                  )}
                  <Text
                    x={12}
                    y={12}
                    width={Math.max(0, note.w - 24)}
                    height={Math.max(0, note.h - 48)}
                    fontSize={17}
                    fill="#1f2937"
                    lineHeight={1.35}
                    text={note.text || "Double-click to edit"}
                  />
                  {note.tags.length > 0 && (
                    <Text
                      x={12}
                      y={Math.max(12, note.h - 24)}
                      width={Math.max(0, note.w - 24)}
                      fontSize={12}
                      fill="#374151"
                      text={`#${note.tags.join("  #")}`}
                    />
                  )}
                </Group>
              );
            })}

            {ui.showClusters &&
              clusterBounds.map((cluster, index) => (
                <Rect
                  key={`cluster-${index}`}
                  x={cluster.x}
                  y={cluster.y}
                  width={cluster.w}
                  height={cluster.h}
                  cornerRadius={20}
                  stroke="#fb923c"
                  strokeWidth={2}
                  dash={[10, 8]}
                />
              ))}

            {showAutoTagGroups &&
              autoTagGroups.map((group) => {
                const color = tagGroupColor(group.tag);
                return (
                  <Group key={`tag-group-${group.tag}`}>
                    <Rect
                      x={group.bounds.x}
                      y={group.bounds.y}
                      width={group.bounds.w}
                      height={group.bounds.h}
                      cornerRadius={18}
                      stroke={color}
                      strokeWidth={1.8}
                      dash={[6, 5]}
                      opacity={0.55}
                    />
                    <Text
                      x={group.bounds.x + 10}
                      y={group.bounds.y + 8}
                      fontSize={11}
                      fontStyle="bold"
                      fill={color}
                      text={`#${group.tag} (${group.noteIds.length})`}
                    />
                  </Group>
                );
              })}

            {selectionBox && (
              <Rect
                x={Math.min(selectionBox.startX, selectionBox.x)}
                y={Math.min(selectionBox.startY, selectionBox.y)}
                width={Math.abs(selectionBox.w)}
                height={Math.abs(selectionBox.h)}
                fill="rgba(37,99,235,0.15)"
                stroke="#2563eb"
                strokeWidth={1.2}
                dash={[4, 3]}
              />
            )}

            <Transformer
              ref={(node) => {
                noteTransformerRef.current = node;
              }}
              rotateEnabled={false}
              borderStroke="#111827"
              anchorFill="#111827"
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
                "middle-left",
                "middle-right",
                "top-center",
                "bottom-center",
              ]}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < NOTE_DEFAULTS.minWidth || newBox.height < NOTE_DEFAULTS.minHeight) {
                  return oldBox;
                }
                return newBox;
              }}
            />

            <Transformer
              ref={(node) => {
                zoneTransformerRef.current = node;
              }}
              rotateEnabled={false}
              borderStroke="#334155"
              anchorFill="#334155"
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
                "middle-left",
                "middle-right",
                "top-center",
                "bottom-center",
              ]}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < ZONE_DEFAULTS.minWidth || newBox.height < ZONE_DEFAULTS.minHeight) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          </Layer>
        </Stage>

        {editing && renderSnapshot.notes[editing.id] && !isTimeLocked && (
          <textarea
            autoFocus
            value={editing.text}
            onChange={(event) => setEditing({ id: editing.id, text: event.target.value })}
            onBlur={() => {
              updateNote(editing.id, { text: editing.text });
              setEditing(null);
            }}
            className="absolute resize-none rounded-xl border border-zinc-700/40 bg-white/95 p-3 text-[16px] leading-6 shadow-xl outline-none"
            style={(() => {
              const note = renderSnapshot.notes[editing.id];
              const screen = toScreenPoint(note.x, note.y, camera);
              return {
                left: `${screen.x}px`,
                top: `${screen.y}px`,
                width: `${note.w * camera.zoom}px`,
                height: `${note.h * camera.zoom}px`,
              };
            })()}
          />
        )}

        {linkMenu.open && linkMenu.linkId && renderSnapshot.links[linkMenu.linkId] && (
          <div
            className="fixed z-[70] w-56 rounded-xl border border-zinc-300 bg-white p-2 shadow-2xl"
            style={{
              left: `${Math.max(8, Math.min(linkMenu.x, maxViewportWidth - 232))}px`,
              top: `${Math.max(8, Math.min(linkMenu.y, maxViewportHeight - 210))}px`,
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <p className="px-2 py-1 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">Link Actions</p>
            <button
              type="button"
              className="mt-1 w-full rounded-md px-2 py-2 text-left text-sm text-red-700 hover:bg-red-50"
              disabled={isTimeLocked}
              onClick={() => {
                if (linkMenu.linkId) {
                  deleteLink(linkMenu.linkId);
                }
                setLinkMenu((previous) => ({ ...previous, open: false }));
              }}
            >
              Delete link
            </button>
            <div className="mt-2 border-t border-zinc-200 pt-2">
              <p className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">Change Type</p>
              <div className="space-y-1">
                {LINK_TYPES.map((option) => (
                  <button
                    key={`ctx-${option.value}`}
                    type="button"
                    disabled={isTimeLocked}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-zinc-50"
                    onClick={() => {
                      if (linkMenu.linkId) {
                        updateLinkType(linkMenu.linkId, option.value as LinkType);
                      }
                      setLinkMenu((previous) => ({ ...previous, open: false }));
                    }}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: option.color }} />
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <aside className="pointer-events-auto absolute right-3 top-3 z-30 w-72 rounded-2xl border border-zinc-300/80 bg-white/92 p-3 shadow-xl backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-zinc-900">Zone Groups</h3>
          <p className="mt-1 text-xs text-zinc-600">Collapse groups to hide grouped zones and their notes.</p>

          <div className="mt-2 flex items-center gap-2">
            <input
              value={groupLabelInput}
              onChange={(event) => setGroupLabelInput(event.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
              placeholder="Group name"
            />
            <button
              type="button"
              onClick={createGroupFromSelectedZone}
              disabled={!ui.selectedZoneId || isTimeLocked}
              className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs disabled:opacity-45"
            >
              Group Zone
            </button>
          </div>

          {selectedZone && (
            <div className="mt-2">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                Selected Zone Group
              </label>
              <select
                value={selectedZone.groupId ?? ""}
                onChange={(event) => {
                  if (isTimeLocked) {
                    return;
                  }
                  assignZoneToGroup(selectedZone.id, event.target.value || undefined);
                }}
                disabled={isTimeLocked}
                className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
              >
                <option value="">No group</option>
                {zoneGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-3 max-h-56 space-y-1 overflow-auto pr-1">
            {zoneGroups.length === 0 && <p className="text-xs text-zinc-500">No groups yet.</p>}
            {zoneGroups.map((group) => (
              <div
                key={group.id}
                className={`rounded-lg border px-2 py-2 ${
                  selectedGroup?.id === group.id ? "border-zinc-700 bg-zinc-50" : "border-zinc-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isTimeLocked) {
                        return;
                      }
                      selectGroup(group.id);
                      toggleGroupCollapse(group.id);
                    }}
                    disabled={isTimeLocked}
                    className="rounded-md border border-zinc-300 px-1.5 py-0.5 text-[10px]"
                  >
                    {group.collapsed ? "Expand" : "Collapse"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearNoteSelection();
                      selectGroup(group.id);
                    }}
                    className="min-w-0 flex-1 truncate text-left text-xs font-medium text-zinc-800"
                  >
                    {group.label}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isTimeLocked) {
                        return;
                      }
                      deleteGroup(group.id);
                    }}
                    disabled={isTimeLocked}
                    className="text-[10px] text-red-700"
                  >
                    Delete
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">
                  {group.zoneIds.length} zones {group.collapsed ? "(collapsed)" : "(expanded)"}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 border-t border-zinc-200 pt-3">
            <div className="mb-1 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-600">Tag Groups (Auto)</h4>
              <button
                type="button"
                onClick={() => setShowAutoTagGroups((value) => !value)}
                className="rounded-md border border-zinc-300 px-2 py-0.5 text-[10px]"
              >
                {showAutoTagGroups ? "Hide" : "Show"}
              </button>
            </div>
            {autoTagGroups.length === 0 && <p className="text-xs text-zinc-500">No auto groups yet (need 2+ notes per tag).</p>}
            {autoTagGroups.slice(0, 8).map((group) => (
              <button
                key={`panel-tag-${group.tag}`}
                type="button"
                onClick={() => focusBounds(group.bounds)}
                className="mt-1 flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-left text-xs hover:bg-zinc-50"
              >
                <span className="truncate text-zinc-800">#{group.tag}</span>
                <span className="text-zinc-500">{group.noteIds.length} notes</span>
              </button>
            ))}
          </div>
        </aside>

        {showHeatmap && (
          <div className="pointer-events-auto absolute bottom-3 right-3 z-30">
            <CalendarHeatmap timestamps={timelineEntries.map((entry) => entry.ts)} onSelectDay={jumpToTimelineDay} />
          </div>
        )}

        {timelineMode && timelineEntries.length > 0 && (
          <div className="pointer-events-auto absolute bottom-3 left-1/2 z-30 w-[min(780px,95%)] -translate-x-1/2 rounded-2xl border border-zinc-300 bg-white/95 p-3 shadow-xl backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTimelinePlaying((value) => !value)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium"
              >
                {isTimelinePlaying ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={() => setTimelineIndex(0)}
                className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
              >
                Start
              </button>
              <button
                type="button"
                onClick={() => setTimelineIndex(timelineEntries.length - 1)}
                className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
              >
                Latest
              </button>
              <span className="ml-auto text-xs text-zinc-600">
                {new Date(timelineEntries[Math.min(timelineIndex, timelineEntries.length - 1)].ts).toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, timelineEntries.length - 1)}
              step={1}
              value={Math.min(timelineIndex, timelineEntries.length - 1)}
              onChange={(event) => {
                setIsTimelinePlaying(false);
                setTimelineIndex(Number(event.target.value));
              }}
              className="mt-3 w-full"
            />
          </div>
        )}
      </div>

      <QuickCaptureBar
        open={quickCaptureOpen}
        disabled={isTimeLocked}
        onClose={() => setQuickCaptureOpen(false)}
        onCapture={captureNotes}
      />

      <SearchPalette open={ui.isSearchOpen} notes={notes} onClose={() => setSearchOpen(false)} onSelect={focusNote} />

      <ExportModal
        open={ui.isExportOpen}
        onClose={() => setExportOpen(false)}
        onExportPng={(scope, pixelRatio) => {
          void exportPng(scope, pixelRatio);
        }}
        onExportMarkdown={exportMarkdown}
      />

      <ShortcutsHelp open={ui.isShortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
};
