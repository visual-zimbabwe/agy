import React, { useMemo, useRef, useState } from "react";
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PanResponderGestureState,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import {
  applyTemplate,
  createCanonNote,
  createLink,
  createNote,
  createQuoteNote,
  createZone,
  deleteLink,
  deleteNote,
  deleteZone,
  duplicateNote,
  moveNote,
  moveZone,
  updateLinkType,
  updateNote,
  updateZone
} from "../features/wall/commands";
import { detectClusters } from "../features/wall/cluster";
import { LINK_TYPES, NOTE_COLORS, TEMPLATE_TYPES } from "../features/wall/constants";
import { useWallStore } from "../features/wall/store";
import type { Link, Note, Zone } from "../features/wall/types";

const WORLD_SIZE = 7000;

type WallCanvasProps = {
  onOpenImportExport: () => void;
};

function NoteCard({ note, zoom }: { note: Note; zoom: number }) {
  const linkingFromNoteId = useWallStore((state) => state.ui.linkingFromNoteId);
  const setLinkingFromNote = useWallStore((state) => state.setLinkingFromNote);
  const linkType = useWallStore((state) => state.ui.linkType);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ x: note.x, y: note.y });

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startRef.current = { x: note.x, y: note.y };
          setDragging(true);
        },
        onPanResponderMove: (_evt: GestureResponderEvent, gesture: PanResponderGestureState) => {
          moveNote(note.id, startRef.current.x + gesture.dx / zoom, startRef.current.y + gesture.dy / zoom);
        },
        onPanResponderRelease: (_evt: GestureResponderEvent, gesture: PanResponderGestureState) => {
          const moved = Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3;
          setDragging(false);
          if (moved) {
            return;
          }
          if (linkingFromNoteId && linkingFromNoteId !== note.id) {
            createLink(linkingFromNoteId, note.id, linkType);
            setLinkingFromNote(undefined);
            return;
          }
          useWallStore.getState().selectNote(note.id);
        },
        onPanResponderTerminate: () => {
          setDragging(false);
        }
      }),
    [linkType, linkingFromNoteId, note.id, note.x, note.y, setLinkingFromNote, zoom]
  );

  return (
    <View
      {...responder.panHandlers}
      style={[
        styles.note,
        {
          width: note.w,
          height: note.h,
          left: note.x,
          top: note.y,
          backgroundColor: note.color,
          opacity: dragging ? 0.86 : 1
        }
      ]}
    >
      <Text numberOfLines={6} style={styles.noteText}>
        {note.text.trim() ? note.text : note.noteKind === "quote" ? "Quote note" : note.noteKind === "canon" ? "Canon note" : "Tap to edit"}
      </Text>
      {!!note.tags.length && (
        <Text numberOfLines={1} style={styles.noteTags}>
          {note.tags.map((tag) => `#${tag}`).join(" ")}
        </Text>
      )}
    </View>
  );
}

function ZoneCard({ zone, zoom }: { zone: Zone; zoom: number }) {
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ x: zone.x, y: zone.y });
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startRef.current = { x: zone.x, y: zone.y };
          setDragging(true);
        },
        onPanResponderMove: (_evt: GestureResponderEvent, gesture: PanResponderGestureState) => {
          moveZone(zone.id, startRef.current.x + gesture.dx / zoom, startRef.current.y + gesture.dy / zoom);
        },
        onPanResponderRelease: (_evt: GestureResponderEvent, gesture: PanResponderGestureState) => {
          setDragging(false);
          if (Math.abs(gesture.dx) <= 3 && Math.abs(gesture.dy) <= 3) {
            useWallStore.getState().selectZone(zone.id);
          }
        },
        onPanResponderTerminate: () => setDragging(false)
      }),
    [zone.id, zone.x, zone.y, zoom]
  );

  return (
    <View
      {...responder.panHandlers}
      style={[
        styles.zone,
        {
          width: zone.w,
          height: zone.h,
          left: zone.x,
          top: zone.y,
          borderColor: zone.color,
          backgroundColor: `${zone.color}55`,
          opacity: dragging ? 0.8 : 1
        }
      ]}
    >
      <Text style={styles.zoneLabel}>{zone.label}</Text>
    </View>
  );
}

