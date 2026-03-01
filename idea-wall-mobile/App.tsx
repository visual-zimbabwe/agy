import React, { useEffect, useMemo, useRef } from "react";
import { Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import WallCanvas, { LinkEditor, NoteEditor, SearchOverlay, ZoneEditor } from "./src/components/WallCanvas";
import { CAMERA_DEFAULTS } from "./src/features/wall/constants";
import { parseImportedWallJson, exportWallAsJson } from "./src/features/wall/portability";
import { loadWallSnapshot, saveWallSnapshot } from "./src/features/wall/storage";
import { selectPersistedSnapshot, useWallStore } from "./src/features/wall/store";

function WallApp() {
  const hydrate = useWallStore((state) => state.hydrate);
  const camera = useWallStore((state) => state.camera);
  const setCamera = useWallStore((state) => state.setCamera);
  const undo = useWallStore((state) => state.undo);
  const redo = useWallStore((state) => state.redo);
  const selectNote = useWallStore((state) => state.selectNote);
  const selectZone = useWallStore((state) => state.selectZone);
  const selectLink = useWallStore((state) => state.selectLink);
  const selectedZoneId = useWallStore((state) => state.ui.selectedZoneId);
  const selectedLinkId = useWallStore((state) => state.ui.selectedLinkId);
  const selectedNoteId = useWallStore((state) => state.ui.selectedNoteId);
  const setExportOpen = useWallStore((state) => state.setExportOpen);
  const isExportOpen = useWallStore((state) => state.ui.isExportOpen);
  const notes = useWallStore((state) => state.notes);
  const zones = useWallStore((state) => state.zones);
  const links = useWallStore((state) => state.links);
  const hydrated = useWallStore((state) => state.hydrated);
  const hydrateState = useWallStore((state) => state.hydrate);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [importText, setImportText] = React.useState("");

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
        zones: {},
        zoneGroups: {},
        noteGroups: {},
        links: {},
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
  const selectedZone = useMemo(() => (selectedZoneId ? zones[selectedZoneId] : undefined), [selectedZoneId, zones]);
  const selectedLink = useMemo(() => (selectedLinkId ? links[selectedLinkId] : undefined), [links, selectedLinkId]);

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
          onOpenImportExport={() => setExportOpen(true)}
        />
      ) : (
        <View style={styles.loading}>
          <Text style={styles.loadingLabel}>Loading wall...</Text>
        </View>
      )}

      <SearchOverlay />

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

      {!selectedNote && selectedZone ? (
        <View style={styles.editorWrap}>
          <ZoneEditor key={selectedZone.id} zone={selectedZone} />
          <View style={styles.editorFooter}>
            <Pressable style={styles.closeButton} onPress={() => selectZone(undefined)}>
              <Text style={styles.closeButtonLabel}>Close</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {!selectedNote && !selectedZone && selectedLink ? (
        <View style={styles.editorWrap}>
          <LinkEditor key={selectedLink.id} link={selectedLink} />
          <View style={styles.editorFooter}>
            <Pressable style={styles.closeButton} onPress={() => selectLink(undefined)}>
              <Text style={styles.closeButtonLabel}>Close</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {isExportOpen ? (
        <View style={styles.exportSheet}>
          <Text style={styles.exportTitle}>Import / Export</Text>
          <Pressable
            style={styles.headerButton}
            onPress={async () => {
              const payload = exportWallAsJson(selectPersistedSnapshot(useWallStore.getState()));
              await Share.share({ message: payload });
            }}
          >
            <Text style={styles.headerButtonLabel}>Share JSON Export</Text>
          </Pressable>
          <TextInput
            multiline
            placeholder="Paste exported JSON here to import"
            placeholderTextColor="#64748B"
            style={styles.importInput}
            value={importText}
            onChangeText={setImportText}
          />
          <View style={styles.headerButtons}>
            <Pressable
              style={styles.headerButton}
              onPress={() => {
                const imported = parseImportedWallJson(importText);
                if (!imported) {
                  return;
                }
                hydrateState(imported);
                setImportText("");
                setExportOpen(false);
              }}
            >
              <Text style={styles.headerButtonLabel}>Import</Text>
            </Pressable>
            <Pressable style={styles.headerButton} onPress={() => setExportOpen(false)}>
              <Text style={styles.headerButtonLabel}>Close</Text>
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
  },
  exportSheet: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 78,
    bottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    padding: 12,
    gap: 10
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A"
  },
  importInput: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    textAlignVertical: "top",
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: "#111827"
  }
});
