"use client";

import { QuickHelpDialog } from "@/components/help/QuickHelpDialog";
import { FileConversionModal } from "@/components/FileConversionModal";
import { ShortcutsHelp } from "@/components/ShortcutsHelp";
import { SettingsWorkspace } from "@/components/settings/SettingsWorkspace";
import { ModalShell } from "@/components/ui/ModalShell";
import { useWallModals } from "@/components/wall/session/wall-modal-context";

export const WallSettingsHelpModals = () => {
  const {
    isShortcutsOpen,
    onCloseShortcuts,
    isHelpOpen,
    onCloseHelp,
    onOpenHelpShortcuts,
    onOpenHelpSettings,
    onReplayTour,
    isFileConversionOpen,
    onCloseFileConversion,
    onOpenFileConversion,
    preferredFileConversionMode,
    isSettingsOpen,
    onCloseSettings,
    userEmail,
    userProfile,
  } = useWallModals();

  return (
    <>
      <ShortcutsHelp open={isShortcutsOpen} onClose={onCloseShortcuts} />
      <QuickHelpDialog
        open={isHelpOpen}
        onClose={onCloseHelp}
        onOpenShortcuts={() => {
          onCloseHelp();
          onOpenHelpShortcuts();
        }}
        onOpenSettings={() => {
          onCloseHelp();
          onOpenHelpSettings();
        }}
        onReplayTour={() => {
          onCloseHelp();
          onReplayTour();
        }}
      />
      <FileConversionModal
        open={isFileConversionOpen}
        onClose={onCloseFileConversion}
        onOpen={onOpenFileConversion}
        preferredMode={preferredFileConversionMode}
      />
      <ModalShell
        open={isSettingsOpen}
        onClose={onCloseSettings}
        title="Settings"
        description="Manage your wall preferences without leaving the canvas."
        maxWidthClassName="max-w-6xl"
        panelClassName="p-4 sm:p-5"
        contentClassName="mt-3"
      >
        {userEmail ? (
          <SettingsWorkspace userEmail={userEmail} initialProfile={userProfile} embedded onReplayTour={onReplayTour} />
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">Sign in to manage settings.</p>
        )}
      </ModalShell>
    </>
  );
};
