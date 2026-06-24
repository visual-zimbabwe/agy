"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { DetailsSectionState } from "@/components/wall/details/DetailsSectionTypes";

export type WallLayoutPreferenceKey = "showDetailsPanel" | "showContextBar" | "showNoteTags";

export type WallLayoutPreferences = Record<WallLayoutPreferenceKey, boolean>;

export type WallSpatialPreferences = {
  showDotMatrix: boolean;
  snapToGuides: boolean;
  snapToGrid: boolean;
  dotGridSpacing: number;
};

/** Panel visibility, layout prefs, and view-mode flags for wall chrome. */
export type WallLayoutContextValue = {
  layoutPrefs: WallLayoutPreferences;
  rightPanelOpen: boolean;
  detailsSectionsOpen: DetailsSectionState;
  presentationMode: boolean;
  readingMode: boolean;
  /** True when presentation or reading mode hides chrome overlays. */
  isChromeHidden: boolean;
  timelineViewActive: boolean;
  spatialPrefs: WallSpatialPreferences;
};

const defaultLayoutPrefs: WallLayoutPreferences = {
  showDetailsPanel: false,
  showContextBar: true,
  showNoteTags: false,
};

const defaultSpatialPrefs: WallSpatialPreferences = {
  showDotMatrix: false,
  snapToGuides: true,
  snapToGrid: false,
  dotGridSpacing: 32,
};

const defaultDetailsSectionsOpen: DetailsSectionState = {
  history: false,
  recall: true,
  zoneGroups: true,
  tagGroups: false,
};

const defaultWallLayoutContext: WallLayoutContextValue = {
  layoutPrefs: defaultLayoutPrefs,
  rightPanelOpen: false,
  detailsSectionsOpen: defaultDetailsSectionsOpen,
  presentationMode: false,
  readingMode: false,
  isChromeHidden: false,
  timelineViewActive: false,
  spatialPrefs: defaultSpatialPrefs,
};

const WallLayoutContext = createContext<WallLayoutContextValue>(defaultWallLayoutContext);

export type WallLayoutProviderProps = {
  value?: Partial<WallLayoutContextValue>;
  children: ReactNode;
};

export const WallLayoutProvider = ({ value, children }: WallLayoutProviderProps) => (
  <WallLayoutContext.Provider value={{ ...defaultWallLayoutContext, ...value }}>
    {children}
  </WallLayoutContext.Provider>
);

export const useWallLayout = () => useContext(WallLayoutContext);
