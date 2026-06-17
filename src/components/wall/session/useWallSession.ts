"use client";

import { useWallChrome } from "@/components/wall/session/wall-chrome-context";
import { useWallInteraction } from "@/components/wall/session/wall-interaction-context";
import { useWallLayout } from "@/components/wall/session/wall-layout-context";
import { useWallDetails } from "@/components/wall/session/wall-details-context";
import { useWallModals } from "@/components/wall/session/wall-modal-context";
import { useWallSync } from "@/components/wall/session/wall-sync-context";

/**
 * Composed read API for wall chrome components.
 * Prefer granular hooks (useWallChrome, useWallLayout, etc.) when a component
 * only needs one slice to minimize re-renders.
 */
export const useWallSession = () => {
  const interaction = useWallInteraction();
  const sync = useWallSync();
  const layout = useWallLayout();
  const chrome = useWallChrome();
  const details = useWallDetails();
  const modals = useWallModals();

  return { interaction, sync, layout, chrome, details, modals };
};
