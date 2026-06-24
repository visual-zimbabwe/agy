"use client";

import { QuickHelpDialog } from "@/components/help/QuickHelpDialog";
import { ShortcutsHelp } from "@/components/ShortcutsHelp";
import { SettingsWorkspace } from "@/components/settings/SettingsWorkspace";
import { ModalShell } from "@/components/ui/ModalShell";

import { DecksAddNoteModal } from "./DecksAddNoteModal";
import { DecksImportModal } from "./DecksImportModal";
import { useDecksChrome } from "./decks-context";

export const DecksSettingsHelpModals = () => {
  const {
    userEmail,
    userProfile,
    settingsOpen,
    setSettingsOpen,
    helpOpen,
    setHelpOpen,
    shortcutsOpen,
    setShortcutsOpen,
    addNoteOpen,
    setAddNoteOpen,
    importOpen,
    setImportOpen,
  } = useDecksChrome();

  return (
    <>
      <ShortcutsHelp open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <QuickHelpDialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        onOpenShortcuts={() => {
          setHelpOpen(false);
          setShortcutsOpen(true);
        }}
        onOpenSettings={() => {
          setHelpOpen(false);
          setSettingsOpen(true);
        }}
        onReplayTour={() => setHelpOpen(false)}
      />
      <ModalShell
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Settings"
        description="Manage your account and workspace preferences."
        maxWidthClassName="max-w-6xl"
        panelClassName="p-4 sm:p-5"
        contentClassName="mt-3"
      >
        {userEmail ? (
          <SettingsWorkspace userEmail={userEmail} initialProfile={userProfile} embedded />
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">Sign in to manage settings.</p>
        )}
      </ModalShell>
      <DecksAddNoteModal open={addNoteOpen} onClose={() => setAddNoteOpen(false)} />
      <DecksImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
};
