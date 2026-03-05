"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SyntheticEvent,
} from "react";

import { createPageSnapshotSaver, defaultPageDocId, listPageDocIds, loadPageSnapshot, savePageSnapshot } from "@/features/page/storage";
import type { BlockType, PageBlock } from "@/features/page/types";
import { cn } from "@/lib/cn";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SlashCommandId = BlockType;
type SlashCommandGroup = "basic" | "media";
type SlashCommand = { id: SlashCommandId; label: string; description: string; aliases: string[]; group: SlashCommandGroup; symbol?: string; trigger?: string };
type MenuState = { blockId: string; query: string; slashRange: { start: number; end: number }; anchorX: number; anchorY: number };
type CanvasMenuState = { open: boolean; x: number; y: number; worldX: number; worldY: number };
type FileMenuState = { open: boolean; x: number; y: number; blockId?: string };
type BlockMenuState = { open: boolean; x: number; y: number; blockId?: string; moveToQuery: string; searchQuery: string };
type FileInsertIntent = "file" | "image" | "video" | "audio";
type FileInsertMode = "upload" | "link";
type FileInsertState = { open: boolean; intent: FileInsertIntent; mode: FileInsertMode; worldX: number; worldY: number; x: number; y: number; url: string };
type CommentPanelState = {
  open: boolean;
  blockId?: string;
  x: number;
  y: number;
  draft: string;
  attachments: string[];
  mentions: string[];
  menuCommentId?: string;
  deleteConfirmCommentId?: string;
  editingCommentId?: string;
};

const DOC_WIDTH = 680;
const LINE_HEIGHT = 32;
const LIST_ITEM_GAP = 6;
const DEFAULT_BLOCK_GAP = 14;
const INDENT_STEP = 24;
const MAX_TODO_INDENT = 8;
const ATTRIBUTION_PREFIX = "-- ";
const HANDLE_DRAG_HOLD_MS = 220;
const HANDLE_DRAG_MOVE_THRESHOLD = 4;

const QUOTE_TEXT_COLORS = [
  { id: "default", label: "Default", value: "" },
  { id: "slate", label: "Slate", value: "#334155" },
  { id: "rose", label: "Rose", value: "#9f1239" },
  { id: "teal", label: "Teal", value: "#0f766e" },
  { id: "amber", label: "Amber", value: "#92400e" },
];

const QUOTE_BACKGROUND_COLORS = [
  { id: "none", label: "None", value: "" },
  { id: "stone", label: "Stone", value: "#f5f5f4" },
  { id: "sky", label: "Sky", value: "#f0f9ff" },
  { id: "mint", label: "Mint", value: "#ecfdf5" },
  { id: "rose", label: "Rose", value: "#fff1f2" },
];

const TURN_INTO_TYPES: Array<{ type: BlockType; label: string }> = [
  { type: "text", label: "Text" },
  { type: "h1", label: "Heading 1" },
  { type: "h2", label: "Heading 2" },
  { type: "h3", label: "Heading 3" },
  { type: "todo", label: "To-do list" },
  { type: "bulleted", label: "Bulleted list" },
  { type: "toggle", label: "Toggle" },
  { type: "quote", label: "Quote" },
  { type: "callout", label: "Callout" },
  { type: "code", label: "Code" },
];

const slashCommands: SlashCommand[] = [
  { id: "text", label: "Text", description: "Plain paragraph.", aliases: ["text", "paragraph", "p"], group: "basic", symbol: "T", trigger: "" },
  { id: "h1", label: "Heading 1", description: "Large heading.", aliases: ["h1", "header", "title"], group: "basic", symbol: "H1", trigger: "#" },
  { id: "h2", label: "Heading 2", description: "Medium heading.", aliases: ["h2", "header2"], group: "basic", symbol: "H2", trigger: "##" },
  { id: "h3", label: "Heading 3", description: "Small heading.", aliases: ["h3", "header3"], group: "basic", symbol: "H3", trigger: "###" },
  { id: "bulleted", label: "Bulleted list", description: "Bullet item.", aliases: ["bullet", "list"], group: "basic", symbol: "-", trigger: "-" },
  { id: "todo", label: "To-do list", description: "Checkbox task.", aliases: ["todo", "task", "checkbox"], group: "basic", symbol: "[]", trigger: "[]" },
  { id: "file", label: "File", description: "Upload or embed a file.", aliases: ["file", "files", "upload"], group: "media", symbol: "F", trigger: "/file" },
  { id: "image", label: "Image", description: "Upload or link an image.", aliases: ["image", "photo", "img"], group: "media", symbol: "I", trigger: "/image" },
  { id: "video", label: "Video", description: "Upload or link a video.", aliases: ["video", "movie"], group: "media", symbol: "V", trigger: "/video" },
  { id: "audio", label: "Audio", description: "Upload or link audio.", aliases: ["audio", "sound"], group: "media", symbol: "A", trigger: "/audio" },
  { id: "quote", label: "Quote", description: "Quoted text.", aliases: ["quote", "citation"], group: "basic", symbol: "\"", trigger: "" },
  { id: "callout", label: "Callout", description: "Highlighted block.", aliases: ["callout", "note"], group: "basic", symbol: "!", trigger: "" },
  { id: "code", label: "Code", description: "Code snippet.", aliases: ["code", "snippet"], group: "basic", symbol: "</>", trigger: "" },
];

const idFor = () => `blk_${Math.random().toString(36).slice(2, 10)}`;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const isImageMime = (mimeType?: string) => Boolean(mimeType && mimeType.toLowerCase().startsWith("image/"));

const newBlock = (type: BlockType, x: number, y: number): PageBlock => {
  if (type === "todo") return { id: idFor(), type, content: "", checked: false, x, y, w: DOC_WIDTH, h: LINE_HEIGHT };
  if (type === "h1") return { id: idFor(), type, content: "", x, y, w: DOC_WIDTH, h: 60 };
  if (type === "h2") return { id: idFor(), type, content: "", x, y, w: DOC_WIDTH, h: 52 };
  if (type === "h3") return { id: idFor(), type, content: "", x, y, w: DOC_WIDTH, h: 44 };
  if (type === "code") return { id: idFor(), type, content: "", x, y, w: DOC_WIDTH, h: 110 };
  if (type === "quote") return { id: idFor(), type, content: "", x, y, w: DOC_WIDTH, h: 64 };
  if (type === "callout") return { id: idFor(), type, content: "", x, y, w: DOC_WIDTH, h: 64 };
  return { id: idFor(), type, content: "", x, y, w: DOC_WIDTH, h: LINE_HEIGHT };
};

const createEmptyPage = (): PageBlock[] => [newBlock("text", 120, 120)];

const parseSlashQuery = (value: string, cursor: number) => {
  const beforeCursor = value.slice(0, cursor);
  const match = beforeCursor.match(/(^|\s)\/([^\s/]*)$/);
  if (!match || match.index === undefined) return null;
  const fullMatch = match[0];
  const slashStart = match.index + fullMatch.lastIndexOf("/");
  return { query: match[2] ?? "", start: slashStart, end: cursor };
};

const blockGapFor = (type: BlockType) => (type === "todo" || type === "bulleted" ? LIST_ITEM_GAP : DEFAULT_BLOCK_GAP);

const isBulkTodoShortcut = (event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) =>
  (event.metaKey || event.ctrlKey) && (event.altKey || event.shiftKey) && (event.code === "Digit4" || event.key === "4" || event.key === "$");

const wrapSelection = (value: string, start: number, end: number, prefix: string, suffix = prefix) => {
  const from = Math.min(start, end);
  const to = Math.max(start, end);
  const middle = value.slice(from, to);
  const replacement = `${prefix}${middle || "text"}${suffix}`;
  return {
    nextValue: `${value.slice(0, from)}${replacement}${value.slice(to)}`,
    nextCursorStart: from + prefix.length,
    nextCursorEnd: from + replacement.length - suffix.length,
  };
};

const renderQuoteInlineMarkdown = (raw: string) => {
  const lines = raw.split("\n");

  return lines.map((line, lineIndex) => {
    const tokenRegex = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
    const nodes: ReactNode[] = [];
    let pointer = 0;
    let match: RegExpExecArray | null;
    let tokenIndex = 0;
    while ((match = tokenRegex.exec(line)) !== null) {
      if (match.index > pointer) {
        nodes.push(line.slice(pointer, match.index));
      }
      if (match[2] && match[3]) {
        nodes.push(
          <a key={`md-link-${lineIndex}-${tokenIndex}`} href={match[3]} target="_blank" rel="noopener noreferrer" className="underline decoration-current/40 underline-offset-4">
            {match[2]}
          </a>,
        );
      } else if (match[4]) {
        nodes.push(
          <strong key={`md-bold-${lineIndex}-${tokenIndex}`} className="font-semibold">
            {match[4]}
          </strong>,
        );
      } else if (match[5]) {
        nodes.push(
          <em key={`md-italic-${lineIndex}-${tokenIndex}`} className="italic">
            {match[5]}
          </em>,
        );
      }
      pointer = match.index + match[0].length;
      tokenIndex += 1;
    }
    if (pointer < line.length) {
      nodes.push(line.slice(pointer));
    }
    if (nodes.length === 0) {
      nodes.push(" ");
    }
    return (
      <Fragment key={`line-${lineIndex}`}>
        {nodes}
        {lineIndex < lines.length - 1 ? <br /> : null}
      </Fragment>
    );
  });
};

const isTextInputTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  if (!element) return false;
  if (element.closest('[data-page-drag-handle="true"]')) return false;
  const tag = element.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "button" || tag === "a") return true;
  return Boolean(element.closest("input,textarea,button,a"));
};

const formatFileSize = (bytes: number) => {
  if (bytes <= 0) return "External";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const inferMimeFromUrl = (url: string) => {
  const normalized = url.toLowerCase().split(/[?#]/)[0] ?? "";
  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(normalized)) return "image/*";
  if (/\.(mp4|webm|mov|m4v|mkv|avi)$/.test(normalized)) return "video/*";
  if (/\.(mp3|wav|ogg|m4a|aac|flac)$/.test(normalized)) return "audio/*";
  if (/\.pdf$/.test(normalized)) return "application/pdf";
  return "application/octet-stream";
};

const inferDisplayNameFromUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.split("/").filter(Boolean);
    const tail = pathname[pathname.length - 1];
    if (tail) return decodeURIComponent(tail);
    return parsed.hostname;
  } catch {
    return "Embedded file";
  }
};

const acceptForIntent = (intent: FileInsertIntent) => {
  if (intent === "image") return "image/*";
  if (intent === "video") return "video/*";
  if (intent === "audio") return "audio/*";
  return "";
};

const blockTypeForIntent = (intent: FileInsertIntent) => intent;

