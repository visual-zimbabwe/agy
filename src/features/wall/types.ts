export type NoteTextFont =
  | "roboto"
  | "open_sans"
  | "lato"
  | "montserrat"
  | "poppins"
  | "nunito"
  | "source_sans_3"
  | "inter"
  | "raleway"
  | "ubuntu"
  | "playfair_display"
  | "merriweather"
  | "pt_sans"
  | "noto_sans"
  | "work_sans"
  | "oswald"
  | "rubik"
  | "fira_sans"
  | "josefin_sans"
  | "quicksand";

export type VocabularyReviewOutcome = "again" | "hard" | "good" | "easy";

export type VocabularyNote = {
  word: string;
  sourceContext: string;
  guessMeaning: string;
  meaning: string;
  ownSentence: string;
  flipped: boolean;
  nextReviewAt: number;
  lastReviewedAt?: number;
  intervalDays: number;
  reviewsCount: number;
  lapses: number;
  isFocus: boolean;
  lastOutcome?: VocabularyReviewOutcome;
};

export type CanonListItem = {
  id: string;
  title: string;
  text: string;
  interpretation: string;
};

export type CanonNote = {
  mode: "single" | "list";
  title: string;
  statement: string;
  interpretation: string;
  example: string;
  source: string;
  items: CanonListItem[];
};

export type Note = {
  id: string;
  noteKind?: "standard" | "quote" | "canon";
  text: string;
  quoteAuthor?: string;
  quoteSource?: string;
  canon?: CanonNote;
  imageUrl?: string;
  textAlign?: "left" | "center" | "right";
  textVAlign?: "top" | "middle" | "bottom";
  textFont?: NoteTextFont;
  textColor?: string;
  textSizePx?: number;
  tags: string[];
  textSize?: "sm" | "md" | "lg";
  pinned?: boolean;
  highlighted?: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  createdAt: number;
  updatedAt: number;
  vocabulary?: VocabularyNote;
  deletedAt?: number;
  dirty?: boolean;
};

export type Zone = {
  id: string;
  label: string;
  kind: ZoneKind;
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

export type NoteGroup = {
  id: string;
  label: string;
  color: string;
  noteIds: string[];
  collapsed: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  dirty?: boolean;
};

export type ZoneKind = "frame" | "column" | "swimlane";

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

export type Bounds = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Camera = {
  x: number;
  y: number;
  zoom: number;
};

export type WallUI = {
  selectedNoteId?: string;
  selectedZoneId?: string;
  selectedGroupId?: string;
  selectedNoteGroupId?: string;
  selectedLinkId?: string;
  linkingFromNoteId?: string;
  linkType: LinkType;
  templateType: TemplateType;
  lastColor?: string;
  flashNoteId?: string;
  isSearchOpen: boolean;
  isExportOpen: boolean;
  isShortcutsOpen: boolean;
  isFileConversionOpen: boolean;
  showClusters: boolean;
};

export type WallState = {
  notes: Record<string, Note>;
  zones: Record<string, Zone>;
  zoneGroups: Record<string, ZoneGroup>;
  noteGroups: Record<string, NoteGroup>;
  links: Record<string, Link>;
  camera: Camera;
  ui: WallUI;
};

export type PersistedWallState = Pick<WallState, "notes" | "zones" | "zoneGroups" | "noteGroups" | "links" | "camera"> & {
  lastColor?: string;
};
