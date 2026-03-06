export type BlockCategory = "Basic" | "Media" | "Database" | "Advanced";

export type BlockType =
  | "text"
  | "h1"
  | "h2"
  | "h3"
  | "todo"
  | "bulleted"
  | "numbered"
  | "toggle"
  | "table"
  | "code"
  | "quote"
  | "callout"
  | "image"
  | "video"
  | "audio"
  | "bookmark"
  | "divider"
  | "google_doc"
  | "pdf"
  | "database"
  | "markdown"
  | "page"
  | "file";

export type PageFileMeta = {
  path?: string;
  name: string;
  size: number;
  mimeType: string;
  displayName: string;
  source?: "upload" | "embed";
  externalUrl?: string;
};

export type PageBlockComment = {
  id: string;
  authorName: string;
  text: string;
  createdAt: number;
  attachments?: string[];
  mentions?: string[];
};

export type PageRichTextMark = "bold" | "italic" | "code" | "link" | "mention";

export type PageRichTextSpan = {
  text: string;
  marks?: PageRichTextMark[];
  href?: string;
  mention?: string;
};

export type PageNumberedFormat = "numbers" | "letters" | "roman";

export type PageTableData = {
  rows: number;
  columns: number;
  cells: string[][];
  headerRow?: boolean;
  headerColumn?: boolean;
};

export type PageCodeData = {
  language?: string;
  wrap?: boolean;
  caption?: string;
};

export type PageBookmarkData = {
  url: string;
  title?: string;
  hostname?: string;
  description?: string;
  imageUrl?: string;
};

export type PageBlock = {
  id: string;
  type: BlockType;
  content: string;
  richText?: PageRichTextSpan[];
  x: number;
  y: number;
  w: number;
  h: number;
  pageId?: string;
  parentId?: string;
  indent?: number;
  numberedFormat?: PageNumberedFormat;
  numberedStart?: number;
  textColor?: string;
  backgroundColor?: string;
  checked?: boolean;
  expanded?: boolean;
  table?: PageTableData;
  code?: PageCodeData;
  bookmark?: PageBookmarkData;
  comments?: PageBlockComment[];
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