const relativeTimeLabel = (createdAt: number) => {
  const diff = Math.max(0, Date.now() - createdAt);
  if (diff < 45_000) return "Just now";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const initialForName = (name: string) => (name.trim().charAt(0) || "U").toUpperCase();

const FileDocIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[15px] w-[15px] text-[#5f5f5f]">
    <path
      d="M6.2 2.6h4.8L15.4 7v8.1a2 2 0 0 1-2 2H6.2a2 2 0 0 1-2-2V4.6a2 2 0 0 1 2-2Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M11 2.8V7h4.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function PageEditor() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const docId = searchParams.get("doc") || defaultPageDocId;
  const [blocks, setBlocks] = useState<PageBlock[]>(() => createEmptyPage());
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [viewport, setViewport] = useState({ w: 1200, h: 800 });
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [menuIndex, setMenuIndex] = useState(0);
  const [canvasMenu, setCanvasMenu] = useState<CanvasMenuState>({ open: false, x: 0, y: 0, worldX: 0, worldY: 0 });
  const [fileMenu, setFileMenu] = useState<FileMenuState>({ open: false, x: 0, y: 0 });
  const [blockMenu, setBlockMenu] = useState<BlockMenuState>({ open: false, x: 0, y: 0, moveToQuery: "", searchQuery: "" });
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [availableDocIds, setAvailableDocIds] = useState<string[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [commentAuthorName, setCommentAuthorName] = useState("Bisvo");
  const [uploadIntent, setUploadIntent] = useState<FileInsertIntent>("file");
  const [fileInsert, setFileInsert] = useState<FileInsertState>({
    open: false,
    intent: "file",
    mode: "upload",
    worldX: 120,
    worldY: 120,
    x: 48,
    y: 48,
    url: "",
  });
  const [commentPanel, setCommentPanel] = useState<CommentPanelState>({
    open: false,
    x: 44,
    y: 44,
    draft: "",
    attachments: [],
    mentions: [],
    editingCommentId: undefined,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const commentFileInputRef = useRef<HTMLInputElement | null>(null);
  const inputRefs = useRef<Record<string, HTMLElement | null>>({});
  const measuredHeightsRef = useRef<Record<string, number>>({});
  const selectionRangesRef = useRef<Record<string, { start: number; end: number }>>({});
  const pendingFocusIdRef = useRef<string | null>(null);
  const uploadAnchorRef = useRef({ x: 120, y: 120 });
  const dragRef = useRef<{ blockId: string; offsetX: number; offsetY: number } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; cameraX: number; cameraY: number; moved: boolean } | null>(null);
  const handleHoldRef = useRef<{ timer: ReturnType<typeof setTimeout> | null; pressedAt: number; blockIds: string[] } | null>(null);
  const hasLoadedRef = useRef(false);
  const saverRef = useRef(createPageSnapshotSaver(260, docId));

  const filteredMenu = useMemo(() => {
    const query = menu?.query.trim().toLowerCase() ?? "";
    if (!query) return slashCommands;
    return slashCommands.filter((item) =>
      item.label.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.aliases.some((alias) => alias.toLowerCase().includes(query)),
    );
  }, [menu?.query]);

  const activeMenuIndex = filteredMenu.length > 0 ? Math.min(menuIndex, filteredMenu.length - 1) : 0;

  const queueFocus = useCallback((blockId: string) => {
    pendingFocusIdRef.current = blockId;
    requestAnimationFrame(() => {
      const pendingId = pendingFocusIdRef.current;
      if (!pendingId) return;
      const element = inputRefs.current[pendingId];
      if (element && typeof (element as HTMLInputElement | HTMLTextAreaElement).focus === "function") {
        (element as HTMLInputElement | HTMLTextAreaElement).focus();
        pendingFocusIdRef.current = null;
      }
    });
  }, []);

  const setBlockHeight = useCallback((blockId: string, height: number) => {
    setBlocks((previous) => {
      const index = previous.findIndex((block) => block.id === blockId);
      if (index < 0) {
        return previous;
      }
      const current = previous[index]!;
      if (Math.abs(current.h - height) <= 1) {
        return previous;
      }
      const next = [...previous];
      next[index] = { ...current, h: height };
      return next;
    });
  }, []);

  const autoSizeTextarea = useCallback(
    (blockId: string, element: HTMLTextAreaElement, minHeight = LINE_HEIGHT) => {
      element.style.height = "0px";
      const next = Math.max(minHeight, element.scrollHeight);
      element.style.height = `${next}px`;
      const measured = measuredHeightsRef.current[blockId];
      if (typeof measured === "number" && Math.abs(measured - next) <= 1) {
        return;
      }
      measuredHeightsRef.current[blockId] = next;
      setBlockHeight(blockId, next);
    },
    [setBlockHeight],
  );

  const worldFromScreen = useCallback(
    (screenX: number, screenY: number) => ({ x: (screenX - camera.x) / camera.zoom, y: (screenY - camera.y) / camera.zoom }),
    [camera.x, camera.y, camera.zoom],
  );

  const toScreenPoint = useCallback(
    (worldX: number, worldY: number) => ({ x: worldX * camera.zoom + camera.x, y: worldY * camera.zoom + camera.y }),
    [camera.x, camera.y, camera.zoom],
  );

  const worldFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      return worldFromScreen(rect ? clientX - rect.left : clientX, rect ? clientY - rect.top : clientY);
    },
    [worldFromScreen],
  );

  const addTextBlockAt = useCallback(
    (worldX: number, worldY: number) => {
      const created = newBlock("text", worldX, worldY);
      setBlocks((previous) => [...previous, created]);
      queueFocus(created.id);
      return created.id;
    },
    [queueFocus],
  );

  const signFileUrl = useCallback(async (path: string) => {
    const response = await fetch("/api/page/files/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
    const payload = (await response.json().catch(() => ({}))) as { signedUrl?: string; error?: string };
    if (!response.ok || !payload.signedUrl) throw new Error(payload.error ?? "Unable to sign file URL.");
    setSignedUrls((previous) => ({ ...previous, [path]: payload.signedUrl! }));
    return payload.signedUrl;
  }, []);

  const uploadFilesAt = useCallback(
    async (files: File[], worldX: number, worldY: number, intent: FileInsertIntent = "file") => {
      if (files.length === 0) return;
      setUploading(true);
      try {
        const formData = new FormData();
        for (const file of files) formData.append("files", file);
        const response = await fetch("/api/page/files", { method: "POST", body: formData });
        const payload = (await response.json().catch(() => ({}))) as {
          files?: Array<{ path: string; name: string; size: number; mimeType: string }>;
          error?: string;
        };
        if (!response.ok || !payload.files) throw new Error(payload.error ?? "Upload failed.");

        const createdBlocks: PageBlock[] = payload.files.map((file, index) => ({
          id: idFor(),
          type: blockTypeForIntent(intent),
          content: "",
          x: worldX,
          y: worldY + index * 72,
          w: DOC_WIDTH,
          h: blockTypeForIntent(intent) === "image" ? 280 : blockTypeForIntent(intent) === "video" ? 220 : blockTypeForIntent(intent) === "audio" ? 88 : isImageMime(file.mimeType) ? 280 : 44,
          file: {
            path: file.path,
            name: file.name,
            displayName: file.name,
            size: file.size,
            mimeType: file.mimeType || "application/octet-stream",
            source: "upload",
          },
        }));
        setBlocks((previous) => [...previous, ...createdBlocks]);

        for (const file of payload.files) {
          if (isImageMime(file.mimeType) || intent === "video" || intent === "audio") void signFileUrl(file.path);
        }
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [signFileUrl],
  );

  const triggerUploadPickerAt = useCallback((worldX: number, worldY: number, intent: FileInsertIntent = "file") => {
    uploadAnchorRef.current = { x: worldX, y: worldY };
    setUploadIntent(intent);
    fileInputRef.current?.click();
  }, []);

  const openFileInsertAt = useCallback((worldX: number, worldY: number, screenX: number, screenY: number, intent: FileInsertIntent) => {
    const panelWidth = 360;
    const panelHeight = 180;
    setFileInsert({
      open: true,
      intent,
      mode: "upload",
      worldX,
      worldY,
      x: clamp(screenX, 12, Math.max(12, viewport.w - panelWidth - 12)),
      y: clamp(screenY, 12, Math.max(12, viewport.h - panelHeight - 12)),
      url: "",
    });
  }, [viewport.h, viewport.w]);

  const createEmbedBlock = useCallback(
    (url: string, worldX: number, worldY: number, intent: FileInsertIntent) => {
      const blockType = blockTypeForIntent(intent);
      const mimeType = inferMimeFromUrl(url);
      const created: PageBlock = {
        id: idFor(),
        type: blockType,
        content: "",
        x: worldX,
        y: worldY,
        w: DOC_WIDTH,
        h: blockType === "image" ? 280 : blockType === "video" ? 220 : blockType === "audio" ? 88 : 52,
        file: {
          name: inferDisplayNameFromUrl(url),
          displayName: inferDisplayNameFromUrl(url),
          size: 0,
          mimeType,
          source: "embed",
          externalUrl: url,
        },
      };
      setBlocks((previous) => [...previous, created]);
    },
    [],
  );
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setViewport({
        w: Math.max(1, Math.round(entry.contentRect.width)),
        h: Math.max(1, Math.round(entry.contentRect.height)),
      });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    saverRef.current = createPageSnapshotSaver(260, docId);
  }, [docId]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    void (async () => {
      const { data } = await supabase.auth.getUser();
      const metadata = data.user?.user_metadata as Record<string, unknown> | undefined;
      const preferred =
        (typeof metadata?.preferred_name === "string" && metadata.preferred_name.trim()) ||
        (typeof metadata?.full_name === "string" && metadata.full_name.trim()) ||
        (typeof data.user?.email === "string" && data.user.email.split("@")[0]) ||
        "Bisvo";
      setCommentAuthorName(preferred);
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const saver = saverRef.current;
    hasLoadedRef.current = false;
    void (async () => {
      try {
        const snapshot = await loadPageSnapshot(docId);
        if (cancelled) return;
        hasLoadedRef.current = true;
        setBlocks(snapshot?.blocks?.length ? snapshot.blocks : createEmptyPage());
        if (snapshot?.camera) setCamera(snapshot.camera);
        else setCamera({ x: 0, y: 0, zoom: 1 });
      } catch {
        hasLoadedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
      void saver.flush();
    };
  }, [docId]);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    saverRef.current.schedule({ blocks, camera, updatedAt: Date.now() });
  }, [blocks, camera]);

  useEffect(() => {
    const mediaBlocks = blocks.filter(
      (block) =>
        (block.type === "image" || block.type === "video" || block.type === "audio" || (block.type === "file" && isImageMime(block.file?.mimeType))) &&
        block.file?.path,
    );
    for (const block of mediaBlocks) {
      const path = block.file!.path!;
      if (!signedUrls[path]) void signFileUrl(path);
    }
  }, [blocks, signFileUrl, signedUrls]);

  useEffect(() => {
    void (async () => {
      const ids = await listPageDocIds();
      setAvailableDocIds(ids.length ? ids : [defaultPageDocId]);
    })();
  }, [blocks, docId]);

  useEffect(() => {
    const closeMenus = () => {
      setCanvasMenu((previous) => ({ ...previous, open: false }));
      setFileMenu((previous) => ({ ...previous, open: false }));
      setBlockMenu((previous) => ({ ...previous, open: false, moveToQuery: "", searchQuery: "" }));
      setFileInsert((previous) => ({ ...previous, open: false }));
      setCommentPanel((previous) => ({ ...previous, open: false, menuCommentId: undefined, deleteConfirmCommentId: undefined, editingCommentId: undefined }));
    };
    window.addEventListener("pointerdown", closeMenus);
    return () => window.removeEventListener("pointerdown", closeMenus);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenu(null);
        return;
      }
      if (!filteredMenu.length) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setMenuIndex((previous) => (previous + 1) % filteredMenu.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setMenuIndex((previous) => (previous - 1 + filteredMenu.length) % filteredMenu.length);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filteredMenu, menu]);

  useEffect(() => {
    if (!fileInsert.open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setFileInsert((previous) => ({ ...previous, open: false }));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fileInsert.open]);

  useEffect(() => {
    if (!commentPanel.open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setCommentPanel((previous) => ({ ...previous, open: false, menuCommentId: undefined, deleteConfirmCommentId: undefined, editingCommentId: undefined }));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commentPanel.open]);

  const updateBlock = useCallback((blockId: string, patch: Partial<PageBlock>) => {
    setBlocks((previous) => previous.map((block) => (block.id === blockId ? { ...block, ...patch } : block)));
  }, []);

  const deleteBlocks = useCallback((targetIds: string[]) => {
    if (targetIds.length === 0) return;
    const targetSet = new Set(targetIds);
    setBlocks((previous) => previous.filter((block) => !targetSet.has(block.id)));
    setSelectedBlockIds((previous) => previous.filter((id) => !targetSet.has(id)));
  }, []);

  const duplicateBlock = useCallback(
    (blockId: string) => {
      setBlocks((previous) => {
        const index = previous.findIndex((block) => block.id === blockId);
        if (index < 0) return previous;
        const source = previous[index]!;
        const duplicate: PageBlock = {
          ...source,
          id: idFor(),
          y: source.y + Math.max(source.h + blockGapFor(source.type), LINE_HEIGHT + blockGapFor(source.type)),
          comments: source.comments?.map((comment) => ({ ...comment, id: idFor(), createdAt: Date.now() })),
        };
        return [...previous.slice(0, index + 1), duplicate, ...previous.slice(index + 1)];
      });
    },
    [],
  );

  const turnBlockInto = useCallback((blockId: string, nextType: BlockType) => {
    setBlocks((previous) =>
      previous.map((block) => {
        if (block.id !== blockId || block.type === "file") return block;
        return {
          ...block,
          type: nextType,
          checked: nextType === "todo" ? false : undefined,
          indent: nextType === "todo" || nextType === "bulleted" || nextType === "toggle" ? block.indent : undefined,
          textColor: nextType === "quote" ? block.textColor : undefined,
          backgroundColor: nextType === "quote" ? block.backgroundColor : undefined,
        };
      }),
    );
  }, []);

  const copyBlockLink = useCallback(
    async (blockId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (docId === defaultPageDocId) {
        params.delete("doc");
      } else {
        params.set("doc", docId);
      }
      const query = params.toString();
      const url = `${window.location.origin}${pathname}${query ? `?${query}` : ""}#${blockId}`;
      await navigator.clipboard.writeText(url);
    },
    [docId, pathname, searchParams],
  );

  const highlightBlockByHash = useCallback(
    (blockId: string) => {
      const target = inputRefs.current[blockId];
      if (target) {
        target.classList.add("ring-2", "ring-[var(--color-accent)]");
        setTimeout(() => {
          target.classList.remove("ring-2", "ring-[var(--color-accent)]");
        }, 1200);
      }
      queueFocus(blockId);
    },
    [queueFocus],
  );

  useEffect(() => {
    const hash = window.location.hash.replace("#", "").trim();
    if (!hash) return;
    const exists = blocks.some((block) => block.id === hash);
    if (!exists) return;
    highlightBlockByHash(hash);
  }, [blocks, highlightBlockByHash]);

  const moveBlocksToDoc = useCallback(
    async (targetDocId: string, blockIds: string[]) => {
      const uniqueTarget = targetDocId.trim() || defaultPageDocId;
      const movingSet = new Set(blockIds);
      if (!movingSet.size) return;

      const movingBlocks = blocks.filter((block) => movingSet.has(block.id));
      if (movingBlocks.length === 0) return;

      const targetSnapshot = (await loadPageSnapshot(uniqueTarget)) ?? {
        blocks: [],
        camera: { x: 0, y: 0, zoom: 1 },
        updatedAt: Date.now(),
      };

      const maxY = targetSnapshot.blocks.reduce((max, block) => Math.max(max, block.y + block.h), 100);
      const pasted = movingBlocks.map((block, index) => ({
        ...block,
        y: maxY + 24 + index * Math.max(block.h + blockGapFor(block.type), LINE_HEIGHT + blockGapFor(block.type)),
      }));

      await savePageSnapshot(
        {
          ...targetSnapshot,
          blocks: [...targetSnapshot.blocks, ...pasted],
          updatedAt: Date.now(),
        },
        uniqueTarget,
      );

      setBlocks((previous) => previous.filter((block) => !movingSet.has(block.id)));
      setSelectedBlockIds((previous) => previous.filter((id) => !movingSet.has(id)));
      setAvailableDocIds((previous) => (previous.includes(uniqueTarget) ? previous : [uniqueTarget, ...previous]));
    },
    [blocks],
  );

  const turnBlockIntoPage = useCallback(
    async (blockId: string) => {
      const block = blocks.find((entry) => entry.id === blockId);
      if (!block) return;
      const pageDocId = `page_${Math.random().toString(36).slice(2, 8)}`;
      const nestedIds = [blockId];
      for (const candidate of blocks) {
        if (candidate.id === blockId) continue;
        if (candidate.y > block.y && Math.abs(candidate.x - block.x) <= 36) {
          nestedIds.push(candidate.id);
        }
      }
      await moveBlocksToDoc(pageDocId, nestedIds);
      const pageBlock: PageBlock = {
        id: idFor(),
        type: "page",
        content: block.content.trim() || "Untitled Page",
        x: block.x,
        y: block.y,
        w: DOC_WIDTH,
        h: LINE_HEIGHT + 8,
        pageId: pageDocId,
      };
      setBlocks((previous) => [...previous, pageBlock]);
      const next = new URLSearchParams(searchParams.toString());
      next.set("doc", pageDocId);
      router.push(`${pathname}?${next.toString()}`);
    },
    [blocks, moveBlocksToDoc, pathname, router, searchParams],
  );

  const openCommentPanel = useCallback(
    (blockId: string, x: number, y: number) => {
      const panelWidth = 360;
      const panelHeight = 320;
      setCanvasMenu((previous) => ({ ...previous, open: false }));
      setFileMenu((previous) => ({ ...previous, open: false }));
      setBlockMenu((previous) => ({ ...previous, open: false, moveToQuery: "", searchQuery: "" }));
      setCommentPanel((previous) => ({
        ...previous,
        open: true,
        blockId,
        x: clamp(x, 10, Math.max(10, viewport.w - panelWidth - 10)),
        y: clamp(y, 10, Math.max(10, viewport.h - panelHeight - 10)),
        menuCommentId: undefined,
        deleteConfirmCommentId: undefined,
        editingCommentId: undefined,
      }));
    },
    [viewport.h, viewport.w],
  );

  const updateCommentInBlock = useCallback((blockId: string, commentId: string, nextText: string) => {
    const trimmed = nextText.trim();
    if (!trimmed) return;
    setBlocks((previous) =>
      previous.map((block) =>
        block.id === blockId
          ? {
              ...block,
              comments: (block.comments ?? []).map((comment) => (comment.id === commentId ? { ...comment, text: trimmed } : comment)),
            }
          : block,
      ),
    );
  }, []);

  const postComment = useCallback(() => {
    const blockId = commentPanel.blockId;
    if (!blockId) return;
    const text = commentPanel.draft.trim();
    if (!text && commentPanel.attachments.length === 0) return;
    if (commentPanel.editingCommentId) {
      updateCommentInBlock(blockId, commentPanel.editingCommentId, text);
      setCommentPanel((previous) => ({
        ...previous,
        draft: "",
        attachments: [],
        mentions: [],
        menuCommentId: undefined,
        deleteConfirmCommentId: undefined,
        editingCommentId: undefined,
      }));
      return;
    }
    const mentions = Array.from(new Set((text.match(/@[\w.-]+/g) ?? []).map((token) => token.slice(1))));
    setBlocks((previous) =>
      previous.map((block) =>
        block.id === blockId
          ? {
              ...block,
              comments: [
                ...(block.comments ?? []),
                {
                  id: idFor(),
                  authorName: commentAuthorName,
                  text,
                  createdAt: Date.now(),
                  attachments: commentPanel.attachments.length ? commentPanel.attachments : undefined,
                  mentions: mentions.length ? mentions : undefined,
                },
              ],
            }
          : block,
      ),
    );
    setCommentPanel((previous) => ({
      ...previous,
      draft: "",
      attachments: [],
      mentions: [],
      menuCommentId: undefined,
      deleteConfirmCommentId: undefined,
      editingCommentId: undefined,
    }));
  }, [commentAuthorName, commentPanel.attachments, commentPanel.blockId, commentPanel.draft, commentPanel.editingCommentId, updateCommentInBlock]);

  const deleteCommentFromBlock = useCallback((blockId: string, commentId: string) => {
    setBlocks((previous) =>
      previous.map((block) =>
        block.id === blockId
          ? {
              ...block,
              comments: (block.comments ?? []).filter((comment) => comment.id !== commentId),
            }
          : block,
      ),
    );
  }, []);

  const rememberSelection = useCallback((blockId: string, element: HTMLInputElement | HTMLTextAreaElement) => {
    selectionRangesRef.current[blockId] = {
      start: element.selectionStart ?? 0,
      end: element.selectionEnd ?? 0,
    };
  }, []);

  const turnSelectionIntoQuote = useCallback(
    (blockId: string) => {
      setBlocks((previous) => {
        const index = previous.findIndex((entry) => entry.id === blockId);
        if (index < 0) {
          return previous;
        }
        const block = previous[index]!;
        if (block.type === "file") {
          return previous;
        }

        const selected = selectionRangesRef.current[blockId];
        const start = selected ? Math.max(0, Math.min(selected.start, block.content.length)) : 0;
        const end = selected ? Math.max(0, Math.min(selected.end, block.content.length)) : block.content.length;
        const hasSelection = end > start;

        if (!hasSelection) {
          const next = [...previous];
          next[index] = {
            ...block,
            type: "quote",
            checked: undefined,
            indent: undefined,
          };
          return next;
        }

        const before = block.content.slice(0, start).trimEnd();
        const quoteBody = block.content.slice(start, end).trim();
        const after = block.content.slice(end).trimStart();
        if (!quoteBody.length) {
          return previous;
        }

        const sequence: PageBlock[] = [];
        let currentY = block.y;
        if (before.length) {
          sequence.push({
            ...block,
            type: "text",
            content: before,
            checked: undefined,
            indent: undefined,
            textColor: undefined,
            backgroundColor: undefined,
          });
          currentY += Math.max(block.h + blockGapFor("text"), LINE_HEIGHT + blockGapFor("text"));
        }

        const quoteBlock: PageBlock = {
          id: idFor(),
          type: "quote",
          content: quoteBody,
          x: block.x,
          y: currentY,
          w: DOC_WIDTH,
          h: 84,
        };
        sequence.push(quoteBlock);
        currentY += Math.max(quoteBlock.h + blockGapFor("quote"), LINE_HEIGHT + blockGapFor("quote"));

        if (after.length) {
          sequence.push({
            id: idFor(),
            type: "text",
            content: after,
            x: block.x,
            y: currentY,
            w: DOC_WIDTH,
            h: Math.max(LINE_HEIGHT, block.h),
          });
        }

        return [...previous.slice(0, index), ...sequence, ...previous.slice(index + 1)];
      });
    },
    [],
  );

  const updateTodoIndent = useCallback(
    (block: PageBlock, delta: number) => {
      const currentIndent = block.indent ?? 0;
      const nextIndent = clamp(currentIndent + delta, 0, MAX_TODO_INDENT);
      if (nextIndent === currentIndent) {
        return;
      }
      updateBlock(block.id, { indent: nextIndent || undefined });
    },
    [updateBlock],
  );

  const bulkConvertSelectionToTodos = useCallback(
    (block: PageBlock, selectionStart: number | null, selectionEnd: number | null) => {
      if (block.type === "file") {
        return false;
      }

      const rawStart = selectionStart ?? 0;
      const rawEnd = selectionEnd ?? block.content.length;
      const isCollapsed = rawStart === rawEnd;
      const selectedStart = isCollapsed ? 0 : Math.min(rawStart, rawEnd);
      const selectedEnd = isCollapsed ? block.content.length : Math.max(rawStart, rawEnd);
      const lineStart = block.content.lastIndexOf("\n", Math.max(0, selectedStart - 1)) + 1;
      const lineEndIndex = block.content.indexOf("\n", selectedEnd);
      const lineEnd = lineEndIndex === -1 ? block.content.length : lineEndIndex;

      const selectedSlice = block.content.slice(lineStart, lineEnd);
      const todoLines = selectedSlice
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (todoLines.length === 0) {
        return false;
      }

      const beforeContent = block.content.slice(0, lineStart).replace(/\n+$/, "");
      const afterContent = block.content.slice(lineEnd).replace(/^\n+/, "");
      const spacingForTodos = LINE_HEIGHT + blockGapFor("todo");
      const todoDrafts = todoLines.map((line) => ({
        id: idFor(),
        type: "todo" as const,
        content: line,
        checked: false,
        x: block.x,
        w: DOC_WIDTH,
        h: LINE_HEIGHT,
        indent: block.indent,
      }));
      const focusTargetId = beforeContent.length > 0 ? todoDrafts[0]?.id : todoDrafts[0]?.id ?? block.id;

      setBlocks((previous) => {
        const index = previous.findIndex((entry) => entry.id === block.id);
        if (index < 0) {
          return previous;
        }

        const sequence: PageBlock[] = [];
        let currentY = block.y;

        if (beforeContent.length > 0) {
          sequence.push({
            ...block,
            type: "text",
            content: beforeContent,
            checked: undefined,
            indent: undefined,
          });
          currentY += Math.max(block.h + blockGapFor("text"), LINE_HEIGHT + blockGapFor("text"));
        }

        for (const todoDraft of todoDrafts) {
          sequence.push({
            ...todoDraft,
            y: currentY,
          });
          currentY += spacingForTodos;
        }

        if (afterContent.length > 0) {
          sequence.push({
            id: idFor(),
            type: "text",
            content: afterContent,
            x: block.x,
            y: currentY,
            w: DOC_WIDTH,
            h: Math.max(LINE_HEIGHT, block.h),
          });
        }

        if (sequence.length === 0) {
          return previous;
        }

        return [...previous.slice(0, index), ...sequence, ...previous.slice(index + 1)];
      });

      if (focusTargetId) {
        queueFocus(focusTargetId);
      }
      return true;
    },
    [queueFocus],
  );

  const handleTextualChange = useCallback(
    (blockId: string, event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      const cursor = event.target.selectionStart ?? value.length;
      const quoteShortcut = value.slice(0, cursor).match(/(^|\n)"\s$/);
      if (quoteShortcut) {
        const markerStart = cursor - 2;
        const nextContent = `${value.slice(0, markerStart)}${value.slice(cursor)}`;
        updateBlock(blockId, { type: "quote", content: nextContent, checked: undefined, indent: undefined });
        setMenu(null);
        return;
      }
      updateBlock(blockId, { content: value });
      const slash = parseSlashQuery(value, cursor);
      if (!slash) {
        setMenu((previous) => (previous?.blockId === blockId ? null : previous));
        return;
      }
      const rect = event.target.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      const anchorX = (containerRect ? rect.left - containerRect.left : rect.left) + 12;
      const anchorY = (containerRect ? rect.bottom - containerRect.top : rect.bottom) + 8;
      setMenu({ blockId, query: slash.query, slashRange: { start: slash.start, end: slash.end }, anchorX, anchorY });
      setMenuIndex(0);
    },
    [updateBlock],
  );

  const applySlashCommand = useCallback(
    (commandId: SlashCommandId) => {
      if (!menu) return;
      const block = blocks.find((item) => item.id === menu.blockId);
      if (!block) {
        setMenu(null);
        return;
      }

      const nextContent = `${block.content.slice(0, menu.slashRange.start)}${block.content.slice(menu.slashRange.end)}`;
      if (commandId === "file" || commandId === "image" || commandId === "video" || commandId === "audio") {
        updateBlock(block.id, { content: nextContent });
        const base = toScreenPoint(block.x, block.y + block.h + 12);
        openFileInsertAt(block.x, block.y + block.h + 12, base.x + 16, base.y + 10, commandId);
        setMenu(null);
        return;
      }

      updateBlock(block.id, {
        type: commandId,
        content: nextContent,
        checked: commandId === "todo" ? false : undefined,
        indent: commandId === "todo" ? block.indent : undefined,
        w: DOC_WIDTH,
      });
      setMenu(null);
      queueFocus(block.id);
    },
    [blocks, menu, openFileInsertAt, queueFocus, toScreenPoint, updateBlock],
  );

  const insertBlockBelow = useCallback(
    (source: PageBlock, type: BlockType, initialContent = "") => {
      const created = newBlock(type, source.x, source.y + Math.max(source.h + blockGapFor(source.type), LINE_HEIGHT + blockGapFor(source.type)));
      if (initialContent) {
        created.content = initialContent;
      }
      if ((type === "todo" || type === "bulleted") && typeof source.indent === "number" && source.indent > 0) {
        created.indent = source.indent;
      }
      setBlocks((previous) => {
        const index = previous.findIndex((item) => item.id === source.id);
        if (index < 0) {
          return [...previous, created];
        }
        return [...previous.slice(0, index + 1), created, ...previous.slice(index + 1)];
      });
      queueFocus(created.id);
    },
    [queueFocus],
  );

  const removeBlockAndFocusNeighbor = useCallback(
    (blockId: string) => {
      setBlocks((previous) => {
        const index = previous.findIndex((item) => item.id === blockId);
        if (index < 0) {
          return previous;
        }
        if (previous.length <= 1) {
          return [];
        }
        const neighbor = previous[index - 1] ?? previous[index + 1];
        if (neighbor) {
          queueFocus(neighbor.id);
        }
        return previous.filter((item) => item.id !== blockId);
      });
    },
    [queueFocus],
  );

  const onBlockKeyDown = useCallback(
    (block: PageBlock, event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (isBulkTodoShortcut(event)) {
        const converted = bulkConvertSelectionToTodos(block, event.currentTarget.selectionStart, event.currentTarget.selectionEnd);
        if (converted) {
          event.preventDefault();
          return;
        }
      }

      if (block.type === "quote" && (event.metaKey || event.ctrlKey) && ["b", "i", "k"].includes(event.key.toLowerCase())) {
        event.preventDefault();
        const start = event.currentTarget.selectionStart ?? 0;
        const end = event.currentTarget.selectionEnd ?? 0;
        const lowered = event.key.toLowerCase();
        if (lowered === "b") {
          const { nextValue, nextCursorStart, nextCursorEnd } = wrapSelection(block.content, start, end, "**");
          updateBlock(block.id, { content: nextValue });
          requestAnimationFrame(() => {
            const input = inputRefs.current[block.id] as HTMLTextAreaElement | null;
            if (!input) return;
            input.focus();
            input.setSelectionRange(nextCursorStart, nextCursorEnd);
          });
          return;
        }
        if (lowered === "i") {
          const { nextValue, nextCursorStart, nextCursorEnd } = wrapSelection(block.content, start, end, "*");
          updateBlock(block.id, { content: nextValue });
          requestAnimationFrame(() => {
            const input = inputRefs.current[block.id] as HTMLTextAreaElement | null;
            if (!input) return;
            input.focus();
            input.setSelectionRange(nextCursorStart, nextCursorEnd);
          });
          return;
        }
        const selectedText = block.content.slice(Math.min(start, end), Math.max(start, end)) || "link";
        const url = window.prompt("Paste URL", "https://");
        if (!url) {
          return;
        }
        const replacement = `[${selectedText}](${url.trim()})`;
        const from = Math.min(start, end);
        const to = Math.max(start, end);
        const nextValue = `${block.content.slice(0, from)}${replacement}${block.content.slice(to)}`;
        updateBlock(block.id, { content: nextValue });
        requestAnimationFrame(() => {
          const input = inputRefs.current[block.id] as HTMLTextAreaElement | null;
          if (!input) return;
          input.focus();
          const caret = from + replacement.length;
          input.setSelectionRange(caret, caret);
        });
        return;
      }

      if (menu && menu.blockId === block.id && event.key === "Enter") {
        event.preventDefault();
        const picked = filteredMenu[activeMenuIndex];
        if (picked) applySlashCommand(picked.id);
        return;
      }

      if (event.key === "Tab" && block.type === "todo") {
        event.preventDefault();
        updateTodoIndent(block, event.shiftKey ? -1 : 1);
        return;
      }

      if (event.key === "Enter" && !event.shiftKey && !menu && ["h1", "h2", "h3", "todo", "bulleted", "quote", "callout"].includes(block.type)) {
        event.preventDefault();
        if (block.type === "todo" || block.type === "bulleted") {
          const isEmpty = block.content.trim().length === 0;
          if (isEmpty) {
            updateBlock(block.id, { type: "text", checked: undefined, indent: undefined });
            queueFocus(block.id);
            return;
          }
          insertBlockBelow(block, block.type);
          return;
        }
        if (block.type === "quote") {
          insertBlockBelow(block, "text", ATTRIBUTION_PREFIX);
          return;
        }
        insertBlockBelow(block, "text");
        return;
      }

      if (event.key === "Backspace" && (block.type === "todo" || block.type === "bulleted")) {
        const cursorStart = event.currentTarget.selectionStart ?? 0;
        if (cursorStart === 0 && block.content.trim().length === 0) {
          event.preventDefault();
          updateBlock(block.id, { type: "text", checked: undefined, indent: undefined });
          queueFocus(block.id);
          return;
        }
      }

      if ((event.key === "Backspace" || event.key === "Delete") && block.type !== "file" && block.content.trim().length === 0) {
        event.preventDefault();
        removeBlockAndFocusNeighbor(block.id);
      }
    },
    [
      activeMenuIndex,
      applySlashCommand,
      bulkConvertSelectionToTodos,
      filteredMenu,
      insertBlockBelow,
      menu,
      queueFocus,
      removeBlockAndFocusNeighbor,
      updateBlock,
      updateTodoIndent,
    ],
  );

  const beginPan = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      panRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        cameraX: camera.x,
        cameraY: camera.y,
        moved: false,
      };

      const onMove = (moveEvent: PointerEvent) => {
        const pan = panRef.current;
        if (!pan) return;
        const dx = moveEvent.clientX - pan.startX;
        const dy = moveEvent.clientY - pan.startY;
        if (Math.abs(dx) + Math.abs(dy) > 4) pan.moved = true;
        setCamera((previous) => ({ ...previous, x: pan.cameraX + dx, y: pan.cameraY + dy }));
      };

      const onUp = (upEvent: PointerEvent) => {
        const pan = panRef.current;
        panRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        if (!pan?.moved) {
          const world = worldFromClient(upEvent.clientX, upEvent.clientY);
          addTextBlockAt(world.x, world.y);
        }
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [addTextBlockAt, camera.x, camera.y, worldFromClient],
  );

  const beginDragBlock = useCallback(
    (block: PageBlock, event: ReactPointerEvent<HTMLElement>, blockIds?: string[]) => {
      if (event.button !== 0 || isTextInputTarget(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      setMenu(null);
      setBlockMenu((previous) => ({ ...previous, open: false, moveToQuery: "", searchQuery: "" }));
      const world = worldFromClient(event.clientX, event.clientY);
      const draggingIds = blockIds && blockIds.length > 0 ? blockIds : [block.id];
      const sourceBlocks = blocks.filter((entry) => draggingIds.includes(entry.id));
      const leadBlock = sourceBlocks.find((entry) => entry.id === block.id) ?? block;
      dragRef.current = { blockId: leadBlock.id, offsetX: world.x - leadBlock.x, offsetY: world.y - leadBlock.y };
      const startPositions = new Map(sourceBlocks.map((entry) => [entry.id, { x: entry.x, y: entry.y }]));
      const leadStart = startPositions.get(leadBlock.id) ?? { x: leadBlock.x, y: leadBlock.y };

      const onMove = (moveEvent: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag) return;
        const pointer = worldFromClient(moveEvent.clientX, moveEvent.clientY);
        const nextLeadX = pointer.x - drag.offsetX;
        const nextLeadY = pointer.y - drag.offsetY;
        const deltaX = nextLeadX - leadStart.x;
        const deltaY = nextLeadY - leadStart.y;
        setBlocks((previous) =>
          previous.map((entry) =>
            startPositions.has(entry.id)
              ? {
                  ...entry,
                  x: (startPositions.get(entry.id)?.x ?? entry.x) + deltaX,
                  y: (startPositions.get(entry.id)?.y ?? entry.y) + deltaY,
                }
              : entry,
          ),
        );
      };

      const onUp = () => {
        dragRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        setBlocks((previous) => {
          const lead = previous.find((entry) => entry.id === leadBlock.id);
          if (!lead) return previous;
          const target = previous
            .filter((entry) => entry.id !== lead.id && !startPositions.has(entry.id))
            .find((entry) => Math.abs(entry.y - lead.y) < 80);
          if (!target) return previous;

          const next = previous.map((entry) => ({ ...entry }));
          const leadEntry = next.find((entry) => entry.id === lead.id);
          if (!leadEntry) return previous;

          // Rearrange vertically when dropped near the same horizontal lane.
          if (Math.abs(leadEntry.x - target.x) <= 32) {
            leadEntry.x = target.x;
            leadEntry.y = target.y + Math.max(target.h + blockGapFor(target.type), LINE_HEIGHT + blockGapFor(target.type));
            if (leadEntry.type === "todo" || leadEntry.type === "bulleted" || leadEntry.type === "toggle") {
              leadEntry.indent = target.indent;
            }
            return next;
          }

          // Create columns by snapping to left/right side of target.
          if (Math.abs(leadEntry.y - target.y) <= 44 && Math.abs(leadEntry.x - target.x) > 120) {
            const horizontalOffset = leadEntry.x > target.x ? target.w * 0.55 : -target.w * 0.55;
            leadEntry.x = target.x + horizontalOffset;
            leadEntry.y = target.y;
            return next;
          }

          // Nest if slightly right and below target.
          if (leadEntry.y > target.y && leadEntry.x > target.x + 8 && leadEntry.x < target.x + 96) {
            leadEntry.x = target.x;
            if (leadEntry.type === "todo" || leadEntry.type === "bulleted" || leadEntry.type === "toggle") {
              leadEntry.indent = clamp((target.indent ?? 0) + 1, 0, MAX_TODO_INDENT);
            }
            leadEntry.y = target.y + Math.max(target.h + blockGapFor(target.type), LINE_HEIGHT + blockGapFor(target.type));
            return next;
          }

          return previous;
        });
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [blocks, worldFromClient],
  );

  const onCanvasPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || event.target !== event.currentTarget) return;
      setMenu(null);
      setSelectedBlockIds([]);
      beginPan(event);
    },
    [beginPan],
  );

  const onHandlePointerDown = useCallback(
    (block: PageBlock, event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();

      if (event.metaKey || event.ctrlKey) {
        setSelectedBlockIds((previous) => (previous.includes(block.id) ? previous.filter((id) => id !== block.id) : [...previous, block.id]));
        return;
      }

      const activeSelection = selectedBlockIds.includes(block.id) ? selectedBlockIds : [block.id];
      handleHoldRef.current = {
        timer: null,
        pressedAt: Date.now(),
        blockIds: activeSelection,
      };

      const startX = event.clientX;
      const startY = event.clientY;

      const startDrag = (clientX: number, clientY: number) => {
        const synthetic = {
          ...event,
          clientX,
          clientY,
          button: 0,
          preventDefault: () => {},
          stopPropagation: () => {},
          target: event.target,
        } as unknown as ReactPointerEvent<HTMLElement>;
        beginDragBlock(block, synthetic, activeSelection);
      };

      handleHoldRef.current.timer = setTimeout(() => {
        startDrag(startX, startY);
      }, HANDLE_DRAG_HOLD_MS);

      const onMove = (moveEvent: PointerEvent) => {
        const hold = handleHoldRef.current;
        if (!hold) return;
        if (Math.abs(moveEvent.clientX - startX) + Math.abs(moveEvent.clientY - startY) > HANDLE_DRAG_MOVE_THRESHOLD) {
          if (hold.timer) {
            clearTimeout(hold.timer);
            hold.timer = null;
          }
          startDrag(moveEvent.clientX, moveEvent.clientY);
          handleHoldRef.current = null;
          cleanup();
        }
      };

      const onUp = () => {
        const hold = handleHoldRef.current;
        if (hold?.timer) {
          clearTimeout(hold.timer);
          hold.timer = null;
          setBlockMenu({ open: true, x: startX, y: startY, blockId: block.id, moveToQuery: "", searchQuery: "" });
          setCanvasMenu((previous) => ({ ...previous, open: false }));
          setFileMenu((previous) => ({ ...previous, open: false }));
        }
        handleHoldRef.current = null;
        cleanup();
      };

      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [beginDragBlock, selectedBlockIds],
  );
  const openFileBlock = useCallback(
    async (block: PageBlock) => {
      if (!block.file) return;
      try {
        const url = block.file.externalUrl
          ? block.file.externalUrl
          : block.file.path
            ? signedUrls[block.file.path] ?? (await signFileUrl(block.file.path))
            : null;
        if (!url) return;
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Unable to open file.");
      }
    },
    [signFileUrl, signedUrls],
  );

  const downloadFileBlock = useCallback(
    async (block: PageBlock) => {
      if (!block.file) return;
      try {
        const url = block.file.externalUrl
          ? block.file.externalUrl
          : block.file.path
            ? signedUrls[block.file.path] ?? (await signFileUrl(block.file.path))
            : null;
        if (!url) return;
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = block.file.displayName || block.file.name || "file";
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Unable to download file.");
      }
    },
    [signFileUrl, signedUrls],
  );

  const renameFileBlock = useCallback((blockId: string) => {
    setBlocks((previous) => {
      const current = previous.find((entry) => entry.id === blockId);
      if (!current?.file) return previous;
      const nextName = window.prompt("Rename file block title", current.file.displayName);
      if (!nextName || !nextName.trim()) return previous;
      return previous.map((entry) =>
        entry.id === blockId && entry.file
          ? {
              ...entry,
              file: {
                ...entry.file,
                displayName: nextName.trim(),
              },
            }
          : entry,
      );
    });
  }, []);

  const deleteFileBlock = useCallback(
    async (blockId: string) => {
      const block = blocks.find((entry) => entry.id === blockId);
      if (!block?.file) return;
      if (block.file.externalUrl) {
        setBlocks((previous) => previous.filter((entry) => entry.id !== blockId));
        return;
      }
      if (!block.file.path) return;
      try {
        const response = await fetch("/api/page/files", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: block.file.path }),
        });
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Unable to delete file.");
        setBlocks((previous) => previous.filter((entry) => entry.id !== blockId));
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Unable to delete file.");
      }
    },
    [blocks],
  );

  const updateFileCaption = useCallback((blockId: string) => {
    const current = blocks.find((entry) => entry.id === blockId);
    if (!current) return;
    const caption = window.prompt("Add caption", current.content || "");
    if (caption === null) return;
    updateBlock(blockId, { content: caption.trim() });
  }, [blocks, updateBlock]);

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      const screenX = rect ? event.clientX - rect.left : event.clientX;
      const screenY = rect ? event.clientY - rect.top : event.clientY;

      if (event.ctrlKey || event.metaKey) {
        const pointerWorld = worldFromScreen(screenX, screenY);
        const zoomFactor = event.deltaY > 0 ? 0.92 : 1.08;
        const nextZoom = clamp(camera.zoom * zoomFactor, 0.28, 2.4);
        setCamera({ x: screenX - pointerWorld.x * nextZoom, y: screenY - pointerWorld.y * nextZoom, zoom: nextZoom });
        return;
      }

      setCamera((previous) => ({ ...previous, x: previous.x - event.deltaX, y: previous.y - event.deltaY }));
    },
    [camera.zoom, worldFromScreen],
  );

  const renderInput = (block: PageBlock) => {
    const attachInputRef = (node: HTMLElement | null) => {
      inputRefs.current[block.id] = node;
    };

    const sharedProps = {
      value: block.content,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        handleTextualChange(block.id, event);
        rememberSelection(block.id, event.target);
        if (event.target instanceof HTMLTextAreaElement) {
          const minHeight = block.type === "code" ? 92 : LINE_HEIGHT;
          autoSizeTextarea(block.id, event.target, minHeight);
        }
      },
      onSelect: (event: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        rememberSelection(block.id, event.currentTarget);
      },
      onKeyDown: (event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlockKeyDown(block, event),
      placeholder: 'Type "/" for commands',
    };

    if (block.type === "h1") {
      return <input ref={attachInputRef as never} {...sharedProps} className="w-full bg-transparent text-5xl font-black tracking-tight text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/65" />;
    }
    if (block.type === "h2") {
      return <input ref={attachInputRef as never} {...sharedProps} className="w-full bg-transparent text-4xl font-bold text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/65" />;
    }
    if (block.type === "h3") {
      return <input ref={attachInputRef as never} {...sharedProps} className="w-full bg-transparent text-3xl font-semibold text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/65" />;
    }
    if (block.type === "todo") {
      return (
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={Boolean(block.checked)}
            onChange={(event) => updateBlock(block.id, { checked: event.target.checked })}
            className="mt-1 h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-surface)]"
          />
          <input
            ref={attachInputRef as never}
            {...sharedProps}
            className={cn(
              "w-full bg-transparent text-base text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/65",
              block.checked ? "line-through text-[var(--color-text-muted)]" : "",
            )}
          />
        </div>
      );
    }
    if (block.type === "bulleted") {
      return (
        <div className="flex items-start gap-3">
          <span className="mt-1 text-[var(--color-text-muted)]">-</span>
          <input
            ref={attachInputRef as never}
            {...sharedProps}
            className="w-full bg-transparent text-base text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/65"
          />
        </div>
      );
    }
    if (block.type === "page") {
      return (
        <button
          type="button"
          className="w-full rounded bg-[var(--color-surface-muted)] px-3 py-2 text-left text-base font-medium text-[var(--color-text)] underline decoration-[var(--color-border)] underline-offset-4"
          onClick={() => {
            if (!block.pageId) return;
            const params = new URLSearchParams(searchParams.toString());
            params.set("doc", block.pageId);
            router.push(`${pathname}?${params.toString()}`);
          }}
        >
          {block.content || "Open page"}
        </button>
      );
    }
    if (block.type === "quote") {
      const hasMarkdownSyntax = /\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\((https?:\/\/[^\s)]+)\)/.test(block.content);
      return (
        <div
          className="rounded-md border-l-4 px-4 py-2"
          style={{
            borderLeftColor: block.textColor || "var(--color-border)",
            backgroundColor: block.backgroundColor || "transparent",
            color: block.textColor || "var(--color-text)",
          }}
        >
          <textarea
            ref={attachInputRef as never}
            {...sharedProps}
            rows={1}
            onFocus={() => setEditingQuoteId(block.id)}
            onBlur={() => setEditingQuoteId((previous) => (previous === block.id ? null : previous))}
            className="w-full resize-none bg-transparent pl-1 text-[1.28rem] font-medium italic leading-9 outline-none placeholder:text-[var(--color-text-muted)]/65"
          />
          {hasMarkdownSyntax && editingQuoteId !== block.id && (
            <div className="mt-1.5 pl-1 text-base leading-7 opacity-95">{renderQuoteInlineMarkdown(block.content)}</div>
          )}
        </div>
      );
    }
    if (block.type === "callout") {
      return (
        <textarea
          ref={attachInputRef as never}
          {...sharedProps}
          rows={1}
          className="w-full resize-none bg-transparent text-base text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/65"
        />
      );
    }
    if (block.type === "code") {
      return (
        <textarea
          ref={attachInputRef as never}
          {...sharedProps}
          rows={3}
          className="w-full resize-none bg-transparent font-mono text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/65"
        />
      );
    }

    return (
      <textarea
        ref={attachInputRef as never}
        {...sharedProps}
        rows={1}
        className="w-full resize-none bg-transparent text-base leading-8 text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/65"
      />
    );
  };

  const menuBlock = menu ? blocks.find((block) => block.id === menu.blockId) : undefined;
  const commentTargetBlock = commentPanel.blockId ? blocks.find((block) => block.id === commentPanel.blockId) : undefined;
  const canPostComment = commentPanel.draft.trim().length > 0 || commentPanel.attachments.length > 0;
  const blockMenuBlock = blockMenu.blockId ? blocks.find((block) => block.id === blockMenu.blockId) : undefined;
  const blockMenuActions = blockMenuBlock
    ? [
        ...(blockMenuBlock.type === "file" || blockMenuBlock.type === "image" || blockMenuBlock.type === "video" || blockMenuBlock.type === "audio"
          ? [
              {
                id: "file_caption",
                label: "Caption",
                shortcut: "",
                onClick: () => {
                  updateFileCaption(blockMenu.blockId!);
                },
              },
              {
                id: "file_download",
                label: "Download",
                shortcut: "",
                onClick: () => {
                  void downloadFileBlock(blockMenuBlock);
                },
              },
            ]
          : []),
        {
          id: "copy_link",
          label: "Copy link to block",
          shortcut: "Alt+Shift+L",
          onClick: () => {
            void copyBlockLink(blockMenu.blockId!);
          },
        },
        {
          id: "duplicate",
          label: "Duplicate",
          shortcut: "Ctrl+D",
          onClick: () => {
            duplicateBlock(blockMenu.blockId!);
          },
        },
        {
          id: "delete",
          label: "Delete",
          shortcut: "Del",
          danger: true,
          onClick: () => {
            const targets = selectedBlockIds.includes(blockMenu.blockId!) ? selectedBlockIds : [blockMenu.blockId!];
            deleteBlocks(targets);
            setBlockMenu({ open: false, x: 0, y: 0, moveToQuery: "", searchQuery: "" });
          },
        },
      ]
    : [];
  const filteredBlockMenuActions = blockMenu.searchQuery.trim()
    ? blockMenuActions.filter((item) => item.label.toLowerCase().includes(blockMenu.searchQuery.trim().toLowerCase()))
    : blockMenuActions;
  const menuGroups = useMemo(
    () => ({
      basic: filteredMenu.filter((item) => item.group === "basic"),
      media: filteredMenu.filter((item) => item.group === "media"),
    }),
    [filteredMenu],
  );

  const slashMenuLayout = useMemo(() => {
    if (!menu) return { left: 0, top: 0 };
    const cardWidth = Math.min(360, viewport.w - 24);
    const rowCount = Math.max(1, filteredMenu.length);
    const estimatedHeight = clamp(84 + rowCount * 40 + (menuGroups.media.length > 0 && menuGroups.basic.length > 0 ? 24 : 0), 170, 360);
    const rightSpace = viewport.w - menu.anchorX;
    const leftSpace = menu.anchorX;
    const belowSpace = viewport.h - menu.anchorY;
    const aboveSpace = menu.anchorY;

    const horizontal = rightSpace >= cardWidth + 10 || rightSpace >= leftSpace ? menu.anchorX : menu.anchorX - cardWidth;
    const vertical = belowSpace >= estimatedHeight + 10 || belowSpace >= aboveSpace ? menu.anchorY : menu.anchorY - estimatedHeight - 8;

    return {
      left: clamp(horizontal, 8, Math.max(8, viewport.w - cardWidth - 8)),
      top: clamp(vertical, 8, Math.max(8, viewport.h - estimatedHeight - 8)),
    };
  }, [filteredMenu.length, menu, menuGroups.basic.length, menuGroups.media.length, viewport.h, viewport.w]);
  return (
    <main className="route-shell text-[var(--color-text)]">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptForIntent(uploadIntent)}
        className="hidden"
        onChange={(event) => {
          const chosen = Array.from(event.target.files ?? []);
          event.currentTarget.value = "";
          void uploadFilesAt(chosen, uploadAnchorRef.current.x, uploadAnchorRef.current.y, uploadIntent);
        }}
      />
      <input
        ref={commentFileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          const names = Array.from(event.target.files ?? []).map((file) => file.name);
          event.currentTarget.value = "";
          if (!names.length) return;
          setCommentPanel((previous) => ({
            ...previous,
            attachments: Array.from(new Set([...previous.attachments, ...names])).slice(0, 6),
          }));
        }}
      />

      <div
        ref={containerRef}
        className="relative h-screen w-full overflow-hidden bg-[var(--color-surface)]"
        onPointerDown={onCanvasPointerDown}
        onWheel={handleWheel}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(event) => {
          event.preventDefault();
          const files = Array.from(event.dataTransfer.files ?? []);
          const world = worldFromClient(event.clientX, event.clientY);
          void uploadFilesAt(files, world.x, world.y);
        }}
        onContextMenu={(event) => {
          if (event.target !== event.currentTarget) return;
          event.preventDefault();
          const world = worldFromClient(event.clientX, event.clientY);
          setCanvasMenu({ open: true, x: event.clientX, y: event.clientY, worldX: world.x, worldY: world.y });
          setFileMenu({ open: false, x: 0, y: 0 });
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
            transformOrigin: "top left",
          }}
        >
          {blocks.map((block) => {
            const resolvedFileUrl = block.file?.externalUrl || (block.file?.path ? signedUrls[block.file.path] : undefined);
            const indentOffset = block.type === "todo" ? (block.indent ?? 0) * INDENT_STEP : 0;
            const latestComment = block.comments?.length ? block.comments[block.comments.length - 1] : undefined;
            const showInlineFileComment = block.type === "file" && block.file ? !isImageMime(block.file.mimeType) : false;
            return (
              <div
                key={block.id}
                className="group pointer-events-auto absolute rounded-md"
                style={{ left: block.x + indentOffset, top: block.y, width: DOC_WIDTH - indentOffset }}
                onPointerDown={(event) => {
                  if ((event.target as HTMLElement).closest('[data-page-drag-handle="true"]')) return;
                  setSelectedBlockIds([block.id]);
                }}
              >
                <button
                  type="button"
                  aria-label="Open block menu"
                  data-page-drag-handle="true"
                  className={cn(
                    "absolute -left-9 top-0 inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-muted)]/55 opacity-45 transition hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)] hover:opacity-100 focus-visible:opacity-100",
                    selectedBlockIds.includes(block.id) ? "bg-[var(--color-accent-soft)] text-[var(--color-text)] opacity-100" : "",
                  )}
                  onPointerDown={(event) => onHandlePointerDown(block, event)}
                >
                  <span className="grid grid-cols-2 gap-[2px]">
                    <span className="h-[2px] w-[2px] rounded-full bg-current" />
                    <span className="h-[2px] w-[2px] rounded-full bg-current" />
                    <span className="h-[2px] w-[2px] rounded-full bg-current" />
                    <span className="h-[2px] w-[2px] rounded-full bg-current" />
                    <span className="h-[2px] w-[2px] rounded-full bg-current" />
                    <span className="h-[2px] w-[2px] rounded-full bg-current" />
                  </span>
                </button>

                <div
                  style={{
                    color: block.textColor || undefined,
                    backgroundColor: block.backgroundColor || undefined,
                    borderRadius: block.backgroundColor ? 8 : undefined,
                    padding: block.backgroundColor ? "6px 8px" : undefined,
                  }}
                >
                  {(block.type === "file" || block.type === "image" || block.type === "video" || block.type === "audio") && block.file ? (
                    <div
                      className={cn(
                        "relative rounded-md bg-[var(--color-surface)]/85 p-3",
                        showInlineFileComment ? "flex items-start justify-between gap-4 border-none" : "border border-[var(--color-border)]",
                      )}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setFileMenu({ open: true, x: event.clientX, y: event.clientY, blockId: block.id });
                        setCanvasMenu((previous) => ({ ...previous, open: false }));
                      }}
                    >
                      <div className={cn(showInlineFileComment ? "min-w-0 flex-1 pr-1" : "")}>
                        {(block.type === "image" || isImageMime(block.file.mimeType)) ? (
                          resolvedFileUrl ? (
                            <button
                              type="button"
                              className="block overflow-hidden rounded-md"
                              onClick={(event) => {
                                event.stopPropagation();
                                void openFileBlock(block);
                              }}
                            >
                              <Image src={resolvedFileUrl} alt={block.file.displayName} width={960} height={540} unoptimized className="h-auto w-full object-contain" />
                            </button>
                          ) : (
                            <p className="text-sm text-[var(--color-text-muted)]">Loading image preview...</p>
                          )
                        ) : block.type === "video" ? (
                          resolvedFileUrl ? (
                            <video controls preload="metadata" className="w-full rounded-md">
                              <source src={resolvedFileUrl} type={block.file.mimeType} />
                            </video>
                          ) : (
                            <p className="text-sm text-[var(--color-text-muted)]">Loading video preview...</p>
                          )
                        ) : block.type === "audio" ? (
                          resolvedFileUrl ? (
                            <audio controls preload="metadata" className="w-full">
                              <source src={resolvedFileUrl} type={block.file.mimeType} />
                            </audio>
                          ) : (
                            <p className="text-sm text-[var(--color-text-muted)]">Loading audio preview...</p>
                          )
                        ) : (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void openFileBlock(block);
                            }}
                            className="flex items-center gap-1.5 text-left"
                          >
                            <FileDocIcon />
                            <span className="text-[15px] text-[var(--color-text)]">{block.file.displayName}</span>
                            <span className="text-xs text-[var(--color-text-muted)]">{formatFileSize(block.file.size)}</span>
                          </button>
                        )}
                        {!showInlineFileComment && (
                          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                            {block.file.mimeType || "file"} - {formatFileSize(block.file.size)}
                          </p>
                        )}
                        {block.content.trim().length > 0 && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{block.content.trim()}</p>}
                      </div>
                      {showInlineFileComment && latestComment && (
                        <button
                          type="button"
                          className="min-w-[18rem] max-w-[19rem] shrink-0 rounded-xl border border-[#dedede] bg-[#f7f7f7] px-4 py-2 text-left"
                          onClick={(event) => {
                            event.stopPropagation();
                            const anchor = toScreenPoint(block.x + block.w - 40, block.y + block.h + 10);
                            openCommentPanel(block.id, anchor.x, anchor.y);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#e2e2e2] text-[11px] text-[#9a9a9a]">
                              {initialForName(latestComment.authorName || commentAuthorName)}
                            </span>
                            <span className="truncate text-sm font-semibold text-[#2f2f2f]">{latestComment.authorName || commentAuthorName}</span>
                            <span className="text-xs text-[#9f9f9f]">{relativeTimeLabel(latestComment.createdAt)}</span>
                          </div>
                          <p className="mt-1 truncate text-[15px] text-[#2f2f2f]">{latestComment.text || "Attachment"}</p>
                        </button>
                      )}
                    </div>
                  ) : (
                    renderInput(block)
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {menu && menuBlock && (
          <div
            className="absolute z-40 w-[min(22.5rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-[#d8d8d8] bg-[#f9f9f9] p-0 shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
            style={{
              left: slashMenuLayout.left,
              top: slashMenuLayout.top,
            }}
            onPointerDown={(event) => event.stopPropagation()}
            onWheel={(event) => {
              event.stopPropagation();
            }}
          >
            <div className="border-b border-[#e5e5e5] px-3.5 py-2.5 text-xs text-[#888]">Basic blocks</div>
            <div className="max-h-[18rem] overflow-y-auto px-2 py-1.5">
              {filteredMenu.length === 0 && <p className="px-2 py-1.5 text-sm text-[#8c8c8c]">No matching commands.</p>}
              {menuGroups.basic.concat(menuGroups.media).map((item) => {
                const idx = filteredMenu.findIndex((entry) => entry.id === item.id);
                return (
                  <button
                    key={`${item.id}-${item.label}`}
                    type="button"
                    onClick={() => applySlashCommand(item.id)}
                    onMouseEnter={() => setMenuIndex(idx)}
                    className={cn(
                      "mb-0.5 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[15px]",
                      idx === activeMenuIndex ? "bg-[#ececec] text-[#111]" : "text-[#2f2f2f] hover:bg-[#efefef]",
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="inline-flex h-5 min-w-5 items-center justify-center text-[14px] text-[#4f4f4f]">{item.symbol || "•"}</span>
                      <span>{item.label}</span>
                    </span>
                    <span className="text-xs text-[#949494]">{item.trigger || ""}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setMenu(null)}
              className="flex w-full items-center justify-between border-t border-[#e5e5e5] px-3.5 py-2 text-left text-[15px] text-[#2f2f2f] hover:bg-[#efefef]"
            >
              <span>Close menu</span>
              <span className="text-xs text-[#9a9a9a]">esc</span>
            </button>
          </div>
        )}

        {fileInsert.open && (
          <div
            className="absolute z-50 w-[22rem] rounded-xl border border-[#d7d7d7] bg-[#f6f6f6] p-2 shadow-[0_14px_26px_rgba(0,0,0,0.2)]"
            style={{ left: fileInsert.x, top: fileInsert.y }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-1 rounded-lg border border-[#d9d9d9] bg-white p-1">
              {(["upload", "link"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm",
                    fileInsert.mode === tab ? "border border-[#2f80ed] bg-[#e8f1ff] text-[#1b5fc7]" : "text-[#777] hover:bg-[#f0f0f0]",
                  )}
                  onClick={() => setFileInsert((previous) => ({ ...previous, mode: tab }))}
                >
                  {tab === "upload" ? "Upload" : "Link"}
                </button>
              ))}
            </div>
            {fileInsert.mode === "upload" ? (
              <div className="px-2 pb-2 pt-3">
                <button
                  type="button"
                  className="w-full rounded-md bg-[#2f80ed] px-3 py-2 text-sm font-medium text-white hover:bg-[#206fd8]"
                  onClick={() => {
                    triggerUploadPickerAt(fileInsert.worldX, fileInsert.worldY, fileInsert.intent);
                    setFileInsert((previous) => ({ ...previous, open: false }));
                  }}
                >
                  Choose a file
                </button>
              </div>
            ) : (
              <form
                className="space-y-2 px-2 pb-2 pt-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const nextUrl = fileInsert.url.trim();
                  if (!nextUrl) return;
                  try {
                    const parsed = new URL(nextUrl);
                    createEmbedBlock(parsed.toString(), fileInsert.worldX, fileInsert.worldY, fileInsert.intent);
                    setFileInsert((previous) => ({ ...previous, open: false, url: "" }));
                  } catch {
                    window.alert("Please paste a valid URL.");
                  }
                }}
              >
                <input
                  type="url"
                  value={fileInsert.url}
                  onChange={(event) => setFileInsert((previous) => ({ ...previous, url: event.target.value }))}
                  placeholder="Paste file URL"
                  className="w-full rounded-md border border-[#d0d0d0] bg-white px-2.5 py-2 text-sm text-[#303030] outline-none focus:border-[#2f80ed] focus:ring-1 focus:ring-[#2f80ed]/30"
                />
                <button type="submit" className="w-full rounded-md bg-[#2f80ed] px-3 py-2 text-sm font-medium text-white hover:bg-[#206fd8]">
                  Embed link
                </button>
              </form>
            )}
          </div>
        )}

        {commentPanel.open && commentTargetBlock && (
          <div
            className="absolute z-[58] w-[22rem] rounded-xl border border-[#d7d7d7] bg-[#f5f5f5] p-2 shadow-[0_14px_28px_rgba(0,0,0,0.18)]"
            style={{ left: commentPanel.x, top: commentPanel.y }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="max-h-60 space-y-2 overflow-y-auto p-1">
              {(commentTargetBlock.comments ?? []).length === 0 && <p className="px-1 py-2 text-sm text-[#8b8b8b]">No comments yet.</p>}
              {(commentTargetBlock.comments ?? []).map((comment) => (
                <article key={comment.id} className="rounded-[12px] border border-[#d9d9d9] bg-[#f7f7f7] px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#dedede] text-[11px] text-[#9a9a9a]">
                        {initialForName(comment.authorName || commentAuthorName)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#2e2e2e]">{comment.authorName || commentAuthorName}</p>
                      </div>
                      <span className="text-xs text-[#9d9d9d]">{relativeTimeLabel(comment.createdAt)}</span>
                    </div>
                    <button
                      type="button"
                      className="rounded px-1.5 py-0.5 text-[#8b8b8b] hover:bg-[#ececec] hover:text-[#3a3a3a]"
                      onClick={() =>
                        setCommentPanel((previous) => ({
                          ...previous,
                          menuCommentId: previous.menuCommentId === comment.id ? undefined : comment.id,
                          deleteConfirmCommentId: undefined,
                        }))
                      }
                    >
                      ...
                    </button>
                  </div>
                  <p className="mt-1 text-[15px] text-[#2b2b2b]">{comment.text || <span className="text-[#9a9a9a]">Attachment only</span>}</p>
                  {comment.attachments?.length ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {comment.attachments.map((attachment) => (
                        <span key={attachment} className="rounded-md border border-[#d2d2d2] bg-white px-1.5 py-0.5 text-[11px] text-[#636363]">
                          {attachment}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {commentPanel.menuCommentId === comment.id && (
                    <div className="relative">
                      <div className="absolute right-0 top-1 z-[59] min-w-44 rounded-xl border border-[#d2d2d2] bg-[#efefef] p-1.5 shadow-[0_8px_18px_rgba(0,0,0,0.14)]">
                        <button
                          type="button"
                          className="block w-full rounded px-2 py-1.5 text-left text-sm text-[#333] hover:bg-[#dfdfdf]"
                          onClick={() => setCommentPanel((previous) => ({ ...previous, menuCommentId: undefined }))}
                        >
                          Mark as unread
                        </button>
                        <button
                          type="button"
                          className="mt-0.5 block w-full rounded px-2 py-1.5 text-left text-sm text-[#333] hover:bg-[#dfdfdf]"
                          onClick={() =>
                            setCommentPanel((previous) => ({
                              ...previous,
                              draft: comment.text,
                              attachments: comment.attachments ?? [],
                              menuCommentId: undefined,
                              editingCommentId: comment.id,
                            }))
                          }
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="mt-0.5 block w-full rounded px-2 py-1.5 text-left text-sm text-[#333] hover:bg-[#dfdfdf]"
                          onClick={async () => {
                            await copyBlockLink(commentTargetBlock.id);
                            setCommentPanel((previous) => ({ ...previous, menuCommentId: undefined }));
                          }}
                        >
                          Copy link
                        </button>
                        <button
                          type="button"
                          className="mt-0.5 block w-full rounded px-2 py-1.5 text-left text-sm text-[#333] hover:bg-[#dfdfdf]"
                          onClick={() => setCommentPanel((previous) => ({ ...previous, menuCommentId: undefined }))}
                        >
                          Mute replies
                        </button>
                        <button
                          type="button"
                          className="mt-0.5 block w-full rounded px-2 py-1.5 text-left text-sm text-[#cc4f46] hover:bg-[#dfdfdf]"
                          onClick={() => setCommentPanel((previous) => ({ ...previous, menuCommentId: undefined, deleteConfirmCommentId: comment.id }))}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>

            {!!commentPanel.attachments.length && (
              <div className="mt-1 flex flex-wrap gap-1 px-1">
                {commentPanel.attachments.map((attachment) => (
                  <button
                    key={attachment}
                    type="button"
                    className="rounded-md border border-[#d2d2d2] bg-white px-1.5 py-0.5 text-[11px] text-[#666]"
                    onClick={() => setCommentPanel((previous) => ({ ...previous, attachments: previous.attachments.filter((item) => item !== attachment) }))}
                  >
                    {attachment} x
                  </button>
                ))}
              </div>
            )}

            <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#d9d9d9] bg-white px-2 py-1.5">
              <input
                value={commentPanel.draft}
                onChange={(event) => setCommentPanel((previous) => ({ ...previous, draft: event.target.value }))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    postComment();
                  }
                }}
                placeholder="Add a comment..."
                className="h-7 w-full bg-transparent text-sm text-[#333] outline-none placeholder:text-[#a2a2a2]"
              />
              <button
                type="button"
                className="rounded p-1 text-[#7d7d7d] hover:bg-[#f0f0f0] hover:text-[#4a4a4a]"
                onClick={() => commentFileInputRef.current?.click()}
                title="Attach file"
              >
                +
              </button>
              <button
                type="button"
                className="rounded p-1 text-[#7d7d7d] hover:bg-[#f0f0f0] hover:text-[#4a4a4a]"
                onClick={() => setCommentPanel((previous) => ({ ...previous, draft: `${previous.draft}${previous.draft.endsWith(" ") || previous.draft.length === 0 ? "" : " "}@` }))}
                title="Mention"
              >
                @
              </button>
              <button
                type="button"
                className={cn("rounded-full p-1 text-xs", canPostComment ? "bg-[#2f80ed] text-white" : "bg-[#efefef] text-[#a6a6a6]")}
                disabled={!canPostComment}
                onClick={postComment}
                title={commentPanel.editingCommentId ? "Save comment" : "Post comment"}
              >
                ^
              </button>
            </div>
          </div>
        )}

        {commentPanel.open && commentPanel.deleteConfirmCommentId && commentTargetBlock && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 px-4"
            onPointerDown={() => setCommentPanel((previous) => ({ ...previous, deleteConfirmCommentId: undefined }))}
          >
            <div
              className="w-full max-w-[22rem] rounded-2xl border border-[#cecece] bg-[#f0f0f0] p-5 text-center shadow-[0_18px_30px_rgba(0,0,0,0.25)]"
              onPointerDown={(event) => event.stopPropagation()}
            >
              <p className="text-[1.2rem] font-semibold text-[#343434]">Would you like to delete this comment?</p>
              <button
                type="button"
                className="mt-4 w-full rounded-lg bg-[#e06557] px-3 py-2 text-base font-semibold text-white hover:bg-[#d35749]"
                onClick={() => {
                  deleteCommentFromBlock(commentTargetBlock.id, commentPanel.deleteConfirmCommentId!);
                  setCommentPanel((previous) => ({ ...previous, deleteConfirmCommentId: undefined }));
                }}
              >
                Delete
              </button>
              <button
                type="button"
                className="mt-2 w-full rounded-lg border border-[#d4d4d4] bg-[#f3f3f3] px-3 py-2 text-base text-[#333] hover:bg-[#ececec]"
                onClick={() => setCommentPanel((previous) => ({ ...previous, deleteConfirmCommentId: undefined }))}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {canvasMenu.open && (
          <div
            className="fixed z-50 min-w-48 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1.5 shadow-[var(--shadow-lg)]"
            style={{ left: canvasMenu.x, top: canvasMenu.y }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="block w-full rounded px-2.5 py-1.5 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
              onClick={() => {
                triggerUploadPickerAt(canvasMenu.worldX, canvasMenu.worldY);
                setCanvasMenu((previous) => ({ ...previous, open: false }));
              }}
            >
              Upload files here
            </button>
            <button
              type="button"
              className="mt-0.5 block w-full rounded px-2.5 py-1.5 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
              onClick={() => {
                addTextBlockAt(canvasMenu.worldX, canvasMenu.worldY);
                setCanvasMenu((previous) => ({ ...previous, open: false }));
              }}
            >
              New text block
            </button>
          </div>
        )}

        {fileMenu.open && fileMenu.blockId && (
          <div
            className="fixed z-50 min-w-44 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1.5 shadow-[var(--shadow-lg)]"
            style={{ left: fileMenu.x, top: fileMenu.y }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="block w-full rounded px-2.5 py-1.5 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
              onClick={() => {
                const block = blocks.find((entry) => entry.id === fileMenu.blockId);
                if (block) void openFileBlock(block);
                setFileMenu({ open: false, x: 0, y: 0 });
              }}
            >
              Open in new tab
            </button>
            <button
              type="button"
              className="mt-0.5 block w-full rounded px-2.5 py-1.5 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
              onClick={() => {
                updateFileCaption(fileMenu.blockId!);
                setFileMenu({ open: false, x: 0, y: 0 });
              }}
            >
              Add caption
            </button>
            <button
              type="button"
              className="mt-0.5 block w-full rounded px-2.5 py-1.5 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
              onClick={() => {
                const target = blocks.find((entry) => entry.id === fileMenu.blockId!);
                if (target) {
                  const anchor = toScreenPoint(target.x + target.w * 0.35, target.y + target.h + 12);
                  openCommentPanel(target.id, anchor.x, anchor.y);
                }
                setFileMenu({ open: false, x: 0, y: 0 });
              }}
            >
              Comment
            </button>
            <button
              type="button"
              className="mt-0.5 block w-full rounded px-2.5 py-1.5 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
              onClick={() => {
                const block = blocks.find((entry) => entry.id === fileMenu.blockId);
                if (block) void downloadFileBlock(block);
                setFileMenu({ open: false, x: 0, y: 0 });
              }}
            >
              Download original
            </button>
            <button
              type="button"
              className="mt-0.5 block w-full rounded px-2.5 py-1.5 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
              onClick={() => {
                renameFileBlock(fileMenu.blockId!);
                setFileMenu({ open: false, x: 0, y: 0 });
              }}
            >
              Rename title
            </button>
            <button
              type="button"
              className="mt-0.5 block w-full rounded px-2.5 py-1.5 text-left text-sm text-[#f87171] hover:bg-[var(--color-surface-muted)]"
              onClick={() => {
                void deleteFileBlock(fileMenu.blockId!);
                setFileMenu({ open: false, x: 0, y: 0 });
              }}
            >
              Delete file
            </button>
          </div>
        )}

        {blockMenu.open && blockMenu.blockId && blockMenuBlock && (
          <div
            className="fixed z-50 w-[18rem] rounded-2xl border border-[#d7d7d7] bg-[#f7f7f7] p-2 text-[#2e2e2e] shadow-[0_12px_28px_rgba(0,0,0,0.14)]"
            style={{ left: blockMenu.x, top: blockMenu.y }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <input
              value={blockMenu.searchQuery}
              onChange={(event) => setBlockMenu((previous) => ({ ...previous, searchQuery: event.target.value }))}
              className="w-full rounded-lg border border-[#4b95ef] bg-white px-2 py-1.5 text-sm outline-none ring-1 ring-[#4b95ef]/25"
              placeholder="Search actions..."
            />
            <p className="mt-3 px-1 text-xs font-medium text-[#727272]">{blockMenuBlock.type === "todo" ? "To-do list" : blockMenuBlock.type}</p>

            <details className="mt-2">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-1.5 py-1.5 text-[1rem] hover:bg-[#ececec]">
                <span>Turn into</span>
                <span className="text-[#8b8b8b]">{">"}</span>
              </summary>
              <div className="mt-1 grid grid-cols-2 gap-1 pl-1">
                {TURN_INTO_TYPES.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    disabled={blockMenuBlock.type === "file"}
                    className="rounded px-2 py-1 text-left text-xs hover:bg-[#ececec] disabled:cursor-not-allowed disabled:opacity-45"
                    onClick={() => {
                      if (item.type === "quote") {
                        turnSelectionIntoQuote(blockMenu.blockId!);
                      } else {
                        turnBlockInto(blockMenu.blockId!, item.type);
                      }
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </details>

            <details>
              <summary className="mt-0.5 flex cursor-pointer list-none items-center justify-between rounded-md px-1.5 py-1.5 text-[1rem] hover:bg-[#ececec]">
                <span>Color</span>
                <span className="text-[#8b8b8b]">{">"}</span>
              </summary>
              <div className="mt-1 space-y-1 pl-1">
                <div className="grid grid-cols-5 gap-1">
                  {QUOTE_TEXT_COLORS.map((color) => (
                    <button
                      key={`text-color-${color.id}`}
                      type="button"
                      title={`Text: ${color.label}`}
                      className="h-6 rounded-md border border-[#d7d7d7] bg-white text-[11px]"
                      style={{ color: color.value || "#2e2e2e" }}
                      onClick={() => updateBlock(blockMenu.blockId!, { textColor: color.value || undefined })}
                    >
                      T
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {QUOTE_BACKGROUND_COLORS.map((color) => (
                    <button
                      key={`bg-color-${color.id}`}
                      type="button"
                      title={`Background: ${color.label}`}
                      className="h-6 rounded-md border border-[#d7d7d7]"
                      style={{ backgroundColor: color.value || "#ffffff" }}
                      onClick={() => updateBlock(blockMenu.blockId!, { backgroundColor: color.value || undefined })}
                    />
                  ))}
                </div>
              </div>
            </details>

            <div className="my-2 border-t border-[#dfdfdf]" />

            {filteredBlockMenuActions.map((action) => (
              <button
                key={action.id}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-1.5 py-1.5 text-left text-[1rem] hover:bg-[#ececec]",
                  action.danger ? "text-[#b64040]" : "text-[#2e2e2e]",
                )}
                onClick={action.onClick}
              >
                <span>{action.label}</span>
                <span className="text-xs text-[#989898]">{action.shortcut}</span>
              </button>
            ))}

            <button
              type="button"
              disabled={blockMenuBlock.type === "file"}
              className="mt-0.5 flex w-full items-center justify-between rounded-md px-1.5 py-1.5 text-left text-[1rem] text-[#2e2e2e] hover:bg-[#ececec] disabled:opacity-45"
              onClick={() => {
                void turnBlockIntoPage(blockMenu.blockId!);
                setBlockMenu({ open: false, x: 0, y: 0, moveToQuery: "", searchQuery: "" });
              }}
            >
              <span>Turn into page</span>
              <span className="text-xs text-[#989898]">Ctrl+Alt+P</span>
            </button>

            <details>
              <summary className="mt-0.5 flex cursor-pointer list-none items-center justify-between rounded-md px-1.5 py-1.5 text-[1rem] hover:bg-[#ececec]">
                <span>Move to</span>
                <span className="text-xs text-[#989898]">Ctrl+Shift+P</span>
              </summary>
              <div className="space-y-1 px-1 pb-1">
                <input
                  value={blockMenu.moveToQuery}
                  onChange={(event) => setBlockMenu((previous) => ({ ...previous, moveToQuery: event.target.value }))}
                  className="mt-1 w-full rounded border border-[#d7d7d7] bg-white px-2 py-1 text-xs outline-none"
                  placeholder="Search page id"
                />
                <div className="max-h-24 space-y-0.5 overflow-auto">
                  {availableDocIds
                    .filter((id) => id.includes(blockMenu.moveToQuery.trim()))
                    .slice(0, 6)
                    .map((id) => (
                      <button
                        key={id}
                        type="button"
                        className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-[#ececec]"
                        onClick={() => {
                          const targets = selectedBlockIds.includes(blockMenu.blockId!) ? selectedBlockIds : [blockMenu.blockId!];
                          void moveBlocksToDoc(id, targets);
                          setBlockMenu({ open: false, x: 0, y: 0, moveToQuery: "", searchQuery: "" });
                        }}
                      >
                        {id}
                      </button>
                    ))}
                </div>
              </div>
            </details>

            <button
              type="button"
              className="mt-0.5 flex w-full items-center justify-between rounded-md px-1.5 py-1.5 text-left text-[1rem] hover:bg-[#ececec]"
              onClick={() => {
                const target = blocks.find((entry) => entry.id === blockMenu.blockId!);
                if (target) {
                  const anchor = toScreenPoint(target.x + target.w * 0.35, target.y + target.h + 12);
                  openCommentPanel(target.id, anchor.x, anchor.y);
                }
                setBlockMenu({ open: false, x: 0, y: 0, moveToQuery: "", searchQuery: "" });
              }}
            >
              <span>Comment</span>
              <span className="text-xs text-[#989898]">Ctrl+Shift+M</span>
            </button>
            <div className="mt-2 border-t border-[#dfdfdf] pt-2 text-[11px] text-[#8d8d8d]">
              <p>Last edited in this page</p>
            </div>
          </div>
        )}

        {uploading && (
          <div className="pointer-events-none fixed left-1/2 top-5 z-50 -translate-x-1/2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] shadow-[var(--shadow-sm)]">
            Uploading files...
          </div>
        )}
      </div>
    </main>
  );
}
