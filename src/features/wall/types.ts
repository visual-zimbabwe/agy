export type NoteTextFont =
  | "newsreader"
  | "manrope"
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
  | "quicksand"
  | "patrick_hand";

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

export type EisenhowerQuadrantKey = "doFirst" | "schedule" | "delegate" | "delete";

export type EisenhowerQuadrant = {
  title: string;
  content: string;
};

export type EisenhowerNote = {
  displayDate: string;
  quadrants: Record<EisenhowerQuadrantKey, EisenhowerQuadrant>;
};

export type CurrencyNoteStatus = "idle" | "locating" | "loading" | "ready" | "error";

export type CurrencyNoteRateSource = "live" | "cache" | "default";

export type CurrencyNoteDetectionSource = "geolocation" | "ip" | "manual" | "default";

export type CurrencyNoteTrend = "up" | "down" | "flat";

export type CurrencyNote = {
  status: CurrencyNoteStatus;
  detectedCountryCode?: string;
  detectedCountryName?: string;
  detectedCurrency?: string;
  baseCurrency: string;
  baseCurrencyMode: "auto" | "manual";
  manualBaseCurrency?: string;
  amountInput: string;
  usdRate: number;
  previousUsdRate?: number;
  thousandValueUsd: number;
  rateUpdatedAt?: number;
  rateSource: CurrencyNoteRateSource;
  detectionSource: CurrencyNoteDetectionSource;
  trend: CurrencyNoteTrend;
  error?: string;
};

export type WebBookmarkPreviewStatus = "idle" | "loading" | "ready" | "error";

export type WebBookmarkKind = "article" | "video" | "repo" | "docs" | "product" | "post" | "paper" | "website";

export type WebBookmarkMetadata = {
  url: string;
  finalUrl: string;
  title: string;
  description: string;
  siteName: string;
  domain: string;
  faviconUrl?: string;
  imageUrl?: string;
  kind: WebBookmarkKind;
  contentType?: string;
};

export type WebBookmarkNote = {
  url: string;
  normalizedUrl: string;
  metadata?: WebBookmarkMetadata;
  status: WebBookmarkPreviewStatus;
  fetchedAt?: number;
  lastSuccessAt?: number;
  error?: string;
};

export type ApodNoteStatus = "idle" | "loading" | "ready" | "error";

export type ApodNoteMediaType = "image" | "video" | "other";

export type ApodNote = {
  status: ApodNoteStatus;
  date?: string;
  title?: string;
  explanation?: string;
  copyright?: string;
  mediaType?: ApodNoteMediaType;
  imageUrl?: string;
  fallbackImageUrl?: string;
  pageUrl?: string;
  fetchedAt?: number;
  lastSuccessAt?: number;
  error?: string;
};

export type PoetryNoteStatus = "idle" | "loading" | "ready" | "error";
export type PoetrySearchField = "random" | "author" | "title" | "lines" | "linecount";
export type PoetrySearchMatchType = "partial" | "exact";

export type PoetryNote = {
  status: PoetryNoteStatus;
  dateKey?: string;
  title?: string;
  author?: string;
  lines: string[];
  lineCount?: number;
  sourceUrl?: string;
  searchField?: PoetrySearchField;
  searchQuery?: string;
  matchType?: PoetrySearchMatchType;
  fetchedAt?: number;
  lastSuccessAt?: number;
  error?: string;
};

export type EconomistNote = {
  status: "idle" | "loading" | "ready" | "error";
  year?: string;
  sourceId?: string;
  sourceUrl?: string;
  coverUrl?: string;
  issueDate?: string;
  mainStory?: string;
  fetchedAt?: number;
  lastSuccessAt?: number;
  error?: string;
};

export type FileNoteSource = "upload" | "link";

export type FileNote = {
  source: FileNoteSource;
  name: string;
  url: string;
  mimeType?: string;
  extension?: string;
  sizeBytes?: number;
  uploadedAt?: number;
};

export type AudioNote = FileNote & {
  durationSeconds?: number;
};

export type PrivateNoteData = {
  version: 1;
  salt: string;
  iv: string;
  ciphertext: string;
  protectedAt: number;
  updatedAt: number;
};

export type Note = {
  id: string;
  noteKind?: "standard" | "quote" | "canon" | "journal" | "eisenhower" | "joker" | "throne" | "currency" | "web-bookmark" | "apod" | "poetry" | "economist" | "file" | "audio";
  text: string;
  quoteAuthor?: string;
  quoteSource?: string;
  privateNote?: PrivateNoteData;
  canon?: CanonNote;
  eisenhower?: EisenhowerNote;
  currency?: CurrencyNote;
  bookmark?: WebBookmarkNote;
  apod?: ApodNote;
  poetry?: PoetryNote;
  economist?: EconomistNote;
  file?: FileNote;
  audio?: AudioNote;
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

export type LinkType = "cause_effect" | "dependency" | "idea_execution" | "wiki";

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


