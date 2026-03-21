"use client";

import { useCallback, useEffect } from "react";

import { parseBackupJson, shouldPromptBackupReminder, type BackupReminderCadence } from "@/features/wall/backup";
import { selectPersistedSnapshot, useWallStore } from "@/features/wall/store";
import type { PersistedWallState } from "@/features/wall/types";
import { legacyBackupReminderLastPromptStorageKeys } from "@/components/wall/wall-canvas-helpers";
import { decryptConfidentialPayload, encryptConfidentialPayload, isConfidentialEnvelope } from "@/lib/confidential-workspace";
import { readStorageValue, writeStorageValue } from "@/lib/local-storage";

type UseWallBackupActionsOptions = {
  backupReminderCadence: BackupReminderCadence;
  backupReminderLastPromptStorageKey: string;
  confidentialPassphrase: string;
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
  confidentialPassphrase,
  publishedReadOnly,
  makeDownloadId,
  downloadJsonFile,
  setExportOpen,
  hydrate,
  clearSelectedNotes,
}: UseWallBackupActionsOptions) => {
  const exportJson = useCallback(async () => {
    const snapshot = selectPersistedSnapshot(useWallStore.getState());
    const encryptedBackup = await encryptConfidentialPayload(confidentialPassphrase, {
      kind: "wall-backup",
      snapshot,
      exportedAt: Date.now(),
    });
    downloadJsonFile(`agy-backup-${makeDownloadId()}.enc.json`, encryptedBackup);
    if (typeof window !== "undefined") {
      writeStorageValue(backupReminderLastPromptStorageKey, String(Date.now()));
    }
    setExportOpen(false);
  }, [backupReminderLastPromptStorageKey, confidentialPassphrase, downloadJsonFile, makeDownloadId, setExportOpen]);

  const importJson = useCallback(
    async (file: File) => {
      try {
        const raw = await file.text();
        const parsedJson = JSON.parse(raw) as unknown;
        let parsed = parseBackupJson(raw);

        if (!parsed && isConfidentialEnvelope(parsedJson)) {
          const decrypted = await decryptConfidentialPayload<{ kind?: string; snapshot?: PersistedWallState }>(confidentialPassphrase, parsedJson);
          parsed = decrypted.snapshot ? parseBackupJson(JSON.stringify(decrypted.snapshot)) : null;
        }

        if (!parsed) {
          window.alert("Invalid backup file format.");
          return;
        }
        const ok = window.confirm("Import backup and replace current wall state?");
        if (!ok) {
          return;
        }
        hydrate(parsed);
        clearSelectedNotes();
        setExportOpen(false);
        window.alert("Backup imported successfully.");
      } catch {
        window.alert("Unable to import backup.");
      }
    },
    [clearSelectedNotes, confidentialPassphrase, hydrate, setExportOpen],
  );

  const publishReadOnlySnapshot = useCallback(async () => {
    window.alert("Public snapshot links are disabled for confidential workspaces. Use encrypted backups instead.");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || publishedReadOnly) {
      return;
    }
    const now = Date.now();
    const lastPromptRaw = readStorageValue(backupReminderLastPromptStorageKey, legacyBackupReminderLastPromptStorageKeys);
    const lastPrompt = lastPromptRaw ? Number(lastPromptRaw) : 0;
    if (!shouldPromptBackupReminder(backupReminderCadence, lastPrompt, now)) {
      return;
    }

    writeStorageValue(backupReminderLastPromptStorageKey, String(now));
    const wantsExport = window.confirm(`Backup reminder (${backupReminderCadence}): export an encrypted backup now?`);
    if (wantsExport) {
      void exportJson();
    }
  }, [backupReminderCadence, backupReminderLastPromptStorageKey, exportJson, publishedReadOnly]);

  return { exportJson, importJson, publishReadOnlySnapshot };
};
