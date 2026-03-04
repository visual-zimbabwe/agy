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
  | "page";

export type PageBlock = {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  expanded?: boolean;
};

export type PersistedPageState = {
  blocks: PageBlock[];
  updatedAt: number;
};

