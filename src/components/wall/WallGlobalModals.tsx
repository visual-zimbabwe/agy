"use client";

import { ExportModal } from "@/components/ExportModal";
import { QuickCaptureBar } from "@/components/QuickCaptureBar";
import { SearchPalette } from "@/components/SearchPalette";
import { ShortcutsHelp } from "@/components/ShortcutsHelp";
import type { Note } from "@/features/wall/types";

type WallGlobalModalsProps = {
  quickCaptureOpen: boolean;
  isTimeLocked: boolean;
  onCloseQuickCapture: () => void;
  onCapture: (items: Array<{ text: string; tags: string[] }>) => void;
  isSearchOpen: boolean;
  visibleNotes: Note[];
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
};

export const WallGlobalModals = ({
  quickCaptureOpen,
  isTimeLocked,
  onCloseQuickCapture,
  onCapture,
  isSearchOpen,
  visibleNotes,
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
}: WallGlobalModalsProps) => {
  return (
    <>
      <QuickCaptureBar open={quickCaptureOpen} disabled={isTimeLocked} onClose={onCloseQuickCapture} onCapture={onCapture} />
      <SearchPalette open={isSearchOpen} notes={visibleNotes} onClose={onCloseSearch} onSelect={onSelectSearchNote} />
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
    </>
  );
};
