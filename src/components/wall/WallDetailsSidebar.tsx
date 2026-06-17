"use client";

import { WallDetailsPanel } from "@/components/wall/WallDetailsPanel";
import { WallDetailsContent } from "@/components/wall/WallDetailsContent";
import { useWallChrome } from "@/components/wall/session/wall-chrome-context";
import { useWallLayout } from "@/components/wall/session/wall-layout-context";

export const WallDetailsSidebar = () => {
  const { layoutPrefs, rightPanelOpen, isChromeHidden } = useWallLayout();
  const { onCloseRightPanel } = useWallChrome();

  if (isChromeHidden || !layoutPrefs.showDetailsPanel) {
    return null;
  }

  return (
    <WallDetailsPanel rightPanelOpen={rightPanelOpen} onClose={onCloseRightPanel}>
      <WallDetailsContent />
    </WallDetailsPanel>
  );
};
