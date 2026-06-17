"use client";

import { QuickCaptureBar } from "@/components/QuickCaptureBar";
import { ExportModal } from "@/components/ExportModal";
import { useWallModals } from "@/components/wall/session/wall-modal-context";

export const WallExportModals = () => {
  const {
    quickCaptureOpen,
    isTimeLocked,
    onCloseQuickCapture,
    onCapture,
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
  } = useWallModals();

  return (
    <>
      <QuickCaptureBar open={quickCaptureOpen} disabled={isTimeLocked} onClose={onCloseQuickCapture} onCapture={onCapture} />
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
    </>
  );
};
