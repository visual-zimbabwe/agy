"use client";

import type { ReactNode } from "react";

import { WallChromeProvider, type WallChromeContextValue } from "@/components/wall/session/wall-chrome-context";
import {
  WallInteractionProvider,
  type WallInteractionContextValue,
} from "@/components/wall/session/wall-interaction-context";
import { WallLayoutProvider, type WallLayoutContextValue } from "@/components/wall/session/wall-layout-context";
import { WallDetailsProvider, type WallDetailsContextValue } from "@/components/wall/session/wall-details-context";
import { WallModalProvider, type WallModalContextValue } from "@/components/wall/session/wall-modal-context";
import { WallSyncProvider, type WallSyncContextValue } from "@/components/wall/session/wall-sync-context";

export type WallSessionProviderProps = {
  interaction?: Partial<WallInteractionContextValue>;
  sync?: Partial<WallSyncContextValue>;
  layout?: Partial<WallLayoutContextValue>;
  chrome?: Partial<WallChromeContextValue>;
  details?: Partial<WallDetailsContextValue>;
  modals?: Partial<WallModalContextValue>;
  children: ReactNode;
};

/**
 * Composes wall session contexts for chrome and spatial subsystems.
 */
export const WallSessionProvider = ({ interaction, sync, layout, chrome, details, modals, children }: WallSessionProviderProps) => (
  <WallSyncProvider value={sync}>
    <WallInteractionProvider value={interaction}>
      <WallLayoutProvider value={layout}>
        <WallChromeProvider value={chrome}>
          <WallDetailsProvider value={details}>
            <WallModalProvider value={modals}>{children}</WallModalProvider>
          </WallDetailsProvider>
        </WallChromeProvider>
      </WallLayoutProvider>
    </WallInteractionProvider>
  </WallSyncProvider>
);

export { useWallSession } from "@/components/wall/session/useWallSession";
export { useWallChrome } from "@/components/wall/session/wall-chrome-context";
export { useWallInteraction } from "@/components/wall/session/wall-interaction-context";
export { useWallLayout } from "@/components/wall/session/wall-layout-context";
export { useWallDetails } from "@/components/wall/session/wall-details-context";
export { useWallModals } from "@/components/wall/session/wall-modal-context";
export { useWallSync } from "@/components/wall/session/wall-sync-context";
