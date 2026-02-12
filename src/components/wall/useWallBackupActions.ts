"use client";

import { useCallback, useEffect } from "react";

import { parseBackupJson, shouldPromptBackupReminder, type BackupReminderCadence } from "@/features/wall/backup";
import { selectPersistedSnapshot, useWallStore } from "@/features/wall/store";
import type { PersistedWallState } from "@/features/wall/types";
import { buildPublishedSnapshotUrl } from "@/lib/publish";

type UseWallBackupActionsOptions = {
  backupReminderCadence: BackupReminderCadence;
  backupReminderLastPromptStorageKey: string;
  publishedReadOnly: boolean;
  makeDownloadId: () => string;
  downloadJsonFile: (filename: string, data: unknown) => void;
  setExportOpen: (open: boolean) => void;
  hydrate: (snapshot: PersistedWallState) => void;
  clearSelectedNotes: () => void;
};

export const useWallBackupActions = ({
  backupReminderCadence,
  backupReminderLastPromptStorageKey,
  publishedReadOnly,
  makeDownloadId,
  downloadJsonFile,
  setExportOpen,
  hydrate,
  clearSelectedNotes,
}: UseWallBackupActionsOptions) => {
  const exportJson = useCallback(() => {
    const snapshot = selectPersistedSnapshot(useWallStore.getState());
    downloadJsonFile(`idea-wall-backup-${makeDownloadId()}.json`, snapshot);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(backupReminderLastPromptStorageKey, String(Date.now()));
    }
    setExportOpen(false);
  }, [backupReminderLastPromptStorageKey, downloadJsonFile, makeDownloadId, setExportOpen]);

  const importJson = useCallback(
    async (file: File) => {
      try {
        const raw = await file.text();
        const parsed = parseBackupJson(raw);
        if (!parsed) {
          window.alert("Invalid backup file format.");
          return;
        }
        const ok = window.confirm("Import JSON backup and replace current wall state?");
        if (!ok) {
          return;
        }
        hydrate(parsed);
        clearSelectedNotes();
        setExportOpen(false);
        window.alert("Backup imported successfully.");
      } catch {
        window.alert("Unable to import JSON backup.");
      }
    },
    [clearSelectedNotes, hydrate, setExportOpen],
  );

  const publishReadOnlySnapshot = useCallback(async () => {
    const snapshot = selectPersistedSnapshot(useWallStore.getState());
    const url = buildPublishedSnapshotUrl(snapshot);
    if (!url) {
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      window.alert("Read-only snapshot link copied to clipboard.");
    } catch {
      window.prompt("Copy read-only snapshot URL", url);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || publishedReadOnly) {
      return;
    }
    const now = Date.now();
    const lastPromptRaw = window.localStorage.getItem(backupReminderLastPromptStorageKey);
    const lastPrompt = lastPromptRaw ? Number(lastPromptRaw) : 0;
    if (!shouldPromptBackupReminder(backupReminderCadence, lastPrompt, now)) {
      return;
    }

    window.localStorage.setItem(backupReminderLastPromptStorageKey, String(now));
    const wantsExport = window.confirm(`Backup reminder (${backupReminderCadence}): export a full JSON backup now?`);
    if (wantsExport) {
      exportJson();
    }
  }, [backupReminderCadence, backupReminderLastPromptStorageKey, exportJson, publishedReadOnly]);

  return { exportJson, importJson, publishReadOnlySnapshot };
};
