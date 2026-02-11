export type Note = {
  id: string;
  text: string;
  tags: string[];
  textSize?: "sm" | "md" | "lg";
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  dirty?: boolean;
};

export type Zone = {
  id: string;
  label: string;
  groupId?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  dirty?: boolean;
};

export type ZoneGroup = {
  id: string;
  label: string;
  color: string;
  zoneIds: string[];
  collapsed: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  dirty?: boolean;
};

export type LinkType = "cause_effect" | "dependency" | "idea_execution";

export type Link = {
  id: string;
  fromNoteId: string;
  toNoteId: string;
  type: LinkType;
  label: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  dirty?: boolean;
};

export type TemplateType = "brainstorm" | "retro" | "strategy_map";

export type Camera = {
  x: number;
  y: number;
  zoom: number;
};

export type WallUI = {
  selectedNoteId?: string;
  selectedZoneId?: string;
  selectedGroupId?: string;
  selectedLinkId?: string;
  linkingFromNoteId?: string;
  linkType: LinkType;
  templateType: TemplateType;
  lastColor?: string;
  flashNoteId?: string;
  isSearchOpen: boolean;
  isExportOpen: boolean;
  isShortcutsOpen: boolean;
  showClusters: boolean;
};

export type WallState = {
  notes: Record<string, Note>;
  zones: Record<string, Zone>;
  zoneGroups: Record<string, ZoneGroup>;
  links: Record<string, Link>;
  camera: Camera;
  ui: WallUI;
};

export type PersistedWallState = Pick<WallState, "notes" | "zones" | "zoneGroups" | "links" | "camera"> & {
  lastColor?: string;
};
