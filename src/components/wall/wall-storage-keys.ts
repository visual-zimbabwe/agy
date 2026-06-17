"use client";

import { appSlug, legacyAppSlug } from "@/lib/brand";

export const recallStorageKey = `${appSlug}-recall-searches`;
export const legacyRecallStorageKeys = [`${legacyAppSlug}-recall-searches`];
export const layoutPrefsStorageKey = `${appSlug}-layout-prefs`;
export const legacyLayoutPrefsStorageKeys = [`${legacyAppSlug}-layout-prefs`];
export const controlsModeStorageKey = `${appSlug}-controls-mode`;
export const legacyControlsModeStorageKeys = [`${legacyAppSlug}-controls-mode`];
export const spatialPrefsStorageKey = `${appSlug}-spatial-prefs`;
export const legacySpatialPrefsStorageKeys = [`${legacyAppSlug}-spatial-prefs`];
export const presentationPathsStorageKey = `${appSlug}-presentation-paths`;
export const legacyPresentationPathsStorageKeys = [`${legacyAppSlug}-presentation-paths`];
export const backupReminderCadenceStorageKey = `${appSlug}-backup-reminder-cadence`;
export const legacyBackupReminderCadenceStorageKeys = [`${legacyAppSlug}-backup-reminder-cadence`];
export const backupReminderLastPromptStorageKey = `${appSlug}-backup-reminder-last-prompt`;
export const legacyBackupReminderLastPromptStorageKeys = [`${legacyAppSlug}-backup-reminder-last-prompt`];
export const dragSnapThreshold = 10;
