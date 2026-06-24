"use client";

import { WallInCanvasChrome, WallChromeHeader } from "@/components/wall/chrome/WallChromeShell";
import { WallSpatialView } from "@/components/wall/spatial/WallSpatialView";
import { PrivateNoteModal } from "@/components/wall/PrivateNoteModal";
import { WallGlobalModals } from "@/components/wall/WallGlobalModals";
import { WallSessionProvider } from "@/components/wall/session/WallSessionProvider";
import { useWallCanvasOrchestration } from "@/components/wall/useWallCanvasOrchestration";
import { privateNoteTitle } from "@/features/wall/private-notes";
import type { AppUserProfile } from "@/lib/profile";

type WallCanvasProps = {
  userProfile?: AppUserProfile;
};

export const WallCanvas = ({ userProfile }: WallCanvasProps) => {
  const wall = useWallCanvasOrchestration({ userProfile });

  return (
    <WallSessionProvider
      interaction={{
        selectedNoteIds: wall.selectedNoteIds,
        editingNoteId: wall.editing?.id ?? null,
        focusedNoteId: wall.focusedNoteId,
        hoveredNoteId: wall.hoveredNoteId,
        draggingNoteId: wall.draggingNoteId,
        boxSelectMode: wall.boxSelectMode,
      }}
      sync={{
        cloudWallId: wall.cloudWallId,
        isSyncing: wall.isSyncing,
        hasPendingSync: wall.hasPendingSync,
        syncError: wall.syncError,
        lastSyncedAt: wall.lastSyncedAt,
        localSaveState: wall.localSaveState,
        publishedReadOnly: wall.publishedReadOnly,
      }}
      layout={{
        layoutPrefs: wall.layoutPrefs,
        rightPanelOpen: wall.rightPanelOpen,
        detailsSectionsOpen: wall.detailsSectionsOpen,
        presentationMode: wall.presentationMode,
        readingMode: wall.readingMode,
        isChromeHidden: wall.isChromeHidden,
        timelineViewActive: wall.timelineViewActive,
        spatialPrefs: wall.spatialPrefs,
      }}
      chrome={wall.chrome}
      details={wall.details}
      modals={wall.modals}
    >
      <div className="wall-atelier-shell flex h-screen flex-col text-[var(--color-text)]">
        {wall.showChromeHeader ? <WallChromeHeader {...wall.chromeHeader} /> : null}

        <WallSpatialView
          {...wall.spatialView}
          chromeSlot={<WallInCanvasChrome {...wall.inCanvasChrome} />}
        />

        <PrivateNoteModal
          open={wall.privateModal.open}
          mode={wall.privateModal.mode}
          noteLabel={wall.privateModalNote ? privateNoteTitle(wall.privateModalNote) : "Private note"}
          error={wall.privateModal.error}
          onClose={wall.closePrivateModal}
          onSubmit={(password) => {
            void wall.submitPrivateModal(password);
          }}
        />

        <WallGlobalModals />
      </div>
    </WallSessionProvider>
  );
};
