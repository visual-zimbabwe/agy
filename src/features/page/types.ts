export type BlockCategory = "Basic" | "Media" | "Database" | "Advanced";

export type BlockType =
  | "text"
  | "h1"
  | "h2"
  | "h3"
  | "todo"
  | "bulleted"
  | "toggle"
  | "code"
  | "quote"
  | "callout"
  | "image"
  | "video"
  | "audio"
  | "google_doc"
  | "pdf"
  | "database"
  | "markdown"
  | "page"
  | "file";

export type PageFileMeta = {
  path: string;
  name: string;
  size: number;
  mimeType: string;
  displayName: string;
};

export type PageBlock = {
  id: string;
  type: BlockType;
  content: string;
  x: number;
  y: number;
  w: number;
  h: number;
  indent?: number;
  textColor?: string;
  backgroundColor?: string;
  checked?: boolean;
  expanded?: boolean;
  file?: PageFileMeta;
};

export type PageCamera = {
  x: number;
  y: number;
  zoom: number;
};

export type PersistedPageState = {
  blocks: PageBlock[];
  camera: PageCamera;
  updatedAt: number;
};
