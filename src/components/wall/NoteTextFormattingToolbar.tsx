"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

import { applyToolbarAction, clamp, getCaretRect, insertMarkdownLink } from "@/components/wall/noteEditorFormatting";

type NoteTextFormattingToolbarProps = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  active: boolean;
  value: string;
  onTextUpdate: (nextValue: string, selectionStart: number, selectionEnd: number) => void;
};

type ToolbarPosition = {
  left: number;
  top: number;
};

const toolbarButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-xl text-[13px] text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]";

const iconClass = "h-3.5 w-3.5";

const IconBold = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={iconClass} aria-hidden="true">
    <path d="M5 3.5h4a2.5 2.5 0 0 1 0 5H5zm0 5h4.7a2.4 2.4 0 1 1 0 4.8H5z" />
  </svg>
);

const IconItalic = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={iconClass} aria-hidden="true">
    <path d="M9.8 3.5H6.6m2.8 0-2.8 9m0 0h3.2" />
  </svg>
);

const IconUnderline = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={iconClass} aria-hidden="true">
    <path d="M5 3.5v3.2a3 3 0 1 0 6 0V3.5M4 12.5h8" />
  </svg>
);

const IconLink = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={iconClass} aria-hidden="true">
    <path d="M6.4 9.6 9.6 6.4" />
    <path d="M6 11H4.8a2.8 2.8 0 0 1 0-5.6H6" />
    <path d="M10 5h1.2a2.8 2.8 0 1 1 0 5.6H10" />
  </svg>
);

const IconHighlight = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={iconClass} aria-hidden="true">
    <path d="m5 3.5 5.5 5.5M4 12h4.5M9.8 2.8l3.4 3.4-5.1 5.1H4.7V7.9l5.1-5.1Z" />
  </svg>
);

export const NoteTextFormattingToolbar = ({ textareaRef, active, value, onTextUpdate }: NoteTextFormattingToolbarProps) => {
  const [position, setPosition] = useState<ToolbarPosition | null>(null);
  const toolInteractionRef = useRef(false);
  const toolInteractionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!active || !textarea) {
      return;
    }

    const updatePosition = () => {
      const current = textareaRef.current;
      if (!current) {
        setPosition(null);
        return;
      }
      const activeElement = document.activeElement as HTMLElement | null;
      const focusInsideEditor = activeElement === current;
      const focusInsideTools = Boolean(activeElement?.closest?.('[data-note-edit-tools="true"]'));
      if (!focusInsideEditor && !focusInsideTools) {
        if (toolInteractionRef.current) {
          return;
        }
        setPosition(null);
        return;
      }

      const selectionStart = current.selectionStart ?? 0;
      const selectionEnd = current.selectionEnd ?? selectionStart;
      if (selectionStart === selectionEnd) {
        setPosition(null);
        return;
      }

      const startRect = getCaretRect(current, Math.min(selectionStart, selectionEnd));
      const endRect = getCaretRect(current, Math.max(selectionStart, selectionEnd));
      if (!startRect || !endRect) {
        setPosition(null);
        return;
      }

      const width = 232;
      const anchorX = (startRect.left + endRect.left) / 2;
      const anchorY = Math.min(startRect.top, endRect.top);
      setPosition({
        left: clamp(anchorX - width / 2, 8, Math.max(8, window.innerWidth - width - 8)),
        top: clamp(anchorY - 52, 8, Math.max(8, window.innerHeight - 64)),
      });
    };

    const trackedEvents: Array<keyof HTMLElementEventMap> = ["focus", "blur", "keyup", "mouseup", "select", "input", "click", "scroll"];
    trackedEvents.forEach((eventName) => textarea.addEventListener(eventName, updatePosition));
    window.addEventListener("resize", updatePosition);
    document.addEventListener("selectionchange", updatePosition);
    updatePosition();

    return () => {
      trackedEvents.forEach((eventName) => textarea.removeEventListener(eventName, updatePosition));
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("selectionchange", updatePosition);
      if (toolInteractionTimerRef.current) {
        clearTimeout(toolInteractionTimerRef.current);
      }
    };
  }, [active, textareaRef, value]);

  const runAction = (action: "bold" | "italic" | "underline" | "highlight") => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    const selectionStart = textarea.selectionStart ?? 0;
    const selectionEnd = textarea.selectionEnd ?? selectionStart;
    const update = applyToolbarAction(value, selectionStart, selectionEnd, action);
    onTextUpdate(update.nextValue, update.selectionStart, update.selectionEnd);
  };

  const insertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    const url = window.prompt("Link URL");
    if (!url?.trim()) {
      return;
    }
    const selectionStart = textarea.selectionStart ?? 0;
    const selectionEnd = textarea.selectionEnd ?? selectionStart;
    const update = insertMarkdownLink(value, selectionStart, selectionEnd, url.trim());
    onTextUpdate(update.nextValue, update.selectionStart, update.selectionEnd);
  };

  if (!active || !position) {
    return null;
  }

  return (
    <div
      data-note-edit-tools="true"
      role="toolbar"
      aria-label="Selected text formatting"
      className="pointer-events-auto fixed z-[120] motion-toolbar-enter"
      style={{ left: `${position.left}px`, top: `${position.top}px` }}
      onPointerDownCapture={() => {
        toolInteractionRef.current = true;
        if (toolInteractionTimerRef.current) {
          clearTimeout(toolInteractionTimerRef.current);
        }
      }}
      onPointerUpCapture={() => {
        if (toolInteractionTimerRef.current) {
          clearTimeout(toolInteractionTimerRef.current);
        }
        toolInteractionTimerRef.current = setTimeout(() => {
          toolInteractionRef.current = false;
        }, 180);
      }}
    >
      <div className="relative flex items-center gap-0.5 rounded-2xl border border-zinc-300 bg-white p-1 shadow-[0_22px_52px_rgba(15,23,42,0.26)] ring-1 ring-black/5">
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runAction("bold")} className={toolbarButtonClass} title="Bold (Ctrl/Cmd+B)">
          <IconBold />
        </button>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runAction("italic")} className={toolbarButtonClass} title="Italic (Ctrl/Cmd+I)">
          <IconItalic />
        </button>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runAction("underline")} className={toolbarButtonClass} title="Underline (Ctrl/Cmd+U)">
          <IconUnderline />
        </button>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={insertLink} className={toolbarButtonClass} title="Link (Ctrl/Cmd+K)">
          <IconLink />
        </button>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runAction("highlight")} className={toolbarButtonClass} title="Highlight">
          <IconHighlight />
        </button>
      </div>
    </div>
  );
};