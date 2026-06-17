"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Cloud sync and local persistence status exposed to wall chrome. Read-mostly for UI. */
export type WallSyncContextValue = {
  cloudWallId: string | null;
  isSyncing: boolean;
  hasPendingSync: boolean;
  syncError: string | null;
  lastSyncedAt: number | null;
  localSaveState: "idle" | "saving" | "error";
  publishedReadOnly: boolean;
};

const defaultWallSyncContext: WallSyncContextValue = {
  cloudWallId: null,
  isSyncing: false,
  hasPendingSync: false,
  syncError: null,
  lastSyncedAt: null,
  localSaveState: "idle",
  publishedReadOnly: false,
};

const WallSyncContext = createContext<WallSyncContextValue>(defaultWallSyncContext);

export type WallSyncProviderProps = {
  value?: Partial<WallSyncContextValue>;
  children: ReactNode;
};

export const WallSyncProvider = ({ value, children }: WallSyncProviderProps) => (
  <WallSyncContext.Provider value={{ ...defaultWallSyncContext, ...value }}>
    {children}
  </WallSyncContext.Provider>
);

export const useWallSync = () => useContext(WallSyncContext);
