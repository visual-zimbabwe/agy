import type { PersistedWallState } from "@/features/wall/types";
import { normalizePersistedWallState } from "@/features/wall/storage-migrations";

export type BackupReminderCadence = "off" | "daily" | "weekly";

export const backupReminderIntervalMs = (cadence: BackupReminderCadence) => {
  if (cadence === "daily") {
    return 1000 * 60 * 60 * 24;
  }
  if (cadence === "weekly") {
    return 1000 * 60 * 60 * 24 * 7;
  }
  return Infinity;
};

export const shouldPromptBackupReminder = (
  cadence: BackupReminderCadence,
  lastPromptTs: number,
  nowTs = Date.now(),
) => {
  if (cadence === "off") {
    return false;
  }
  const interval = backupReminderIntervalMs(cadence);
  if (!Number.isFinite(lastPromptTs) || lastPromptTs <= 0) {
    return true;
  }
  return nowTs - lastPromptTs >= interval;
};

export const parseBackupJson = (raw: string): PersistedWallState | null => {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return normalizePersistedWallState(parsed);
  } catch {
    return null;
  }
};
