"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";

import { createPageSnapshotSaver, loadPageSnapshot } from "@/features/page/storage";
import type { BlockCategory, BlockType, PageBlock } from "@/features/page/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type BlockMenuItem = {
  type: BlockType;
  label: string;
  category: BlockCategory;
  description: string;
  aliases: string[];
};

type MenuState = {
  source: "plus" | "slash";
  blockId: string;
  query: string;
  slashRange?: { start: number; end: number };
};

const blockMenu: BlockMenuItem[] = [
  { type: "text", label: "Text", category: "Basic", description: "Start writing with plain text.", aliases: ["paragraph", "p"] },
  { type: "h1", label: "Header 1", category: "Basic", description: "Large section heading.", aliases: ["title", "heading", "h1"] },
  { type: "h2", label: "Header 2", category: "Basic", description: "Medium section heading.", aliases: ["heading2", "h2"] },
  { type: "h3", label: "Header 3", category: "Basic", description: "Small section heading.", aliases: ["heading3", "h3"] },
  { type: "todo", label: "To-do list", category: "Basic", description: "Checklist item with checkbox.", aliases: ["todo", "task", "checkbox"] },
  { type: "bulleted", label: "Bulleted list", category: "Basic", description: "A bulleted list item.", aliases: ["bullet", "list", "ul"] },
  { type: "toggle", label: "Toggle list", category: "Basic", description: "Collapsible summary block.", aliases: ["toggle", "collapse", "details"] },
  { type: "code", label: "Code", category: "Advanced", description: "Code snippet block.", aliases: ["code", "snippet"] },
  { type: "quote", label: "Quote", category: "Basic", description: "Block quote for cited text.", aliases: ["quote", "citation"] },
  { type: "callout", label: "Callout", category: "Basic", description: "Highlighted note or warning.", aliases: ["callout", "note", "tip"] },
  { type: "image", label: "Image", category: "Media", description: "Embed an image URL.", aliases: ["image", "img", "photo"] },
  { type: "video", label: "Video", category: "Media", description: "Embed a video URL.", aliases: ["video", "youtube", "vimeo"] },
  { type: "audio", label: "Audio", category: "Media", description: "Embed an audio URL.", aliases: ["audio", "sound", "podcast"] },
  { type: "google_doc", label: "Google Docs", category: "Media", description: "Link or embed a Google Doc.", aliases: ["google", "docs", "gdoc"] },
  { type: "pdf", label: "PDF", category: "Media", description: "Attach or embed a PDF.", aliases: ["pdf", "document"] },
  { type: "database", label: "Database", category: "Database", description: "Table-like record collection.", aliases: ["database", "table", "db"] },
  { type: "markdown", label: "MD file", category: "Advanced", description: "Markdown text block.", aliases: ["markdown", "md", "readme"] },
  { type: "page", label: "Page", category: "Advanced", description: "Create a linked sub-page.", aliases: ["page", "subpage", "child"] },
];

const categoryOrder: BlockCategory[] = ["Basic", "Media", "Database", "Advanced"];

const idFor = () => `blk_${Math.random().toString(36).slice(2, 10)}`;
const createEmptyPage = (): PageBlock[] => [{ id: idFor(), type: "text", content: "" }];

const newBlock = (type: BlockType): PageBlock => {
  if (type === "todo") {
    return { id: idFor(), type, content: "", checked: false };
  }
  if (type === "toggle") {
    return { id: idFor(), type, content: "", expanded: false };
  }
  return { id: idFor(), type, content: "" };
};

const parseSlashQuery = (value: string, cursor: number) => {
  const beforeCursor = value.slice(0, cursor);
  const match = beforeCursor.match(/(^|\s)\/([^\s/]*)$/);
  if (!match || match.index === undefined) {
    return null;
  }
  const fullMatch = match[0];
  const slashStart = match.index + fullMatch.lastIndexOf("/");
  return {
    query: match[2] ?? "",
    start: slashStart,
    end: cursor,
  };
};

