"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { AppUserProfile } from "@/lib/profile";
import type { UnsplashPhoto } from "@/lib/unsplash";

export type WallModalContextValue = {
  isTimeLocked: boolean;
  quickCaptureOpen: boolean;
  onCloseQuickCapture: () => void;
  onCapture: (items: Array<{ text: string; tags: string[] }>) => void;
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
  isHelpOpen: boolean;
  onCloseHelp: () => void;
  onOpenHelpShortcuts: () => void;
  onOpenHelpSettings: () => void;
  onReplayTour: () => void;
  isFileConversionOpen: boolean;
  onCloseFileConversion: () => void;
  onOpenFileConversion: () => void;
  preferredFileConversionMode?: "pdf_to_word" | "word_to_pdf" | null;
  isSettingsOpen: boolean;
  onCloseSettings: () => void;
  userEmail?: string;
  userProfile?: AppUserProfile;
  imageInsertOpen: boolean;
  imageInsertTargetLabel?: string;
  onCloseImageInsert: () => void;
  onSelectImageFile: (file: File) => Promise<void>;
  onSubmitImageUrl: (url: string) => Promise<void>;
  onSelectUnsplashPhoto: (photo: UnsplashPhoto) => Promise<void>;
  onInsertUnsplashMoodboard?: (photos: UnsplashPhoto[]) => Promise<void>;
};

const noop = () => undefined;

const defaultWallModalContext: WallModalContextValue = {
  isTimeLocked: false,
  quickCaptureOpen: false,
  onCloseQuickCapture: noop,
  onCapture: noop,
  isExportOpen: false,
  onCloseExport: noop,
  onExportPng: noop,
  onExportPdf: noop,
  onExportMarkdown: noop,
  onExportJson: noop,
  onImportJson: noop,
  onPublishSnapshot: noop,
  backupReminderCadence: "off",
  onBackupReminderCadenceChange: noop,
  isShortcutsOpen: false,
  onCloseShortcuts: noop,
  isHelpOpen: false,
  onCloseHelp: noop,
  onOpenHelpShortcuts: noop,
  onOpenHelpSettings: noop,
  onReplayTour: noop,
  isFileConversionOpen: false,
  onCloseFileConversion: noop,
  onOpenFileConversion: noop,
  preferredFileConversionMode: null,
  isSettingsOpen: false,
  onCloseSettings: noop,
  imageInsertOpen: false,
  onCloseImageInsert: noop,
  onSelectImageFile: async () => undefined,
  onSubmitImageUrl: async () => undefined,
  onSelectUnsplashPhoto: async () => undefined,
};

const WallModalContext = createContext<WallModalContextValue>(defaultWallModalContext);

export type WallModalProviderProps = {
  value?: Partial<WallModalContextValue>;
  children: ReactNode;
};

export const WallModalProvider = ({ value, children }: WallModalProviderProps) => (
  <WallModalContext.Provider value={{ ...defaultWallModalContext, ...value }}>
    {children}
  </WallModalContext.Provider>
);

export const useWallModals = () => useContext(WallModalContext);
