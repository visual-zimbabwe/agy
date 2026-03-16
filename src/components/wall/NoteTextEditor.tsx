"use client";

import { useEffect, useMemo, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";

import { NoteSlashCommandMenu } from "@/components/wall/NoteSlashCommandMenu";
import { NoteTextFormattingToolbar } from "@/components/wall/NoteTextFormattingToolbar";
import { NoteWikiLinkMenu, type NoteWikiLinkOption } from "@/components/wall/NoteWikiLinkMenu";
import {
  applyListPrefix,
  applyToolbarAction,
  clamp,
  getCaretRect,
  getInlineListContext,
  insertAtSelection,
  insertMarkdownLink,
  parseSlashQuery,
  replaceRange,
  type TextSelectionUpdate,
} from "@/components/wall/noteEditorFormatting";
import { formatJournalDateLabel, getNoteTextFontFamily, getNoteTextStyle } from "@/components/wall/wall-canvas-helpers";
import { JOURNAL_NOTE_DEFAULTS, NOTE_DEFAULTS } from "@/features/wall/constants";
import { getActiveWikiLinkQuery, replaceWikiLinkQuery } from "@/features/wall/wiki-links";
import type { Note } from "@/features/wall/types";

type NoteTextEditorProps = {
  editing: { id: string; text: string };
  editingNote: Note;
  camera: { x: number; y: number; zoom: number };
  toScreenPoint: (worldX: number, worldY: number, camera: { x: number; y: number; zoom: number }) => { x: number; y: number };
  handleEditorBlur: (event: FocusEvent<HTMLTextAreaElement>) => void;
  setEditing: (value: { id: string; text: string } | null) => void;
  updateNote: (noteId: string, patch: Partial<Note>) => void;
  openImageInsert: (noteId: string) => void;
  wikiLinkOptions: Array<{ noteId: string; title: string }>;
};

type SlashCommand = {
  id:
    | "text"
    | "h1"
    | "h2"
    | "h3"
    | "quote"
    | "journal"
    | "bulleted"
    | "numbered"
    | "toggle"
    | "todo"
    | "table"
    | "file"
    | "image"
    | "video"
    | "audio"
    | "bookmark"
    | "embed"
    | "divider"
    | "callout"
    | "code";
  label: string;
  description: string;
  glyph: string;
  keywords: string[];
};

type FloatingMenuState = {
  left: number;
  top: number;
  start: number;
  end: number;
  query: string;
};

const slashCommands: SlashCommand[] = [
  { id: "text", label: "Text", description: "Reset this note to standard text.", glyph: "T", keywords: ["paragraph", "plain", "standard"] },
  { id: "h1", label: "Heading 1", description: "Large title styling for the note.", glyph: "H1", keywords: ["heading", "title", "headline"] },
  { id: "h2", label: "Heading 2", description: "Medium heading styling.", glyph: "H2", keywords: ["heading", "subhead", "section"] },
  { id: "h3", label: "Heading 3", description: "Smaller heading styling.", glyph: "H3", keywords: ["heading", "subheading"] },
  { id: "quote", label: "Quote", description: "Turn the note into a quote card.", glyph: '""', keywords: ["citation", "author"] },
  { id: "journal", label: "Journal", description: "Switch to the journal note treatment.", glyph: "JR", keywords: ["diary", "entry"] },
  { id: "bulleted", label: "Bulleted list", description: "Start a bulleted list on this line.", glyph: "--", keywords: ["bullet", "list", "items"] },
  { id: "numbered", label: "Numbered list", description: "Start a numbered list on this line.", glyph: "1.", keywords: ["ordered", "numbered", "list"] },
  { id: "toggle", label: "Toggle list", description: "Insert a toggle-style text marker.", glyph: ">", keywords: ["collapse", "collapsible", "toggle"] },
  { id: "todo", label: "Todo", description: "Insert a checkbox-style task.", glyph: "[]", keywords: ["task", "checkbox"] },
  { id: "table", label: "Table", description: "Insert a markdown table scaffold.", glyph: "TB", keywords: ["grid", "columns", "rows"] },
  { id: "file", label: "File", description: "Insert a file link placeholder.", glyph: "F", keywords: ["upload", "attachment", "document"] },
  { id: "image", label: "Image", description: "Upload, drop, or paste an image into the note.", glyph: "IM", keywords: ["photo", "media", "upload"] },
  { id: "video", label: "Video", description: "Insert a video link placeholder.", glyph: "V", keywords: ["movie", "media", "clip"] },
  { id: "audio", label: "Audio", description: "Insert an audio link placeholder.", glyph: "A", keywords: ["sound", "voice", "media"] },
  { id: "bookmark", label: "Web bookmark", description: "Insert a saved-link placeholder.", glyph: "BK", keywords: ["web", "link", "url"] },
  { id: "embed", label: "Embed", description: "Insert an embed URL placeholder.", glyph: "EM", keywords: ["iframe", "youtube", "vimeo"] },
  { id: "divider", label: "Divider", description: "Insert a subtle text divider.", glyph: "//", keywords: ["rule", "separator"] },
  { id: "callout", label: "Callout", description: "Highlight the note with a callout prompt.", glyph: "!", keywords: ["highlight", "notice", "important"] },
  { id: "code", label: "Code", description: "Insert a fenced code block.", glyph: "</>", keywords: ["snippet", "pre", "monospace"] },
];

const journalEditorBackground = {
  backgroundColor: "#FFFFFF",
  backgroundImage: [
    "linear-gradient(to right, transparent 0, transparent 42px, rgb(232 119 119 / 0.34) 42px, rgb(232 119 119 / 0.34) 43px, transparent 43px)",
    "repeating-linear-gradient(to bottom, transparent, transparent 30px, #e9e9e9 31px)",
  ].join(", "),
  backgroundPosition: "0 0, 0 0",
  backgroundSize: "100% 100%, 100% 31px",
};

const LIST_INDENT_SPACES = 2;

const buildInlineListPrefix = (kind: "bulleted" | "todo" | "numbered" | "toggle", indent: string, number?: number) => {
  if (kind === "todo") {
    return `${indent}- [ ] `;
  }
  if (kind === "toggle") {
    return `${indent}> `;
  }
  if (kind === "numbered") {
    return `${indent}${Math.max(1, number ?? 1)}. `;
  }
  return `${indent}- `;
};

export const NoteTextEditor = ({ editing, editingNote, camera, toScreenPoint, handleEditorBlur, setEditing, updateNote, openImageInsert, wikiLinkOptions }: NoteTextEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [slashMenu, setSlashMenu] = useState<FloatingMenuState | null>(null);
  const [wikiMenu, setWikiMenu] = useState<FloatingMenuState | null>(null);
  const [activeSlashIndex, setActiveSlashIndex] = useState(0);
  const [activeWikiIndex, setActiveWikiIndex] = useState(0);
  const editingTextStyle = getNoteTextStyle(editingNote.textSize, editingNote.textSizePx);
  const editingJournalDate = formatJournalDateLabel(editingNote.createdAt);
  const isEditingJournal = editingNote.noteKind === "journal";
  const isImageCaptionEditor = Boolean(editingNote.imageUrl?.trim());
  const imageCaptionEditorHeight = Math.min(Math.max(72, editingNote.h * camera.zoom * 0.24), 112);

  const commandQuery = slashMenu?.query.trim().toLowerCase() ?? "";
  const filteredCommands = commandQuery
    ? slashCommands.filter((command) => [command.label, command.id, ...command.keywords].some((value) => value.toLowerCase().includes(commandQuery)))
    : slashCommands;

  const filteredWikiOptions = useMemo<NoteWikiLinkOption[]>(() => {
    if (!wikiMenu) {
      return [];
    }
    const query = wikiMenu.query.trim().toLowerCase();
    const existing: NoteWikiLinkOption[] = wikiLinkOptions
      .filter((option) => (query ? option.title.toLowerCase().includes(query) : true))
      .slice(0, 8)
      .map((option) => ({
        id: option.noteId,
        title: option.title,
        subtitle: "Link to existing note",
        mode: "existing" as const,
      }));
    const hasExact = existing.some((option) => option.title.toLowerCase() === query);
    if (query && !hasExact) {
      existing.unshift({
        id: `create-${query}`,
        title: wikiMenu.query.trim(),
        subtitle: "Create a new linked note",
        mode: "create",
      });
    }
    return existing;
  }, [wikiLinkOptions, wikiMenu]);

  const updateSlashMenu = (nextValue?: string, nextCursor?: number) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setSlashMenu(null);
      return;
    }
    const cursor = nextCursor ?? textarea.selectionStart ?? 0;
    const value = nextValue ?? textarea.value;
    const slash = parseSlashQuery(value, cursor);
    if (!slash) {
      setSlashMenu(null);
      return;
    }
    const caretRect = getCaretRect(textarea, cursor);
    if (!caretRect) {
      setSlashMenu(null);
      return;
    }
    const width = Math.min(352, Math.max(240, window.innerWidth - 16));
    setSlashMenu({
      query: slash.query,
      start: slash.start,
      end: slash.end,
      left: clamp(caretRect.left - 18, 8, Math.max(8, window.innerWidth - width - 8)),
      top: clamp(caretRect.bottom + 10, 8, Math.max(8, window.innerHeight - 240)),
    });
  };

  const updateWikiMenu = (nextValue?: string, nextCursor?: number) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setWikiMenu(null);
      return;
    }
    const cursor = nextCursor ?? textarea.selectionStart ?? 0;
    const value = nextValue ?? textarea.value;
    const wikiQuery = getActiveWikiLinkQuery(value, cursor);
    if (!wikiQuery) {
      setWikiMenu(null);
      return;
    }
    const caretRect = getCaretRect(textarea, cursor);
    if (!caretRect) {
      setWikiMenu(null);
      return;
    }
    const width = Math.min(368, Math.max(252, window.innerWidth - 16));
    setWikiMenu({
      query: wikiQuery.query,
      start: wikiQuery.start,
      end: wikiQuery.end,
      left: clamp(caretRect.left - 18, 8, Math.max(8, window.innerWidth - width - 8)),
      top: clamp(caretRect.bottom + 10, 8, Math.max(8, window.innerHeight - 240)),
    });
  };

  useEffect(() => {
    if (!slashMenu && !wikiMenu) {
      return;
    }
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    const reposition = () => {
      updateSlashMenu();
      updateWikiMenu();
    };
    textarea.addEventListener("scroll", reposition);
    window.addEventListener("resize", reposition);
    return () => {
      textarea.removeEventListener("scroll", reposition);
      window.removeEventListener("resize", reposition);
    };
  }, [slashMenu, wikiMenu]);


  const applySelectionUpdate = (update: TextSelectionUpdate) => {
    setEditing({ id: editing.id, text: update.nextValue });
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) {
        return;
      }
      textarea.focus();
      textarea.setSelectionRange(update.selectionStart, update.selectionEnd);
      updateSlashMenu(update.nextValue, update.selectionEnd);
      updateWikiMenu(update.nextValue, update.selectionEnd);
    });
  };

  const applyShortcut = (action: "bold" | "italic" | "underline" | "code") => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    const selectionStart = textarea.selectionStart ?? 0;
    const selectionEnd = textarea.selectionEnd ?? selectionStart;
    applySelectionUpdate(applyToolbarAction(editing.text, selectionStart, selectionEnd, action));
  };

  const insertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    const href = window.prompt("Link URL");
    if (!href?.trim()) {
      return;
    }
    const selectionStart = textarea.selectionStart ?? 0;
    const selectionEnd = textarea.selectionEnd ?? selectionStart;
    applySelectionUpdate(insertMarkdownLink(editing.text, selectionStart, selectionEnd, href.trim()));
  };

  const insertWikiLink = (option: NoteWikiLinkOption) => {
    if (!wikiMenu) {
      return;
    }
    const title = option.title.trim();
    if (!title) {
      return;
    }
    applySelectionUpdate(replaceWikiLinkQuery(editing.text, wikiMenu, title));
  };

  const insertPromptedLinkLine = (label: string, placeholderUrl: string, prefix?: string) => {
    if (!slashMenu) {
      return;
    }
    const prompted = window.prompt(`${label} URL`)?.trim();
    const href = prompted || placeholderUrl;
    const linePrefix = prefix ? `${prefix} ` : "";
    applySelectionUpdate(replaceRange(editing.text, slashMenu.start, slashMenu.end, `${linePrefix}[${label}](${href})`));
  };

  const handleInlineListEnter = (selectionStart: number, selectionEnd: number) => {
    const normalizedValue =
      selectionStart === selectionEnd ? editing.text : `${editing.text.slice(0, selectionStart)}${editing.text.slice(selectionEnd)}`;
    const context = getInlineListContext(normalizedValue, selectionStart);
    if (!context) {
      return false;
    }

    const cursorInContent = Math.max(0, selectionStart - (context.lineStart + context.prefix.length));
    const beforeContent = context.content.slice(0, cursorInContent);
    const afterContent = context.content.slice(cursorInContent);

    if (context.content.trim().length === 0) {
      applySelectionUpdate(replaceRange(normalizedValue, context.lineStart, context.lineEnd, ""));
      return true;
    }

    const nextPrefix = buildInlineListPrefix(context.kind, context.indent, context.kind === "numbered" ? (context.number ?? 1) + 1 : undefined);
    const nextValue = `${normalizedValue.slice(0, context.lineStart)}${context.prefix}${beforeContent}
${nextPrefix}${afterContent}${normalizedValue.slice(context.lineEnd)}`;
    const nextCursor = context.lineStart + context.prefix.length + beforeContent.length + 1 + nextPrefix.length;
    applySelectionUpdate({
      nextValue,
      selectionStart: nextCursor,
      selectionEnd: nextCursor,
    });
    return true;
  };

  const handleInlineListTab = (selectionStart: number, selectionEnd: number, outdent: boolean) => {
    const context = getInlineListContext(editing.text, selectionStart, selectionEnd);
    if (!context) {
      return false;
    }

    const nextIndent = outdent
      ? context.indent.slice(0, Math.max(0, context.indent.length - LIST_INDENT_SPACES))
      : `${context.indent}${" ".repeat(LIST_INDENT_SPACES)}`;
    if (nextIndent === context.indent) {
      return true;
    }

    const nextLine = `${buildInlineListPrefix(context.kind, nextIndent, context.number)}${context.content}`;
    const nextValue = `${editing.text.slice(0, context.lineStart)}${nextLine}${editing.text.slice(context.lineEnd)}`;
    const cursorDelta = nextIndent.length - context.indent.length;
    applySelectionUpdate({
      nextValue,
      selectionStart: Math.max(context.lineStart, selectionStart + cursorDelta),
      selectionEnd: Math.max(context.lineStart, selectionEnd + cursorDelta),
    });
    return true;
  };

  const handleInlineListBackspace = (selectionStart: number, selectionEnd: number) => {
    if (selectionStart !== selectionEnd) {
      return false;
    }
    const context = getInlineListContext(editing.text, selectionStart);
    if (!context) {
      return false;
    }

    if (selectionStart === context.lineStart + context.prefix.length && context.content.trim().length === 0) {
      applySelectionUpdate(replaceRange(editing.text, context.lineStart, context.lineEnd, ""));
      return true;
    }

    if (selectionStart === context.lineStart && context.indent.length > 0) {
      return handleInlineListTab(selectionStart, selectionEnd, true);
    }

    return false;
  };

  const executeSlashCommand = (command: SlashCommand) => {
    if (!slashMenu) {
      return;
    }

    if (command.id === "text") {
      applySelectionUpdate(replaceRange(editing.text, slashMenu.start, slashMenu.end, ""));
      updateNote(editing.id, {
        noteKind: "standard",
        quoteAuthor: undefined,
        quoteSource: undefined,
        canon: undefined,
        vocabulary: undefined,
        textAlign: "left",
      });
      return;
    }

    if (command.id === "h1" || command.id === "h2" || command.id === "h3") {
      applySelectionUpdate(replaceRange(editing.text, slashMenu.start, slashMenu.end, ""));
      updateNote(editing.id, {
        noteKind: "standard",
        quoteAuthor: undefined,
        quoteSource: undefined,
        canon: undefined,
        vocabulary: undefined,
        textAlign: "left",
        textSizePx: command.id === "h1" ? 28 : command.id === "h2" ? 24 : 20,
      });
      return;
    }

    if (command.id === "quote") {
      applySelectionUpdate(replaceRange(editing.text, slashMenu.start, slashMenu.end, ""));
      updateNote(editing.id, {
        noteKind: "quote",
        quoteAuthor: editingNote.quoteAuthor ?? "",
        quoteSource: editingNote.quoteSource ?? "",
        canon: undefined,
        vocabulary: undefined,
      });
      return;
    }

    if (command.id === "journal") {
      applySelectionUpdate(replaceRange(editing.text, slashMenu.start, slashMenu.end, ""));
      updateNote(editing.id, {
        noteKind: "journal",
        quoteAuthor: undefined,
        quoteSource: undefined,
        canon: undefined,
        vocabulary: undefined,
        textFont: JOURNAL_NOTE_DEFAULTS.textFont,
        textColor: JOURNAL_NOTE_DEFAULTS.textColor,
        textSizePx: JOURNAL_NOTE_DEFAULTS.textSizePx,
        color: JOURNAL_NOTE_DEFAULTS.color,
        tags: editingNote.tags.includes("journal") ? editingNote.tags : [...editingNote.tags, "journal"],
      });
      return;
    }

    if (command.id === "bulleted") {
      const nextValue = replaceRange(editing.text, slashMenu.start, slashMenu.end, "").nextValue;
      applySelectionUpdate(applyListPrefix(nextValue, slashMenu.start, slashMenu.start, "- "));
      return;
    }

    if (command.id === "numbered") {
      const nextValue = replaceRange(editing.text, slashMenu.start, slashMenu.end, "").nextValue;
      applySelectionUpdate(applyListPrefix(nextValue, slashMenu.start, slashMenu.start, "1. "));
      return;
    }

    if (command.id === "toggle") {
      const nextValue = replaceRange(editing.text, slashMenu.start, slashMenu.end, "").nextValue;
      applySelectionUpdate(applyListPrefix(nextValue, slashMenu.start, slashMenu.start, "> "));
      return;
    }

    if (command.id === "todo") {
      const nextValue = replaceRange(editing.text, slashMenu.start, slashMenu.end, "").nextValue;
      applySelectionUpdate(applyListPrefix(nextValue, slashMenu.start, slashMenu.start, "- [ ] "));
      return;
    }

    if (command.id === "table") {
      applySelectionUpdate(
        replaceRange(editing.text, slashMenu.start, slashMenu.end, "| Column 1 | Column 2 |\n| --- | --- |\n| Value | Value |"),
      );
      return;
    }

    if (command.id === "file") {
      insertPromptedLinkLine("File", "https://example.com/file");
      return;
    }

    if (command.id === "image") {
      applySelectionUpdate(replaceRange(editing.text, slashMenu.start, slashMenu.end, ""));
      openImageInsert(editing.id);
      return;
    }

    if (command.id === "video") {
      insertPromptedLinkLine("Video", "https://example.com/video");
      return;
    }

    if (command.id === "audio") {
      insertPromptedLinkLine("Audio", "https://example.com/audio");
      return;
    }

    if (command.id === "bookmark") {
      insertPromptedLinkLine("Bookmark", "https://example.com", "Saved");
      return;
    }

    if (command.id === "embed") {
      insertPromptedLinkLine("Embed", "https://example.com/embed", "Embed");
      return;
    }

    if (command.id === "divider") {
      applySelectionUpdate(replaceRange(editing.text, slashMenu.start, slashMenu.end, "--------------------"));
      return;
    }

    if (command.id === "callout") {
      applySelectionUpdate(replaceRange(editing.text, slashMenu.start, slashMenu.end, "Callout: "));
      updateNote(editing.id, {
        noteKind: "standard",
        color: "#BDE5FF",
      });
      return;
    }

    if (command.id === "code") {
      applySelectionUpdate(replaceRange(editing.text, slashMenu.start, slashMenu.end, "```ts\nconst idea = \"\";\n```"));
      return;
    }

    applySelectionUpdate(insertAtSelection(editing.text, slashMenu.start, slashMenu.end, ""));
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (wikiMenu && filteredWikiOptions.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveWikiIndex((current) => (current + 1) % filteredWikiOptions.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveWikiIndex((current) => (current - 1 + filteredWikiOptions.length) % filteredWikiOptions.length);
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const selectedOption = filteredWikiOptions[activeWikiIndex] ?? filteredWikiOptions[0];
        if (!selectedOption) {
          return;
        }
        insertWikiLink(selectedOption);
        return;
      }
    }

    if (slashMenu && filteredCommands.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveSlashIndex((current) => (current + 1) % filteredCommands.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveSlashIndex((current) => (current - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const selectedCommand = filteredCommands[activeSlashIndex] ?? filteredCommands[0];
        if (!selectedCommand) {
          return;
        }
        executeSlashCommand(selectedCommand);
        return;
      }
    }

    if ((wikiMenu || slashMenu) && event.key === "Escape") {
      event.preventDefault();
      setWikiMenu(null);
      setSlashMenu(null);
      return;
    }

    const selectionStart = event.currentTarget.selectionStart ?? 0;
    const selectionEnd = event.currentTarget.selectionEnd ?? selectionStart;

    if (event.key === "Tab") {
      if (handleInlineListTab(selectionStart, selectionEnd, event.shiftKey)) {
        event.preventDefault();
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey && handleInlineListEnter(selectionStart, selectionEnd)) {
      event.preventDefault();
      return;
    }

    if (event.key === "Backspace" && handleInlineListBackspace(selectionStart, selectionEnd)) {
      event.preventDefault();
      return;
    }

    if (!(event.metaKey || event.ctrlKey) || event.altKey) {
      return;
    }

    const key = event.key.toLowerCase();
    if (key === "b" || key === "i" || key === "u") {
      event.preventDefault();
      applyShortcut(key === "b" ? "bold" : key === "i" ? "italic" : "underline");
      return;
    }

    if (key === "k") {
      event.preventDefault();
      insertLink();
    }
  };

  return (
    <div
      className="absolute z-[46]"
      style={(() => {
        const screen = toScreenPoint(editingNote.x, editingNote.y, camera);
        const noteHeight = editingNote.h * camera.zoom;
        return {
          left: `${screen.x}px`,
          top: `${isImageCaptionEditor ? screen.y + noteHeight - imageCaptionEditorHeight - 8 : screen.y}px`,
          width: `${editingNote.w * camera.zoom}px`,
        };
      })()}
    >
      <NoteTextFormattingToolbar
        textareaRef={textareaRef}
        active
        value={editing.text}
        onTextUpdate={(nextValue, selectionStart, selectionEnd) => applySelectionUpdate({ nextValue, selectionStart, selectionEnd })}
      />
      <NoteSlashCommandMenu
        open={Boolean(slashMenu) && filteredCommands.length > 0}
        left={slashMenu?.left ?? 0}
        top={slashMenu?.top ?? 0}
        commands={filteredCommands}
        activeIndex={Math.min(activeSlashIndex, Math.max(0, filteredCommands.length - 1))}
        onHover={setActiveSlashIndex}
        onSelect={(command) => executeSlashCommand(command as SlashCommand)}
      />
      <NoteWikiLinkMenu
        open={Boolean(wikiMenu) && filteredWikiOptions.length > 0}
        left={wikiMenu?.left ?? 0}
        top={wikiMenu?.top ?? 0}
        options={filteredWikiOptions}
        activeIndex={Math.min(activeWikiIndex, Math.max(0, filteredWikiOptions.length - 1))}
        onHover={setActiveWikiIndex}
        onSelect={insertWikiLink}
      />
      <div className="relative">
        {isEditingJournal ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-[1] text-left"
            style={{
              color: editingNote.textColor ?? JOURNAL_NOTE_DEFAULTS.textColor,
              fontFamily: getNoteTextFontFamily(editingNote.textFont),
              fontSize: `${Math.max(13, editingTextStyle.fontSize - 2)}px`,
              lineHeight: "1.1",
              left: "56px",
              top: "12px",
            }}
          >
            <span
              style={{
                borderBottom: `2px solid ${editingNote.textColor ?? JOURNAL_NOTE_DEFAULTS.textColor}`,
                paddingBottom: "1px",
                display: "inline-block",
              }}
            >
              {editingJournalDate}
            </span>
          </div>
        ) : null}
        <textarea
          ref={textareaRef}
          autoFocus
          value={editing.text}
          onChange={(event) => {
            setEditing({ id: editing.id, text: event.target.value });
            updateSlashMenu(event.target.value, event.target.selectionStart ?? event.target.value.length);
            updateWikiMenu(event.target.value, event.target.selectionStart ?? event.target.value.length);
          }}
          onBlur={handleEditorBlur}
          onKeyDown={handleKeyDown}
          onClick={() => {
            updateSlashMenu();
            updateWikiMenu();
          }}
          onKeyUp={() => {
            updateSlashMenu();
            updateWikiMenu();
          }}
          onSelect={() => {
            updateSlashMenu();
            updateWikiMenu();
          }}
          className="w-full resize-none rounded-[22px] border border-black/10 bg-[rgba(255,255,255,0.92)] p-4 shadow-[0_22px_58px_rgba(15,23,42,0.18)] outline-none backdrop-blur-sm transition-[box-shadow,border-color] duration-150 focus:border-black/15"
          style={(() => {
            const baseStyle = {
              height: `${editingNote.h * camera.zoom}px`,
              textAlign: editingNote.textAlign ?? "left",
              fontFamily: getNoteTextFontFamily(editingNote.textFont),
              color: editingNote.textColor ?? NOTE_DEFAULTS.textColor,
              fontSize: `${editingTextStyle.fontSize}px`,
              lineHeight: `${isEditingJournal ? 1.72 : editingTextStyle.lineHeight}`,
              fontStyle: editingNote.noteKind === "quote" ? "italic" : "normal",
            };

            if (isEditingJournal) {
              return {
                ...baseStyle,
                ...journalEditorBackground,
                borderRadius: "18px",
                paddingTop: "45px",
                paddingLeft: "56px",
                paddingRight: "18px",
                paddingBottom: "18px",
              };
            }

            if (isImageCaptionEditor) {
              return {
                ...baseStyle,
                height: `${imageCaptionEditorHeight}px`,
                backgroundColor: "rgba(255,255,255,0.96)",
                borderRadius: "16px",
                paddingTop: "12px",
                paddingBottom: "12px",
                paddingLeft: "14px",
                paddingRight: "14px",
                color: "#475569",
                fontSize: `${Math.min(editingTextStyle.fontSize, 14)}px`,
                lineHeight: "1.35",
              };
            }

            return {
              ...baseStyle,
              backgroundColor: editingNote.color,
            };
          })()}
          placeholder={isImageCaptionEditor ? "Add caption" : "Type '/' for commands or use [[Note Title]]"}
          spellCheck
        />
      </div>
    </div>
  );
};