export function PageEditor() {
  const [blocks, setBlocks] = useState<PageBlock[]>(() => createEmptyPage());
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [menuIndex, setMenuIndex] = useState(0);
  const inputRefs = useRef<Record<string, HTMLElement | null>>({});
  const pendingFocusIdRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);
  const saverRef = useRef(createPageSnapshotSaver(280));

  const filteredMenu = useMemo(() => {
    const query = menu?.query.trim().toLowerCase() ?? "";
    if (!query) {
      return blockMenu;
    }
    return blockMenu.filter((item) => {
      if (item.label.toLowerCase().includes(query)) {
        return true;
      }
      if (item.description.toLowerCase().includes(query)) {
        return true;
      }
      return item.aliases.some((alias) => alias.toLowerCase().includes(query));
    });
  }, [menu?.query]);

  const groupedForPlus = useMemo(() => {
    const groups = new Map<BlockCategory, BlockMenuItem[]>();
    for (const category of categoryOrder) {
      groups.set(category, []);
    }
    for (const item of filteredMenu) {
      groups.get(item.category)?.push(item);
    }
    return groups;
  }, [filteredMenu]);

  const activeMenuIndex = filteredMenu.length > 0 ? Math.min(menuIndex, filteredMenu.length - 1) : 0;

  const queueFocus = useCallback((blockId: string) => {
    pendingFocusIdRef.current = blockId;
    requestAnimationFrame(() => {
      const pendingId = pendingFocusIdRef.current;
      if (!pendingId) {
        return;
      }
      const el = inputRefs.current[pendingId];
      if (el && typeof (el as HTMLInputElement | HTMLTextAreaElement).focus === "function") {
        (el as HTMLInputElement | HTMLTextAreaElement).focus();
        pendingFocusIdRef.current = null;
      }
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const saver = saverRef.current;
    void (async () => {
      try {
        const snapshot = await loadPageSnapshot();
        if (cancelled) {
          return;
        }
        hasLoadedRef.current = true;
        if (snapshot?.blocks?.length) {
          setBlocks(snapshot.blocks);
        }
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
    if (!hasLoadedRef.current) {
      return;
    }
    saverRef.current.schedule({ blocks, updatedAt: Date.now() });
  }, [blocks]);

  const updateBlock = (blockId: string, patch: Partial<PageBlock>) => {
    setBlocks((prev) => prev.map((block) => (block.id === blockId ? { ...block, ...patch } : block)));
  };

  const openPlusMenu = (blockId: string) => {
    setMenu({ source: "plus", blockId, query: "" });
    setMenuIndex(0);
  };

  const closeMenu = () => setMenu(null);

  const handleTextualChange = (blockId: string, event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    updateBlock(blockId, { content: value });
    if (!menu || menu.blockId !== blockId || menu.source !== "slash") {
      const cursor = event.target.selectionStart ?? value.length;
      const slash = parseSlashQuery(value, cursor);
      if (slash) {
        setMenu({ source: "slash", blockId, query: slash.query, slashRange: { start: slash.start, end: slash.end } });
        setMenuIndex(0);
      }
      return;
    }
    const cursor = event.target.selectionStart ?? value.length;
    const slash = parseSlashQuery(value, cursor);
    if (!slash) {
      setMenu(null);
      return;
    }
    setMenu((prev) => {
      if (!prev || prev.blockId !== blockId || prev.source !== "slash") {
        return prev;
      }
      return {
        ...prev,
        query: slash.query,
        slashRange: { start: slash.start, end: slash.end },
      };
    });
  };

  const insertBlockAfter = useCallback((targetBlockId: string, type: BlockType) => {
    const created = newBlock(type);
    setBlocks((prev) => {
      const idx = prev.findIndex((block) => block.id === targetBlockId);
      if (idx < 0) {
        return [...prev, created];
      }
      return [...prev.slice(0, idx + 1), created, ...prev.slice(idx + 1)];
    });
    queueFocus(created.id);
  }, [queueFocus]);

  const insertFromMenu = useCallback((type: BlockType) => {
    if (!menu) {
      return;
    }
    if (menu.source === "slash") {
      setBlocks((prev) => {
        const idx = prev.findIndex((block) => block.id === menu.blockId);
        const created = newBlock(type);
        if (idx < 0) {
          return [...prev, created];
        }
        const block = prev[idx]!;
        const range = menu.slashRange;
        const nextText = range ? `${block.content.slice(0, range.start)}${block.content.slice(range.end)}` : block.content;
        const updatedBlock: PageBlock = { ...block, content: nextText };
        const nextBlocks = [...prev.slice(0, idx), updatedBlock, created, ...prev.slice(idx + 1)];
        queueFocus(created.id);
        return nextBlocks;
      });
      setMenu(null);
      return;
    }
    insertBlockAfter(menu.blockId, type);
    setMenu(null);
  }, [insertBlockAfter, menu, queueFocus]);

  useEffect(() => {
    if (!menu) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenu(null);
        return;
      }
      if (!filteredMenu.length) {
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setMenuIndex((prev) => (prev + 1) % filteredMenu.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setMenuIndex((prev) => (prev - 1 + filteredMenu.length) % filteredMenu.length);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const picked = filteredMenu[activeMenuIndex];
        if (picked) {
          insertFromMenu(picked.type);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeMenuIndex, filteredMenu, insertFromMenu, menu]);

  const onBlockKeyDown = (block: PageBlock, event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !menu && ["h1", "h2", "h3", "todo", "bulleted", "toggle", "quote", "callout"].includes(block.type)) {
      event.preventDefault();
      insertBlockAfter(block.id, "text");
    }
    if (event.key === "Backspace" && block.content.length === 0 && blocks.length > 1) {
      const idx = blocks.findIndex((item) => item.id === block.id);
      if (idx > -1) {
        event.preventDefault();
        const previous = blocks[idx - 1];
        setBlocks((prev) => prev.filter((item) => item.id !== block.id));
        if (previous) {
          queueFocus(previous.id);
        }
      }
    }
  };

  const renderInput = (block: PageBlock) => {
    const refSetter = (node: HTMLElement | null) => {
      inputRefs.current[block.id] = node;
    };
    if (block.type === "h1") {
      return (
        <input
          ref={refSetter as never}
          value={block.content}
          onChange={(event) => handleTextualChange(block.id, event)}
          onKeyDown={(event) => onBlockKeyDown(block, event)}
          placeholder="Heading 1"
          className="w-full bg-transparent text-4xl leading-tight font-black tracking-tight text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/70"
        />
      );
    }
    if (block.type === "h2") {
      return (
        <input
          ref={refSetter as never}
          value={block.content}
          onChange={(event) => handleTextualChange(block.id, event)}
          onKeyDown={(event) => onBlockKeyDown(block, event)}
          placeholder="Heading 2"
          className="w-full bg-transparent text-3xl leading-tight font-bold text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/70"
        />
      );
    }
    if (block.type === "h3") {
      return (
        <input
          ref={refSetter as never}
          value={block.content}
          onChange={(event) => handleTextualChange(block.id, event)}
          onKeyDown={(event) => onBlockKeyDown(block, event)}
          placeholder="Heading 3"
          className="w-full bg-transparent text-2xl leading-tight font-semibold text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/70"
        />
      );
    }
    if (block.type === "todo") {
      return (
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={Boolean(block.checked)}
            onChange={(event) => updateBlock(block.id, { checked: event.target.checked })}
            className="mt-1.5 h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-surface)]"
          />
          <input
            ref={refSetter as never}
            value={block.content}
            onChange={(event) => handleTextualChange(block.id, event)}
            onKeyDown={(event) => onBlockKeyDown(block, event)}
            placeholder="To-do"
            className={cn(
              "w-full bg-transparent text-base text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/70",
              block.checked ? "text-[var(--color-text-muted)] line-through" : "",
            )}
          />
        </div>
      );
    }
    if (block.type === "bulleted") {
      return (
        <div className="flex items-start gap-2">
          <span className="mt-2 text-[var(--color-text-muted)]">•</span>
          <input
            ref={refSetter as never}
            value={block.content}
            onChange={(event) => handleTextualChange(block.id, event)}
            onKeyDown={(event) => onBlockKeyDown(block, event)}
            placeholder="List item"
            className="w-full bg-transparent text-base text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/70"
          />
        </div>
      );
    }
    if (block.type === "toggle") {
      return (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-2.5">
          <button
            type="button"
            className="mb-1 text-xs font-semibold text-[var(--color-text-muted)]"
            onClick={() => updateBlock(block.id, { expanded: !block.expanded })}
          >
            {block.expanded ? "▾ Hide details" : "▸ Show details"}
          </button>
          <input
            ref={refSetter as never}
            value={block.content}
            onChange={(event) => handleTextualChange(block.id, event)}
            onKeyDown={(event) => onBlockKeyDown(block, event)}
            placeholder="Toggle summary"
            className="w-full bg-transparent text-base text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/70"
          />
          {block.expanded && <p className="mt-2 rounded border border-dashed border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-text-muted)]">Detailed content area.</p>}
        </div>
      );
    }
    if (block.type === "code") {
      return (
        <textarea
          ref={refSetter as never}
          value={block.content}
          onChange={(event) => handleTextualChange(block.id, event)}
          onKeyDown={(event) => onBlockKeyDown(block, event)}
          placeholder="Code block"
          rows={4}
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[#10151d] p-3 font-mono text-sm text-[#d0e2ff] outline-none placeholder:text-[#8ea6ca]"
        />
      );
    }
    if (block.type === "quote") {
      return (
        <textarea
          ref={refSetter as never}
          value={block.content}
          onChange={(event) => handleTextualChange(block.id, event)}
          onKeyDown={(event) => onBlockKeyDown(block, event)}
          placeholder="Quote"
          rows={3}
          className="w-full border-l-4 border-[var(--color-accent)] bg-transparent pl-3 text-base italic text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/70"
        />
      );
    }
    if (block.type === "callout") {
      return (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-accent-soft)]/45 p-3">
          <textarea
            ref={refSetter as never}
            value={block.content}
            onChange={(event) => handleTextualChange(block.id, event)}
            onKeyDown={(event) => onBlockKeyDown(block, event)}
            placeholder="Callout"
            rows={3}
            className="w-full resize-y bg-transparent text-base text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/70"
          />
        </div>
      );
    }
    if (block.type === "database") {
      return (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
          <p className="text-xs font-semibold tracking-[0.12em] text-[var(--color-text-muted)] uppercase">Database</p>
          <input
            ref={refSetter as never}
            value={block.content}
            onChange={(event) => handleTextualChange(block.id, event)}
            onKeyDown={(event) => onBlockKeyDown(block, event)}
            placeholder="Database name"
            className="mt-2 w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/70"
          />
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">Table and views will appear here in a later iteration.</p>
        </div>
      );
    }
    if (["image", "video", "audio", "google_doc", "pdf", "markdown", "page"].includes(block.type)) {
      return (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-2.5">
          <p className="text-[11px] font-semibold tracking-[0.1em] text-[var(--color-text-muted)] uppercase">
            {blockMenu.find((item) => item.type === block.type)?.label}
          </p>
          <input
            ref={refSetter as never}
            value={block.content}
            onChange={(event) => handleTextualChange(block.id, event)}
            onKeyDown={(event) => onBlockKeyDown(block, event)}
            placeholder="Paste URL or title"
            className="mt-2 w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/70"
          />
        </div>
      );
    }
    return (
      <textarea
        ref={refSetter as never}
        value={block.content}
        onChange={(event) => handleTextualChange(block.id, event)}
        onKeyDown={(event) => onBlockKeyDown(block, event)}
        placeholder="Type '/' for commands"
        rows={2}
        className="w-full resize-y bg-transparent text-base leading-7 text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/70"
      />
    );
  };

  const slashHintVisible = Boolean(menu?.source === "slash");
  const lastBlockId = blocks.length > 0 ? blocks[blocks.length - 1]!.id : null;

  return (
    <main className="route-shell text-[var(--color-text)]">
      <section className="min-h-screen w-full lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-[var(--color-border)] bg-[var(--color-surface-glass)]/95 px-4 py-5 backdrop-blur-[var(--blur-panel)] lg:block">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">Idea-Wall Pages</p>
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-muted)]"
              onClick={() => lastBlockId && insertBlockAfter(lastBlockId, "text")}
              aria-label="Add block"
            >
              +
            </button>
          </div>

          <div className="mt-5 space-y-1">
            <p className="px-2 text-[11px] font-semibold tracking-[0.12em] text-[var(--color-text-muted)] uppercase">Workspace</p>
            {["Company Home", "Roadmap", "Docs", "Meeting Notes"].map((entry) => (
              <button
                key={entry}
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition",
                  entry === "Company Home" ? "bg-[var(--color-surface)] font-semibold text-[var(--color-text)] shadow-[var(--shadow-sm)]" : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]",
                )}
              >
                <span className="text-xs">{entry === "Company Home" ? "🏠" : "•"}</span>
                <span>{entry}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-1">
            <p className="px-2 text-[11px] font-semibold tracking-[0.12em] text-[var(--color-text-muted)] uppercase">Private</p>
            {["Task List", "Weekly Agenda", "Reading List"].map((entry) => (
              <button key={entry} type="button" className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface)]">
                <span className="text-xs">•</span>
                <span>{entry}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-2">
            <Button size="sm" variant="secondary" className="w-full justify-start" onClick={() => lastBlockId && insertBlockAfter(lastBlockId, "text")}>
              + New block
            </Button>
            <Link href="/wall" className="inline-flex w-full items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)]">
              Back to Wall
            </Link>
          </div>
        </aside>

        <div className="px-5 pb-20 pt-6 sm:px-8">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--color-text-muted)] uppercase">Page Canvas</p>
              <h1 className="text-3xl leading-tight font-black tracking-tight">Company Home</h1>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">Type `/` for blocks or hover left edge for `+`.</p>
            </div>
            <div className="flex items-center gap-2 lg:hidden">
              <Link href="/wall" className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)]">
                Back to Wall
              </Link>
              <Button size="sm" variant="primary" onClick={() => lastBlockId && insertBlockAfter(lastBlockId, "text")}>
                New Block
              </Button>
            </div>
          </header>

          <article className="relative mt-8">
          <div className="mb-3 flex items-center justify-end">
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-glass)] px-3 py-1 text-[11px] text-[var(--color-text-muted)] shadow-[var(--shadow-sm)] backdrop-blur-[var(--blur-panel)]">
              {blocks.length} block{blocks.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-1">
            {blocks.map((block) => (
              <div key={block.id} className="group relative">
                <button
                  type="button"
                  className="absolute left-0 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-muted)] opacity-0 shadow-[var(--shadow-sm)] transition hover:bg-[var(--color-surface-muted)] group-hover:opacity-100 group-focus-within:opacity-100"
                  onClick={() => openPlusMenu(block.id)}
                  aria-label={`Add block after ${block.type}`}
                >
                  +
                </button>

                <div className="pl-8 pr-1 py-1.5">{renderInput(block)}</div>

                {menu?.blockId === block.id && (
                  <div className="absolute left-8 top-[calc(100%+0.2rem)] z-40 w-[min(38rem,calc(100vw-4rem))] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-2 shadow-[var(--shadow-lg)] backdrop-blur-[var(--blur-panel)]">
                    {menu.source === "plus" && (
                      <input
                        value={menu.query}
                        onChange={(event) => {
                          setMenu((prev) => (prev ? { ...prev, query: event.target.value } : prev));
                          setMenuIndex(0);
                        }}
                        autoFocus
                        placeholder="Search block types..."
                        className="mb-2 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/70 focus:border-[var(--color-focus)]"
                      />
                    )}
                    {menu.source === "slash" && (
                      <p className="mb-2 px-1 text-xs text-[var(--color-text-muted)]">
                        Search: <span className="font-semibold text-[var(--color-text)]">/{menu.query || "..."}</span>
                      </p>
                    )}

                    {filteredMenu.length === 0 && <p className="px-2 py-1.5 text-sm text-[var(--color-text-muted)]">No matching blocks.</p>}

                    {menu.source === "slash" &&
                      filteredMenu.map((item, idx) => (
                        <button
                          key={`${block.id}-slash-${item.type}`}
                          type="button"
                          onClick={() => insertFromMenu(item.type)}
                          onMouseEnter={() => setMenuIndex(idx)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm",
                            idx === activeMenuIndex ? "bg-[var(--color-accent-soft)] text-[var(--color-text)]" : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                          )}
                        >
                          <span>{item.label}</span>
                          <span className="text-[10px] uppercase tracking-[0.1em]">{item.category}</span>
                        </button>
                      ))}

                    {menu.source === "plus" &&
                      categoryOrder.map((category) => {
                        const items = groupedForPlus.get(category) ?? [];
                        if (items.length === 0) {
                          return null;
                        }
                        return (
                          <div key={`${block.id}-${category}`} className="mb-2 last:mb-0">
                            <p className="px-2 pb-1 text-[10px] font-semibold tracking-[0.12em] text-[var(--color-text-muted)] uppercase">{category}</p>
                            {items.map((item) => {
                              const idx = filteredMenu.findIndex((candidate) => candidate.type === item.type);
                              return (
                                <button
                                  key={`${block.id}-${item.type}`}
                                  type="button"
                                  onClick={() => insertFromMenu(item.type)}
                                  onMouseEnter={() => setMenuIndex(Math.max(0, idx))}
                                  className={cn(
                                    "mb-0.5 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm last:mb-0",
                                    idx === activeMenuIndex ? "bg-[var(--color-accent-soft)] text-[var(--color-text)]" : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                                  )}
                                >
                                  <span>{item.label}</span>
                                  <span className="text-[10px]">{item.description}</span>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}

                    <div className="mt-1 flex items-center justify-between border-t border-[var(--color-border)] pt-2">
                      <p className="text-[11px] text-[var(--color-text-muted)]">Enter to insert, Esc to close</p>
                      <button type="button" onClick={closeMenu} className="text-[11px] text-[var(--color-text-muted)] underline">
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {slashHintVisible && (
            <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
              Slash menu is active. Keep typing to filter block types, then press Enter.
            </div>
          )}
        </article>
        </div>
      </section>
    </main>
  );
}