function LinkLines({ links }: { links: Link[] }) {
  const notes = useWallStore((state) => state.notes);
  return (
    <>
      {links.map((link) => {
        const from = notes[link.fromNoteId];
        const to = notes[link.toNoteId];
        if (!from || !to) {
          return null;
        }
        const x1 = from.x + from.w / 2;
        const y1 = from.y + from.h / 2;
        const x2 = to.x + to.w / 2;
        const y2 = to.y + to.h / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.hypot(dx, dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        const color = LINK_TYPES.find((item) => item.value === link.type)?.color ?? "#64748B";
        return (
          <Pressable
            key={link.id}
            onPress={() => useWallStore.getState().selectLink(link.id)}
            style={[
              styles.linkLine,
              {
                left: x1,
                top: y1,
                width: distance,
                transform: [{ rotate: `${angle}deg` }],
                borderColor: color
              }
            ]}
          />
        );
      })}
    </>
  );
}

export default function WallCanvas({ onOpenImportExport }: WallCanvasProps) {
  const notesById = useWallStore((state) => state.notes);
  const zonesById = useWallStore((state) => state.zones);
  const linksById = useWallStore((state) => state.links);
  const camera = useWallStore((state) => state.camera);
  const setCamera = useWallStore((state) => state.setCamera);
  const resetSelection = useWallStore((state) => state.resetSelection);
  const setSearchOpen = useWallStore((state) => state.setSearchOpen);
  const showClusters = useWallStore((state) => state.ui.showClusters);
  const setShowClusters = useWallStore((state) => state.setShowClusters);
  const setTemplateType = useWallStore((state) => state.setTemplateType);
  const templateType = useWallStore((state) => state.ui.templateType);
  const linkType = useWallStore((state) => state.ui.linkType);
  const setLinkType = useWallStore((state) => state.setLinkType);

  const [viewportW, setViewportW] = useState(360);
  const [viewportH, setViewportH] = useState(640);
  const panStartRef = useRef(camera);
  const notes = useMemo(() => Object.values(notesById).sort((a, b) => a.createdAt - b.createdAt), [notesById]);
  const zones = useMemo(() => Object.values(zonesById).sort((a, b) => a.createdAt - b.createdAt), [zonesById]);
  const links = useMemo(() => Object.values(linksById).sort((a, b) => a.createdAt - b.createdAt), [linksById]);
  const clusters = useMemo(() => detectClusters(notes), [notes]);

  const canvasResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_evt: GestureResponderEvent, gesture: PanResponderGestureState) =>
          Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
        onPanResponderGrant: () => {
          panStartRef.current = camera;
          resetSelection();
        },
        onPanResponderMove: (_evt: GestureResponderEvent, gesture: PanResponderGestureState) => {
          setCamera({
            ...panStartRef.current,
            x: panStartRef.current.x - gesture.dx / camera.zoom,
            y: panStartRef.current.y - gesture.dy / camera.zoom
          });
        }
      }),
    [camera, resetSelection, setCamera]
  );

  return (
    <View style={styles.root}>
      <View style={styles.toolbar}>
        <Pressable style={styles.toolbarButton} onPress={() => createNote(camera.x, camera.y)}>
          <Text style={styles.toolbarButtonLabel}>+Note</Text>
        </Pressable>
        <Pressable style={styles.toolbarButton} onPress={() => createQuoteNote(camera.x + 40, camera.y + 20)}>
          <Text style={styles.toolbarButtonLabel}>+Quote</Text>
        </Pressable>
        <Pressable style={styles.toolbarButton} onPress={() => createCanonNote(camera.x + 80, camera.y + 40)}>
          <Text style={styles.toolbarButtonLabel}>+Canon</Text>
        </Pressable>
        <Pressable style={styles.toolbarButton} onPress={() => createZone(camera.x - 180, camera.y - 120)}>
          <Text style={styles.toolbarButtonLabel}>+Zone</Text>
        </Pressable>
        <Pressable style={styles.toolbarButton} onPress={() => applyTemplate(templateType, camera.x, camera.y)}>
          <Text style={styles.toolbarButtonLabel}>Template</Text>
        </Pressable>
      </View>

      <View style={styles.toolbar}>
        <Pressable
          style={[styles.toolbarButton, showClusters ? styles.toolbarButtonActive : null]}
          onPress={() => setShowClusters(!showClusters)}
        >
          <Text style={styles.toolbarButtonLabel}>Clusters</Text>
        </Pressable>
        <Pressable style={styles.toolbarButton} onPress={() => setSearchOpen(true)}>
          <Text style={styles.toolbarButtonLabel}>Search</Text>
        </Pressable>
        <Pressable style={styles.toolbarButton} onPress={onOpenImportExport}>
          <Text style={styles.toolbarButtonLabel}>Import/Export</Text>
        </Pressable>
        <Pressable style={styles.toolbarButton} onPress={() => setCamera({ ...camera, zoom: Math.max(0.4, camera.zoom - 0.1) })}>
          <Text style={styles.toolbarButtonLabel}>-</Text>
        </Pressable>
        <Pressable style={styles.toolbarButton} onPress={() => setCamera({ ...camera, zoom: Math.min(2.2, camera.zoom + 0.1) })}>
          <Text style={styles.toolbarButtonLabel}>+</Text>
        </Pressable>
      </View>

      <View style={styles.quickSelectors}>
        {TEMPLATE_TYPES.map((template) => (
          <Pressable
            key={template.value}
            style={[styles.chip, templateType === template.value ? styles.chipActive : null]}
            onPress={() => setTemplateType(template.value)}
          >
            <Text style={styles.chipLabel}>{template.label}</Text>
          </Pressable>
        ))}
        {LINK_TYPES.map((type) => (
          <Pressable
            key={type.value}
            style={[styles.chip, linkType === type.value ? styles.chipActive : null]}
            onPress={() => setLinkType(type.value)}
          >
            <Text style={styles.chipLabel}>{type.label}</Text>
          </Pressable>
        ))}
      </View>

      <View
        style={styles.viewport}
        onLayout={(event: LayoutChangeEvent) => {
          setViewportW(event.nativeEvent.layout.width);
          setViewportH(event.nativeEvent.layout.height);
        }}
        {...canvasResponder.panHandlers}
      >
        <View
          style={[
            styles.world,
            {
              width: WORLD_SIZE,
              height: WORLD_SIZE,
              transform: [
                { translateX: viewportW / 2 - camera.x * camera.zoom },
                { translateY: viewportH / 2 - camera.y * camera.zoom },
                { scale: camera.zoom }
              ]
            }
          ]}
        >
          {zones.map((zone) => (
            <ZoneCard key={zone.id} zone={zone} zoom={camera.zoom} />
          ))}
          {showClusters &&
            clusters.map((cluster) => (
              <View
                key={cluster.id}
                style={[
                  styles.clusterOutline,
                  {
                    left: cluster.x,
                    top: cluster.y,
                    width: cluster.w,
                    height: cluster.h
                  }
                ]}
              />
            ))}
          <LinkLines links={links} />
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} zoom={camera.zoom} />
          ))}
        </View>
      </View>
    </View>
  );
}

