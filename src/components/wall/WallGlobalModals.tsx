"use client";

import { WallExportModals } from "@/components/wall/modals/WallExportModals";
import { WallMediaInsertModals } from "@/components/wall/modals/WallMediaInsertModals";
import { WallSettingsHelpModals } from "@/components/wall/modals/WallSettingsHelpModals";

/** Thin composer for domain-split wall modals (Phase 1). */
export const WallGlobalModals = () => (
  <>
    <WallExportModals />
    <WallSettingsHelpModals />
    <WallMediaInsertModals />
  </>
);
