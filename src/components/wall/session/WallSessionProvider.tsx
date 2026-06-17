"use client";

import type { ReactNode } from "react";

import {
  WallInteractionProvider,
  type WallInteractionContextValue,
} from "@/components/wall/session/wall-interaction-context";
import { WallLayoutProvider, type WallLayoutContextValue } from "@/components/wall/session/wall-layout-context";
import { WallSyncProvider, type WallSyncContextValue } from "@/components/wall/session/wall-sync-context";

export type WallSessionProviderProps = {
  interaction?: Partial<WallInteractionContextValue>;
  sync?: Partial<WallSyncContextValue>;
  layout?: Partial<WallLayoutContextValue>;
  children: ReactNode;
};

/**
 * Composes wall session contexts for chrome and spatial subsystems.
 * Phase 0: scaffold only — values are read-mostly mirrors until Phase 1 migration.
 */
export const WallSessionProvider = ({ interaction, sync, layout, children }: WallSessionProviderProps) => (
  <WallSyncProvider value={sync}>
    <WallInteractionProvider value={interaction}>
      <WallLayoutProvider value={layout}>{children}</WallLayoutProvider>
    </WallInteractionProvider>
  </WallSyncProvider>
);

export { useWallInteraction } from "@/components/wall/session/wall-interaction-context";
export { useWallLayout } from "@/components/wall/session/wall-layout-context";
export { useWallSync } from "@/components/wall/session/wall-sync-context";
