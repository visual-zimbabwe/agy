import React, { useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import WallCanvas, { NoteEditor } from "./src/components/WallCanvas";
import { CAMERA_DEFAULTS } from "./src/features/wall/constants";
import { loadWallSnapshot, saveWallSnapshot } from "./src/features/wall/storage";
import { selectPersistedSnapshot, useWallStore } from "./src/features/wall/store";

function WallApp() {
  const hydrate = useWallStore((state) => state.hydrate);
  const camera = useWallStore((state) => state.camera);
  const setCamera = useWallStore((state) => state.setCamera);
  const undo = useWallStore((state) => state.undo);
  const redo = useWallStore((state) => state.redo);
  const selectNote = useWallStore((state) => state.selectNote);
  const selectedNoteId = useWallStore((state) => state.ui.selectedNoteId);
  const notes = useWallStore((state) => state.notes);
  const hydrated = useWallStore((state) => state.hydrated);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const snapshot = await loadWallSnapshot();
      if (cancelled) {
        return;
      }
      if (snapshot) {
        hydrate(snapshot);
        return;
      }
      hydrate({
        notes: {},
        camera: CAMERA_DEFAULTS
      });
    };
    void init();
    return () => {
      cancelled = true;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [hydrate]);

  useEffect(() => {
    const unsubscribe = useWallStore.subscribe((state) => {
      if (!state.hydrated) {
        return;
      }
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        void saveWallSnapshot(selectPersistedSnapshot(state));
      }, 280);
    });
    return () => {
      unsubscribe();
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const selectedNote = useMemo(() => (selectedNoteId ? notes[selectedNoteId] : undefined), [notes, selectedNoteId]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Idea Wall Mobile</Text>
        <View style={styles.headerButtons}>
          <Pressable style={styles.headerButton} onPress={undo}>
            <Text style={styles.headerButtonLabel}>Undo</Text>
          </Pressable>
          <Pressable style={styles.headerButton} onPress={redo}>
            <Text style={styles.headerButtonLabel}>Redo</Text>
          </Pressable>
          <Pressable style={styles.headerButton} onPress={() => setCamera({ ...camera, zoom: 1 })}>
            <Text style={styles.headerButtonLabel}>1x</Text>
          </Pressable>
        </View>
      </View>

      {hydrated ? (
        <WallCanvas
          onEditNote={(noteId) => {
            selectNote(noteId);
          }}
        />
      ) : (
        <View style={styles.loading}>
          <Text style={styles.loadingLabel}>Loading wall...</Text>
        </View>
      )}

      {selectedNote ? (
        <View style={styles.editorWrap}>
          <NoteEditor key={selectedNote.id} note={selectedNote} />
          <View style={styles.editorFooter}>
            <Pressable style={styles.closeButton} onPress={() => selectNote(undefined)}>
              <Text style={styles.closeButtonLabel}>Close</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <WallApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  header: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A"
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8
  },
  headerButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  headerButtonLabel: {
    color: "#0F172A",
    fontWeight: "600"
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  loadingLabel: {
    color: "#334155"
  },
  editorWrap: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF"
  },
  editorFooter: {
    paddingHorizontal: 12,
    paddingBottom: 12
  },
  closeButton: {
    backgroundColor: "#0F172A",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10
  },
  closeButtonLabel: {
    color: "#FFFFFF",
    fontWeight: "700"
  }
});
