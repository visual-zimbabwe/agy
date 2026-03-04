"use client";

import { ExportModal } from "@/components/ExportModal";
import { FileConversionModal } from "@/components/FileConversionModal";
import { QuickCaptureBar } from "@/components/QuickCaptureBar";
import { SearchPalette, type CommandPaletteCommand } from "@/components/SearchPalette";
import { ShortcutsHelp } from "@/components/ShortcutsHelp";
import { SettingsWorkspace } from "@/components/settings/SettingsWorkspace";
import { ModalShell } from "@/components/ui/ModalShell";
import type { Note } from "@/features/wall/types";

type WallGlobalModalsProps = {
  quickCaptureOpen: boolean;
  isTimeLocked: boolean;
  onCloseQuickCapture: () => void;
  onCapture: (items: Array<{ text: string; tags: string[] }>) => void;
  isSearchOpen: boolean;
  visibleNotes: Note[];
  commandPaletteCommands: CommandPaletteCommand[];
  onCloseSearch: () => void;
  onSelectSearchNote: (noteId: string) => void;
  isExportOpen: boolean;
  onCloseExport: () => void;
  onExportPng: (scope: "view" | "whole" | "selection" | "zone", pixelRatio: number) => void;
  onExportPdf: (scope: "view" | "whole" | "selection" | "zone") => void;
  onExportMarkdown: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onPublishSnapshot: () => void;
  backupReminderCadence: "off" | "daily" | "weekly";
  onBackupReminderCadenceChange: (cadence: "off" | "daily" | "weekly") => void;
  isShortcutsOpen: boolean;
  onCloseShortcuts: () => void;
  isFileConversionOpen: boolean;
  onCloseFileConversion: () => void;
  onOpenFileConversion: () => void;
  preferredFileConversionMode?: "pdf_to_word" | "word_to_pdf" | null;
  isSettingsOpen: boolean;
  onCloseSettings: () => void;
  userEmail?: string;
};

export const WallGlobalModals = ({
  quickCaptureOpen,
  isTimeLocked,
  onCloseQuickCapture,
  onCapture,
  isSearchOpen,
  visibleNotes,
  commandPaletteCommands,
  onCloseSearch,
  onSelectSearchNote,
  isExportOpen,
  onCloseExport,
  onExportPng,
  onExportPdf,
  onExportMarkdown,
  onExportJson,
  onImportJson,
  onPublishSnapshot,
  backupReminderCadence,
  onBackupReminderCadenceChange,
  isShortcutsOpen,
  onCloseShortcuts,
  isFileConversionOpen,
  onCloseFileConversion,
  onOpenFileConversion,
  preferredFileConversionMode,
  isSettingsOpen,
  onCloseSettings,
  userEmail,
}: WallGlobalModalsProps) => {
  return (
    <>
      <QuickCaptureBar open={quickCaptureOpen} disabled={isTimeLocked} onClose={onCloseQuickCapture} onCapture={onCapture} />
      <SearchPalette
        open={isSearchOpen}
        notes={visibleNotes}
        commands={commandPaletteCommands}
        onClose={onCloseSearch}
        onSelect={onSelectSearchNote}
      />
      <ExportModal
        open={isExportOpen}
        onClose={onCloseExport}
        onExportPng={onExportPng}
        onExportPdf={onExportPdf}
        onExportMarkdown={onExportMarkdown}
        onExportJson={onExportJson}
        onImportJson={onImportJson}
        onPublishSnapshot={onPublishSnapshot}
        backupReminderCadence={backupReminderCadence}
        onBackupReminderCadenceChange={onBackupReminderCadenceChange}
      />
      <ShortcutsHelp open={isShortcutsOpen} onClose={onCloseShortcuts} />
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
          <SettingsWorkspace userEmail={userEmail} embedded />
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">Sign in to manage settings.</p>
        )}
      </ModalShell>
    </>
  );
};
