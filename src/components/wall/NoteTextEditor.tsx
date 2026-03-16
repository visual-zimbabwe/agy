"use client";

import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";

import { NoteSlashCommandMenu } from "@/components/wall/NoteSlashCommandMenu";
import { NoteTextFormattingToolbar } from "@/components/wall/NoteTextFormattingToolbar";
import {
  applyToolbarAction,
  clamp,
  getCaretRect,
  insertMarkdownLink,
  parseSlashQuery,
  replaceRange,
  type TextSelectionUpdate,
} from "@/components/wall/noteEditorFormatting";
import { formatJournalDateLabel, getNoteTextFontFamily, getNoteTextStyle } from "@/components/wall/wall-canvas-helpers";
import { JOURNAL_NOTE_DEFAULTS, NOTE_DEFAULTS } from "@/features/wall/constants";
import type { Note } from "@/features/wall/types";

type NoteTextEditorProps = {
  editing: { id: string; text: string };
  editingNote: Note;
  camera: { x: number; y: number; zoom: number };
  toScreenPoint: (worldX: number, worldY: number, camera: { x: number; y: number; zoom: number }) => { x: number; y: number };
  handleEditorBlur: (event: FocusEvent<HTMLTextAreaElement>) => void;
  setEditing: (value: { id: string; text: string } | null) => void;
  updateNote: (noteId: string, patch: Partial<Note>) => void;
};

type SlashCommand = {
  id: "heading" | "quote" | "journal" | "list" | "todo" | "image" | "divider";
  label: string;
  description: string;
  glyph: string;
  keywords: string[];
};

type SlashMenuState = {
  left: number;
  top: number;
  query: string;
  start: number;
  end: number;
};

