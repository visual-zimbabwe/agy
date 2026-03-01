import React, { useMemo, useRef, useState } from "react";
import {
  type LayoutChangeEvent,
  PanResponder,
  type GestureResponderEvent,
  type PanResponderGestureState,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { createNote, deleteNote, duplicateNote, moveNote, updateNote } from "../features/wall/commands";
import { NOTE_COLORS } from "../features/wall/constants";
import { useWallStore } from "../features/wall/store";
import type { Note } from "../features/wall/types";

const WORLD_SIZE = 6000;

type WallCanvasProps = {
  onEditNote: (noteId: string) => void;
};

function NoteCard({ note, zoom, onEditNote }: { note: Note; zoom: number; onEditNote: (noteId: string) => void }) {
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
          if (!moved) {
            onEditNote(note.id);
          }
        },
        onPanResponderTerminate: () => {
          setDragging(false);
        }
      }),
    [note.id, note.x, note.y, onEditNote, zoom]
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
          opacity: dragging ? 0.84 : 1
        }
      ]}
    >
      <Text style={styles.noteText}>{note.text.trim() ? note.text : "Tap to edit"}</Text>
    </View>
  );
}

export default function WallCanvas({ onEditNote }: WallCanvasProps) {
  const notesById = useWallStore((state) => state.notes);
  const camera = useWallStore((state) => state.camera);
  const setCamera = useWallStore((state) => state.setCamera);
  const selectNote = useWallStore((state) => state.selectNote);

  const [viewportW, setViewportW] = useState(360);
  const [viewportH, setViewportH] = useState(640);
  const [newNotePrompt, setNewNotePrompt] = useState(false);
  const [search, setSearch] = useState("");
  const panStartRef = useRef(camera);

  const notes = useMemo(() => Object.values(notesById).sort((a, b) => a.createdAt - b.createdAt), [notesById]);
  const visibleNotes = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return notes;
    }
    return notes.filter((note) => note.text.toLowerCase().includes(needle));
  }, [notes, search]);

  const canvasResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_evt: GestureResponderEvent, gesture: PanResponderGestureState) =>
          Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
        onPanResponderGrant: () => {
          panStartRef.current = camera;
          selectNote(undefined);
        },
        onPanResponderMove: (_evt: GestureResponderEvent, gesture: PanResponderGestureState) => {
          setCamera({
            ...panStartRef.current,
            x: panStartRef.current.x - gesture.dx / camera.zoom,
            y: panStartRef.current.y - gesture.dy / camera.zoom
          });
        }
      }),
    [camera, selectNote, setCamera]
  );

  return (
    <View style={styles.root}>
      <View style={styles.searchBar}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search notes"
          placeholderTextColor="#64748B"
          style={styles.searchInput}
        />
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
          {visibleNotes.map((note) => (
            <NoteCard key={note.id} note={note} zoom={camera.zoom} onEditNote={onEditNote} />
          ))}
        </View>
      </View>

      <View style={styles.floatingActions}>
        <Pressable
          style={styles.actionButton}
          onPress={() => {
            createNote(camera.x, camera.y);
            setNewNotePrompt(true);
            setTimeout(() => setNewNotePrompt(false), 1600);
          }}
        >
          <Text style={styles.actionButtonLabel}>+ Note</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => setCamera({ ...camera, zoom: Math.max(0.4, Number((camera.zoom - 0.1).toFixed(2))) })}
        >
          <Text style={styles.actionButtonLabel}>-</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => setCamera({ ...camera, zoom: Math.min(2.2, Number((camera.zoom + 0.1).toFixed(2))) })}
        >
          <Text style={styles.actionButtonLabel}>+</Text>
        </Pressable>
      </View>

      {newNotePrompt ? (
        <View style={styles.toast}>
          <Text style={styles.toastLabel}>Note created at center</Text>
        </View>
      ) : null}
    </View>
  );
}

type EditorProps = {
  note: Note;
};

export function NoteEditor({ note }: EditorProps) {
  const [text, setText] = useState(note.text);

  return (
    <View style={styles.editor}>
      <Text style={styles.editorTitle}>Edit Note</Text>
      <TextInput
        multiline
        value={text}
        onChangeText={setText}
        placeholder="Write your idea..."
        placeholderTextColor="#64748B"
        style={styles.editorInput}
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
        <Pressable
          style={styles.secondaryButton}
          onPress={() => {
            duplicateNote(note.id);
          }}
        >
          <Text style={styles.secondaryButtonText}>Duplicate</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => {
            deleteNote(note.id);
          }}
        >
          <Text style={styles.secondaryButtonText}>Delete</Text>
        </Pressable>
        <Pressable
          style={styles.primaryButton}
          onPress={() => {
            updateNote(note.id, { text });
          }}
        >
          <Text style={styles.primaryButtonText}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  searchBar: {
    paddingHorizontal: 12,
    paddingBottom: 8
  },
  searchInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#0F172A"
  },
  viewport: {
    flex: 1,
    overflow: "hidden",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0"
  },
  world: {
    position: "absolute",
    backgroundColor: "#EEF2F7"
  },
  note: {
    position: "absolute",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    padding: 12
  },
  noteText: {
    color: "#111827",
    fontSize: 16
  },
  floatingActions: {
    position: "absolute",
    right: 12,
    bottom: 14,
    gap: 8
  },
  actionButton: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  actionButtonLabel: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  toast: {
    position: "absolute",
    left: 12,
    bottom: 14,
    backgroundColor: "#0F172A",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  toastLabel: {
    color: "#FFFFFF",
    fontSize: 12
  },
  editor: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    padding: 12,
    gap: 10
  },
  editorTitle: {
    fontWeight: "700",
    color: "#0F172A",
    fontSize: 16
  },
  editorInput: {
    minHeight: 96,
    maxHeight: 160,
    borderRadius: 12,
    borderColor: "#CBD5E1",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: "top",
    color: "#111827"
  },
  colorRow: {
    flexDirection: "row",
    gap: 8
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#94A3B8"
  },
  activeSwatch: {
    borderColor: "#0F172A",
    borderWidth: 2
  },
  editorButtons: {
    flexDirection: "row",
    gap: 8
  },
  primaryButton: {
    backgroundColor: "#0F172A",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  secondaryButton: {
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  secondaryButtonText: {
    color: "#0F172A",
    fontWeight: "600"
  }
});