export function SearchOverlay() {
  const setSearchOpen = useWallStore((state) => state.setSearchOpen);
  const isSearchOpen = useWallStore((state) => state.ui.isSearchOpen);
  const notes = useWallStore((state) => Object.values(state.notes));
  const setCamera = useWallStore((state) => state.setCamera);
  const setFlashNote = useWallStore((state) => state.setFlashNote);
  const [query, setQuery] = useState("");
  if (!isSearchOpen) {
    return null;
  }
  const needle = query.trim().toLowerCase();
  const results = !needle ? notes.slice(0, 20) : notes.filter((note) => note.text.toLowerCase().includes(needle)).slice(0, 20);
  return (
    <View style={styles.overlay}>
      <Text style={styles.overlayTitle}>Search Notes</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search text or tag..."
        placeholderTextColor="#64748B"
        style={styles.overlayInput}
      />
      <View style={styles.resultsList}>
        {results.map((note) => (
          <Pressable
            key={note.id}
            style={styles.resultItem}
            onPress={() => {
              setCamera({ x: note.x + note.w / 2, y: note.y + note.h / 2, zoom: 1.15 });
              useWallStore.getState().selectNote(note.id);
              setFlashNote(note.id);
              setTimeout(() => setFlashNote(undefined), 750);
              setSearchOpen(false);
            }}
          >
            <Text numberOfLines={1} style={styles.resultText}>
              {note.text.trim() || "(empty note)"}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.overlayClose} onPress={() => setSearchOpen(false)}>
        <Text style={styles.overlayCloseText}>Close</Text>
      </Pressable>
    </View>
  );
}

type NoteEditorProps = {
  note: Note;
};

export function NoteEditor({ note }: NoteEditorProps) {
  const [text, setText] = useState(note.text);
  const [tagsInput, setTagsInput] = useState(note.tags.join(", "));
  return (
    <View style={styles.editor}>
      <Text style={styles.editorTitle}>Edit Note</Text>
      <TextInput multiline value={text} onChangeText={setText} style={styles.editorInput} placeholder="Write..." placeholderTextColor="#64748B" />
      <TextInput
        value={tagsInput}
        onChangeText={setTagsInput}
        style={styles.editorInputSingle}
        placeholder="tags, comma separated"
        placeholderTextColor="#64748B"
      />
      <View style={styles.colorRow}>
        {NOTE_COLORS.map((color) => (
          <Pressable
            key={color}
            style={[styles.colorSwatch, { backgroundColor: color }, note.color === color ? styles.activeSwatch : null]}
            onPress={() => updateNote(note.id, { color })}
          />
        ))}
      </View>
      <View style={styles.editorButtons}>
        <Pressable style={styles.secondaryButton} onPress={() => useWallStore.getState().setLinkingFromNote(note.id)}>
          <Text style={styles.secondaryButtonText}>Start Link</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => duplicateNote(note.id)}>
          <Text style={styles.secondaryButtonText}>Duplicate</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => deleteNote(note.id)}>
          <Text style={styles.secondaryButtonText}>Delete</Text>
        </Pressable>
        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            updateNote(note.id, {
              text,
              tags: tagsInput
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
            })
          }
        >
          <Text style={styles.primaryButtonText}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ZoneEditor({ zone }: { zone: Zone }) {
  const [label, setLabel] = useState(zone.label);
  return (
    <View style={styles.editor}>
      <Text style={styles.editorTitle}>Edit Zone</Text>
      <TextInput value={label} onChangeText={setLabel} style={styles.editorInputSingle} />
      <View style={styles.editorButtons}>
        <Pressable style={styles.secondaryButton} onPress={() => deleteZone(zone.id)}>
          <Text style={styles.secondaryButtonText}>Delete</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={() => updateZone(zone.id, { label })}>
          <Text style={styles.primaryButtonText}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function LinkEditor({ link }: { link: Link }) {
  return (
    <View style={styles.editor}>
      <Text style={styles.editorTitle}>Edit Link</Text>
      <View style={styles.colorRow}>
        {LINK_TYPES.map((type) => (
          <Pressable
            key={type.value}
            style={[styles.chip, link.type === type.value ? styles.chipActive : null]}
            onPress={() => updateLinkType(link.id, type.value)}
          >
            <Text style={styles.chipLabel}>{type.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.editorButtons}>
        <Pressable style={styles.secondaryButton} onPress={() => deleteLink(link.id)}>
          <Text style={styles.secondaryButtonText}>Delete Link</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  toolbar: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingBottom: 6,
    flexWrap: "wrap"
  },
  toolbarButton: {
    backgroundColor: "#0F172A",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  toolbarButtonActive: {
    backgroundColor: "#0EA5E9"
  },
  toolbarButtonLabel: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },
  quickSelectors: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 10,
    paddingBottom: 8
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#FFFFFF"
  },
  chipActive: {
    backgroundColor: "#DBEAFE",
    borderColor: "#60A5FA"
  },
  chipLabel: { color: "#0F172A", fontWeight: "600", fontSize: 11 },
  viewport: { flex: 1, overflow: "hidden", borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  world: { position: "absolute", backgroundColor: "#EEF2F7" },
  zone: {
    position: "absolute",
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: "dashed",
    padding: 8
  },
  zoneLabel: { color: "#334155", fontWeight: "700", fontSize: 12 },
  clusterOutline: {
    position: "absolute",
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#F43F5E"
  },
  linkLine: {
    position: "absolute",
    height: 1,
    borderTopWidth: 2
  },
  note: {
    position: "absolute",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    padding: 10
  },
  noteText: { color: "#111827", fontSize: 14 },
  noteTags: { marginTop: 6, color: "#334155", fontSize: 10 },
  overlay: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 70,
    bottom: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    padding: 12
  },
  overlayTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 8 },
  overlayInput: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: "#0F172A"
  },
  resultsList: { flex: 1, marginTop: 10, gap: 6 },
  resultItem: { borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0", paddingHorizontal: 10, paddingVertical: 8 },
  resultText: { color: "#0F172A" },
  overlayClose: { borderRadius: 10, backgroundColor: "#0F172A", paddingVertical: 10, alignItems: "center", marginTop: 8 },
  overlayCloseText: { color: "#FFFFFF", fontWeight: "700" },
  editor: { borderTopWidth: 1, borderTopColor: "#E2E8F0", backgroundColor: "#FFFFFF", padding: 12, gap: 10 },
  editorTitle: { fontWeight: "700", color: "#0F172A", fontSize: 16 },
  editorInput: {
    minHeight: 90,
    maxHeight: 160,
    borderRadius: 12,
    borderColor: "#CBD5E1",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: "top",
    color: "#111827"
  },
  editorInputSingle: {
    borderRadius: 12,
    borderColor: "#CBD5E1",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#111827"
  },
  colorRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  colorSwatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: "#94A3B8" },
  activeSwatch: { borderColor: "#0F172A", borderWidth: 2 },
  editorButtons: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  primaryButton: { backgroundColor: "#0F172A", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700" },
  secondaryButton: { backgroundColor: "#E2E8F0", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  secondaryButtonText: { color: "#0F172A", fontWeight: "600" }
});