const slashCommands: SlashCommand[] = [
  { id: "heading", label: "Heading", description: "Make this note feel like a title.", glyph: "H1", keywords: ["title", "headline"] },
  { id: "quote", label: "Quote", description: "Turn the note into a quote card.", glyph: '""', keywords: ["citation", "author"] },
  { id: "journal", label: "Journal", description: "Switch to the journal note treatment.", glyph: "JR", keywords: ["diary", "entry"] },
  { id: "list", label: "List", description: "Start a bulleted list on this line.", glyph: "--", keywords: ["bullet", "items"] },
  { id: "todo", label: "Todo", description: "Insert a checkbox-style task.", glyph: "[]", keywords: ["task", "checkbox"] },
  { id: "image", label: "Image", description: "Attach an image URL to the note.", glyph: "IM", keywords: ["photo", "media"] },
  { id: "divider", label: "Divider", description: "Insert a subtle text divider.", glyph: "//", keywords: ["rule", "separator"] },
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

export const NoteTextEditor = ({ editing, editingNote, camera, toScreenPoint, handleEditorBlur, setEditing, updateNote }: NoteTextEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [menu, setMenu] = useState<SlashMenuState | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const editingTextStyle = getNoteTextStyle(editingNote.textSize, editingNote.textSizePx);
  const editingJournalDate = formatJournalDateLabel(editingNote.createdAt);
  const isEditingJournal = editingNote.noteKind === "journal";

  const commandQuery = menu?.query.trim().toLowerCase() ?? "";
  const filteredCommands = commandQuery
    ? slashCommands.filter((command) => [command.label, command.id, ...command.keywords].some((value) => value.toLowerCase().includes(commandQuery)))
    : slashCommands;

  const updateSlashMenu = (nextValue?: string, nextCursor?: number) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMenu(null);
      return;
    }
    const cursor = nextCursor ?? textarea.selectionStart ?? 0;
    const value = nextValue ?? textarea.value;
    const slash = parseSlashQuery(value, cursor);
    if (!slash) {
      setMenu(null);
      return;
    }
    const caretRect = getCaretRect(textarea, cursor);
    if (!caretRect) {
      setMenu(null);
      return;
    }
    const width = Math.min(352, Math.max(240, window.innerWidth - 16));
    setMenu({
      query: slash.query,
      start: slash.start,
      end: slash.end,
      left: clamp(caretRect.left - 18, 8, Math.max(8, window.innerWidth - width - 8)),
      top: clamp(caretRect.bottom + 10, 8, Math.max(8, window.innerHeight - 240)),
    });
  };

  useEffect(() => {
    if (!menu) {
      return;
    }
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    const reposition = () => updateSlashMenu();
    textarea.addEventListener("scroll", reposition);
    window.addEventListener("resize", reposition);
    return () => {
      textarea.removeEventListener("scroll", reposition);
      window.removeEventListener("resize", reposition);
    };
  }, [menu]);

  const focusEditor = () => {
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      updateSlashMenu();
    });
  };

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


  const executeSlashCommand = (command: SlashCommand) => {
    if (!menu) {
      return;
    }

    if (command.id === "heading") {
      applySelectionUpdate(replaceRange(editing.text, menu.start, menu.end, ""));
      updateNote(editing.id, { textSizePx: 28, textAlign: "left" });
      return;
    }

    if (command.id === "quote") {
      applySelectionUpdate(replaceRange(editing.text, menu.start, menu.end, ""));
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
      applySelectionUpdate(replaceRange(editing.text, menu.start, menu.end, ""));
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

    if (command.id === "list") {
      applySelectionUpdate(replaceRange(editing.text, menu.start, menu.end, "- "));
      return;
    }

    if (command.id === "todo") {
      applySelectionUpdate(replaceRange(editing.text, menu.start, menu.end, "- [ ] "));
      return;
    }

    if (command.id === "divider") {
      applySelectionUpdate(replaceRange(editing.text, menu.start, menu.end, "--------------------"));
      return;
    }

    const href = window.prompt("Image URL", editingNote.imageUrl ?? "");
    applySelectionUpdate(replaceRange(editing.text, menu.start, menu.end, ""));
    if (href === null) {
      return;
    }
    const trimmed = href.trim();
    updateNote(editing.id, { imageUrl: trimmed || undefined });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (menu && filteredCommands.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => (current + 1) % filteredCommands.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => (current - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const selectedCommand = filteredCommands[activeIndex] ?? filteredCommands[0];
        if (!selectedCommand) {
          return;
        }
        executeSlashCommand(selectedCommand);
        return;
      }
    }

    if (menu && event.key === "Escape") {
      event.preventDefault();
      setMenu(null);
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
        return {
          left: `${screen.x}px`,
          top: `${screen.y}px`,
          width: `${editingNote.w * camera.zoom}px`,
        };
      })()}
    >
      <NoteTextFormattingToolbar
        textareaRef={textareaRef}
        active
        value={editing.text}
        textColor={editingNote.textColor}
        onTextUpdate={(nextValue, selectionStart, selectionEnd) => applySelectionUpdate({ nextValue, selectionStart, selectionEnd })}
        onTextColorUpdate={(textColor) => {
          updateNote(editing.id, { textColor });
          focusEditor();
        }}
      />
      <NoteSlashCommandMenu
        open={Boolean(menu) && filteredCommands.length > 0}
        left={menu?.left ?? 0}
        top={menu?.top ?? 0}
        commands={filteredCommands}
        activeIndex={Math.min(activeIndex, Math.max(0, filteredCommands.length - 1))}
        onHover={setActiveIndex}
        onSelect={(command) => executeSlashCommand(command as SlashCommand)}
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
          }}
          onBlur={handleEditorBlur}
          onKeyDown={handleKeyDown}
          onClick={() => updateSlashMenu()}
          onKeyUp={() => updateSlashMenu()}
          onSelect={() => updateSlashMenu()}
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

            return {
              ...baseStyle,
              backgroundColor: editingNote.color,
            };
          })()}
          placeholder="Type '/' for commands"
          spellCheck
        />
      </div>
    </div>
  );
};