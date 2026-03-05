"use client";

import Image from "next/image";
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

import { createPageSnapshotSaver, loadPageSnapshot } from "@/features/page/storage";
import type { BlockType, PageBlock } from "@/features/page/types";
import { cn } from "@/lib/cn";

type SlashCommandId = BlockType | "upload_files";
type SlashCommand = { id: SlashCommandId; label: string; description: string; aliases: string[] };
type MenuState = { blockId: string; query: string; slashRange: { start: number; end: number } };
type CanvasMenuState = { open: boolean; x: number; y: number; worldX: number; worldY: number };
type FileMenuState = { open: boolean; x: number; y: number; blockId?: string };
type BlockMenuState = { open: boolean; x: number; y: number; blockId?: string };

const DOC_WIDTH = 680;
const LINE_HEIGHT = 32;
const LIST_ITEM_GAP = 6;
const DEFAULT_BLOCK_GAP = 14;
const INDENT_STEP = 24;
const MAX_TODO_INDENT = 8;
const ATTRIBUTION_PREFIX = "-- ";

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

const slashCommands: SlashCommand[] = [
  { id: "text", label: "Text", description: "Plain paragraph.", aliases: ["text", "paragraph", "p"] },
  { id: "h1", label: "Header 1", description: "Large heading.", aliases: ["h1", "header", "title"] },
  { id: "h2", label: "Header 2", description: "Medium heading.", aliases: ["h2", "header2"] },
  { id: "h3", label: "Header 3", description: "Small heading.", aliases: ["h3", "header3"] },
  { id: "todo", label: "To-do list", description: "Checkbox task.", aliases: ["todo", "task", "checkbox"] },
  { id: "bulleted", label: "Bulleted list", description: "Bullet item.", aliases: ["bullet", "list"] },
  { id: "quote", label: "Quote", description: "Quoted text.", aliases: ["quote", "citation"] },
  { id: "callout", label: "Callout", description: "Highlighted block.", aliases: ["callout", "note"] },
  { id: "code", label: "Code", description: "Code snippet.", aliases: ["code", "snippet"] },
  { id: "upload_files", label: "Upload files", description: "Pick and insert files here.", aliases: ["upload", "file", "files"] },
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
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export function PageEditor() {
  const [blocks, setBlocks] = useState<PageBlock[]>(() => createEmptyPage());
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [viewport, setViewport] = useState({ w: 1200, h: 800 });
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [menuIndex, setMenuIndex] = useState(0);
  const [canvasMenu, setCanvasMenu] = useState<CanvasMenuState>({ open: false, x: 0, y: 0, worldX: 0, worldY: 0 });
  const [fileMenu, setFileMenu] = useState<FileMenuState>({ open: false, x: 0, y: 0 });
  const [blockMenu, setBlockMenu] = useState<BlockMenuState>({ open: false, x: 0, y: 0 });
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputRefs = useRef<Record<string, HTMLElement | null>>({});
  const measuredHeightsRef = useRef<Record<string, number>>({});
  const selectionRangesRef = useRef<Record<string, { start: number; end: number }>>({});
  const pendingFocusIdRef = useRef<string | null>(null);
  const uploadAnchorRef = useRef({ x: 120, y: 120 });
  const dragRef = useRef<{ blockId: string; offsetX: number; offsetY: number } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; cameraX: number; cameraY: number; moved: boolean } | null>(null);
  const hasLoadedRef = useRef(false);
  const saverRef = useRef(createPageSnapshotSaver(260));

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
    async (files: File[], worldX: number, worldY: number) => {
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
          type: "file",
          content: "",
          x: worldX,
          y: worldY + index * 72,
          w: DOC_WIDTH,
          h: isImageMime(file.mimeType) ? 280 : 44,
          file: {
            path: file.path,
            name: file.name,
            displayName: file.name,
            size: file.size,
            mimeType: file.mimeType || "application/octet-stream",
          },
        }));
        setBlocks((previous) => [...previous, ...createdBlocks]);

        for (const file of payload.files) {
          if (isImageMime(file.mimeType)) void signFileUrl(file.path);
        }
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [signFileUrl],
  );

  const triggerUploadPickerAt = useCallback((worldX: number, worldY: number) => {
    uploadAnchorRef.current = { x: worldX, y: worldY };
    fileInputRef.current?.click();
  }, []);
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
    let cancelled = false;
    const saver = saverRef.current;
    void (async () => {
      try {
        const snapshot = await loadPageSnapshot();
        if (cancelled) return;
        hasLoadedRef.current = true;
        setBlocks(snapshot?.blocks?.length ? snapshot.blocks : createEmptyPage());
        if (snapshot?.camera) setCamera(snapshot.camera);
      } catch {
        hasLoadedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
      void saver.flush();
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    saverRef.current.schedule({ blocks, camera, updatedAt: Date.now() });
  }, [blocks, camera]);

  useEffect(() => {
    const imageBlocks = blocks.filter((block) => block.type === "file" && isImageMime(block.file?.mimeType) && block.file?.path);
    for (const block of imageBlocks) {
      const path = block.file!.path;
      if (!signedUrls[path]) void signFileUrl(path);
    }
  }, [blocks, signFileUrl, signedUrls]);

  useEffect(() => {
    const closeMenus = () => {
      setCanvasMenu((previous) => ({ ...previous, open: false }));
      setFileMenu((previous) => ({ ...previous, open: false }));
      setBlockMenu((previous) => ({ ...previous, open: false }));
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

  const updateBlock = useCallback((blockId: string, patch: Partial<PageBlock>) => {
    setBlocks((previous) => previous.map((block) => (block.id === blockId ? { ...block, ...patch } : block)));
  }, []);

  const rememberSelection = useCallback((blockId: string, element: HTMLInputElement | HTMLTextAreaElement) => {
    selectionRangesRef.current[blockId] = {
      start: element.selectionStart ?? 0,
      end: element.selectionEnd ?? 0,
    };
  }, []);

  const addAttributionBelow = useCallback(
    (blockId: string) => {
      setBlocks((previous) => {
        const index = previous.findIndex((entry) => entry.id === blockId);
        if (index < 0) {
          return previous;
        }
        const source = previous[index]!;
        const created = newBlock("text", source.x, source.y + Math.max(source.h + blockGapFor(source.type), LINE_HEIGHT + blockGapFor(source.type)));
        created.content = ATTRIBUTION_PREFIX;
        return [...previous.slice(0, index + 1), created, ...previous.slice(index + 1)];
      });
    },
    [],
  );

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
      setMenu({ blockId, query: slash.query, slashRange: { start: slash.start, end: slash.end } });
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
      if (commandId === "upload_files") {
        updateBlock(block.id, { content: nextContent });
        setMenu(null);
        triggerUploadPickerAt(block.x, block.y + block.h + 12);
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
    [blocks, menu, queueFocus, triggerUploadPickerAt, updateBlock],
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
    (block: PageBlock, event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0 || isTextInputTarget(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      setMenu(null);
      const world = worldFromClient(event.clientX, event.clientY);
      dragRef.current = { blockId: block.id, offsetX: world.x - block.x, offsetY: world.y - block.y };

      const onMove = (moveEvent: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag) return;
        const pointer = worldFromClient(moveEvent.clientX, moveEvent.clientY);
        setBlocks((previous) =>
          previous.map((entry) =>
            entry.id === drag.blockId
              ? {
                  ...entry,
                  x: pointer.x - drag.offsetX,
                  y: pointer.y - drag.offsetY,
                }
              : entry,
          ),
        );
      };

      const onUp = () => {
        dragRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [worldFromClient],
  );

  const onCanvasPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || event.target !== event.currentTarget) return;
      setMenu(null);
      beginPan(event);
    },
    [beginPan],
  );
  const openFileBlock = useCallback(
    async (block: PageBlock) => {
      if (!block.file?.path) return;
      try {
        const existing = signedUrls[block.file.path];
        const url = existing ?? (await signFileUrl(block.file.path));
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Unable to open file.");
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
      if (!block?.file?.path) return;
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
  const blockMenuBlock = blockMenu.blockId ? blocks.find((block) => block.id === blockMenu.blockId) : undefined;
  const menuAnchor = menuBlock ? toScreenPoint(menuBlock.x, menuBlock.y + menuBlock.h + 8) : { x: 0, y: 0 };
  return (
    <main className="route-shell text-[var(--color-text)]">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          const chosen = Array.from(event.target.files ?? []);
          event.currentTarget.value = "";
          void uploadFilesAt(chosen, uploadAnchorRef.current.x, uploadAnchorRef.current.y);
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
            const imageUrl = block.file?.path ? signedUrls[block.file.path] : undefined;
            const indentOffset = block.type === "todo" ? (block.indent ?? 0) * INDENT_STEP : 0;
            return (
              <div key={block.id} className="group pointer-events-auto absolute" style={{ left: block.x + indentOffset, top: block.y, width: DOC_WIDTH - indentOffset }}>
                <button
                  type="button"
                  aria-label="Open block menu"
                  data-page-drag-handle="true"
                  className="absolute -left-9 top-0 inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-muted)]/55 opacity-45 transition hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)] hover:opacity-100 focus-visible:opacity-100"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (block.type === "file") {
                      return;
                    }
                    setBlockMenu({ open: true, x: event.clientX, y: event.clientY, blockId: block.id });
                    setCanvasMenu((previous) => ({ ...previous, open: false }));
                    setFileMenu((previous) => ({ ...previous, open: false }));
                  }}
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

                <div onPointerDown={(event) => beginDragBlock(block, event)}>
                  {block.type === "file" && block.file ? (
                    <div
                      onContextMenu={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setFileMenu({ open: true, x: event.clientX, y: event.clientY, blockId: block.id });
                        setCanvasMenu((previous) => ({ ...previous, open: false }));
                      }}
                    >
                      {isImageMime(block.file.mimeType) ? (
                        imageUrl ? (
                          <button
                            type="button"
                            className="block overflow-hidden rounded-md"
                            onClick={(event) => {
                              event.stopPropagation();
                              void openFileBlock(block);
                            }}
                          >
                            <Image src={imageUrl} alt={block.file.displayName} width={960} height={540} unoptimized className="h-auto w-full object-contain" />
                          </button>
                        ) : (
                          <p className="text-sm text-[var(--color-text-muted)]">Loading image preview...</p>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void openFileBlock(block);
                          }}
                          className="text-left text-[15px] text-[var(--color-text)] underline decoration-[var(--color-border)] underline-offset-4"
                        >
                          {block.file.displayName}
                        </button>
                      )}
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        {block.file.mimeType || "file"} - {formatFileSize(block.file.size)}
                      </p>
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
            className="absolute z-40 w-[min(34rem,calc(100vw-2rem))] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-2 shadow-[var(--shadow-lg)] backdrop-blur-[var(--blur-panel)]"
            style={{
              left: clamp(menuAnchor.x, 8, Math.max(8, viewport.w - 548)),
              top: clamp(menuAnchor.y, 8, Math.max(8, viewport.h - 260)),
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <p className="mb-2 px-1 text-xs text-[var(--color-text-muted)]">
              Search: <span className="font-semibold text-[var(--color-text)]">/{menu.query || "..."}</span>
            </p>
            {filteredMenu.length === 0 && <p className="px-2 py-1.5 text-sm text-[var(--color-text-muted)]">No matching commands.</p>}
            {filteredMenu.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => applySlashCommand(item.id)}
                onMouseEnter={() => setMenuIndex(idx)}
                className={cn(
                  "mb-0.5 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm last:mb-0",
                  idx === activeMenuIndex ? "bg-[var(--color-accent-soft)] text-[var(--color-text)]" : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                )}
              >
                <span>{item.label}</span>
                <span className="text-[11px]">{item.description}</span>
              </button>
            ))}
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

        {blockMenu.open && blockMenu.blockId && blockMenuBlock && blockMenuBlock.type !== "file" && (
          <div
            className="fixed z-50 min-w-64 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-2 shadow-[var(--shadow-lg)]"
            style={{ left: blockMenu.x, top: blockMenu.y }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <p className="px-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Turn into</p>
            <button
              type="button"
              className="mt-1 block w-full rounded px-2.5 py-1.5 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
              onClick={() => {
                turnSelectionIntoQuote(blockMenu.blockId!);
                setBlockMenu({ open: false, x: 0, y: 0 });
              }}
            >
              Quote
            </button>
            <button
              type="button"
              className="mt-0.5 block w-full rounded px-2.5 py-1.5 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
              onClick={() => {
                addAttributionBelow(blockMenu.blockId!);
                setBlockMenu({ open: false, x: 0, y: 0 });
              }}
            >
              Add attribution below
            </button>
            <p className="mt-2 px-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Color</p>
            <div className="mt-1 grid grid-cols-5 gap-1">
              {QUOTE_TEXT_COLORS.map((color) => (
                <button
                  key={`text-color-${color.id}`}
                  type="button"
                  title={`Text: ${color.label}`}
                  className="h-7 rounded border border-[var(--color-border)]"
                  style={{ backgroundColor: color.value || "transparent", color: color.value || "var(--color-text)" }}
                  onClick={() => {
                    updateBlock(blockMenu.blockId!, { textColor: color.value || undefined });
                  }}
                >
                  T
                </button>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-5 gap-1">
              {QUOTE_BACKGROUND_COLORS.map((color) => (
                <button
                  key={`bg-color-${color.id}`}
                  type="button"
                  title={`Background: ${color.label}`}
                  className="h-7 rounded border border-[var(--color-border)]"
                  style={{ backgroundColor: color.value || "transparent" }}
                  onClick={() => {
                    updateBlock(blockMenu.blockId!, { backgroundColor: color.value || undefined });
                  }}
                />
              ))}
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
