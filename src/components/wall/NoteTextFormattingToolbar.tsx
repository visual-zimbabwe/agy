"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { NOTE_TEXT_FONTS, NOTE_TEXT_SIZES } from "@/features/wall/constants";
import type { Note } from "@/features/wall/types";

type NoteTextAlign = "left" | "center" | "right";
type ToolbarAction = "bold" | "italic" | "underline" | "bullet" | "number" | "multilevel";

type NoteTextFormattingToolbarProps = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  active: boolean;
  value: string;
  textAlign: NoteTextAlign;
  textSize?: Note["textSize"];
  textFont?: Note["textFont"];
  onTextUpdate: (nextValue: string, selectionStart: number, selectionEnd: number) => void;
  onAlignUpdate: (align: NoteTextAlign) => void;
  onTextSizeUpdate: (size: NonNullable<Note["textSize"]>) => void;
  onTextFontUpdate: (font: NonNullable<Note["textFont"]>) => void;
};

type ToolbarPosition = {
  left: number;
  top: number;
};

const plainUpper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const plainLower = "abcdefghijklmnopqrstuvwxyz";
const plainDigits = "0123456789";
const boldUpper = "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭";
const boldLower = "𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇";
const boldDigits = "𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟕𝟴𝟵";
const italicUpper = "𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡";
const italicLower = "𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻";
const underlineMark = "\u0332";

const buildCharMap = (from: string, to: string) => {
  const map: Record<string, string> = {};
  const fromChars = Array.from(from);
  const toChars = Array.from(to);
  for (let index = 0; index < fromChars.length; index += 1) {
    const source = fromChars[index];
    const target = toChars[index];
    if (!source || !target) {
      continue;
    }
    map[source] = target;
  }
  return map;
};

const boldMap = {
  ...buildCharMap(plainUpper, boldUpper),
  ...buildCharMap(plainLower, boldLower),
  ...buildCharMap(plainDigits, boldDigits),
};

const italicMap = {
  ...buildCharMap(plainUpper, italicUpper),
  ...buildCharMap(plainLower, italicLower),
};

const reverseCharMap = (source: Record<string, string>) =>
  Object.fromEntries(Object.entries(source).map(([key, value]) => [value, key])) as Record<string, string>;

const reverseBoldMap = reverseCharMap(boldMap);
const reverseItalicMap = reverseCharMap(italicMap);

const mirrorStyleProps = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "lineHeight",
  "letterSpacing",
  "textTransform",
  "textIndent",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "boxSizing",
  "wordBreak",
  "overflowWrap",
  "tabSize",
] as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getCaretRect = (textarea: HTMLTextAreaElement, index: number) => {
  if (typeof document === "undefined") {
    return null;
  }

  const safeIndex = clamp(index, 0, textarea.value.length);
  const mirror = document.createElement("div");
  const style = window.getComputedStyle(textarea);

  mirror.style.position = "fixed";
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";
  mirror.style.overflow = "hidden";
  mirror.style.left = `${textarea.getBoundingClientRect().left}px`;
  mirror.style.top = `${textarea.getBoundingClientRect().top}px`;
  mirror.style.width = `${textarea.clientWidth}px`;
  mirror.style.height = `${textarea.clientHeight}px`;

  for (const prop of mirrorStyleProps) {
    mirror.style[prop] = style[prop];
  }

  mirror.scrollTop = textarea.scrollTop;
  mirror.scrollLeft = textarea.scrollLeft;

  const before = textarea.value.slice(0, safeIndex);
  const marker = document.createElement("span");
  marker.textContent = "\u200b";

  mirror.textContent = before;
  mirror.append(marker);
  document.body.append(mirror);

  const rect = marker.getBoundingClientRect();
  mirror.remove();
  return rect;
};

const applyStyledTransform = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  forwardMap: Record<string, string>,
  reverseMap: Record<string, string>,
) => {
  const start = Math.min(selectionStart, selectionEnd);
  const end = Math.max(selectionStart, selectionEnd);
  if (start === end) {
    return { nextValue: value, selectionStart: start, selectionEnd: end };
  }

  const selected = value.slice(start, end);
  const chars = Array.from(selected);
  let styledCount = 0;
  let plainCount = 0;
  for (const char of chars) {
    if (reverseMap[char]) {
      styledCount += 1;
    } else if (forwardMap[char]) {
      plainCount += 1;
    }
  }
  const eligibleCount = styledCount + plainCount;
  const shouldUnstyle = eligibleCount > 0 && styledCount === eligibleCount;
  const transformed = chars
    .map((char) => {
      if (shouldUnstyle) {
        return reverseMap[char] ?? char;
      }
      return forwardMap[char] ?? char;
    })
    .join("");

  const nextValue = `${value.slice(0, start)}${transformed}${value.slice(end)}`;
  return {
    nextValue,
    selectionStart: start,
    selectionEnd: start + transformed.length,
  };
};

const applyUnderlineTransform = (value: string, selectionStart: number, selectionEnd: number) => {
  const start = Math.min(selectionStart, selectionEnd);
  const end = Math.max(selectionStart, selectionEnd);
  if (start === end) {
    return { nextValue: value, selectionStart: start, selectionEnd: end };
  }

  const selected = value.slice(start, end);
  const shouldUnstyle = selected.includes(underlineMark);
  const transformed = shouldUnstyle
    ? selected.replaceAll(underlineMark, "")
    : Array.from(selected)
        .map((char) => (char === "\n" ? char : `${char}${underlineMark}`))
        .join("");

  const nextValue = `${value.slice(0, start)}${transformed}${value.slice(end)}`;
  return {
    nextValue,
    selectionStart: start,
    selectionEnd: start + transformed.length,
  };
};

const getLineRange = (value: string, selectionStart: number, selectionEnd: number) => {
  const start = Math.min(selectionStart, selectionEnd);
  const end = Math.max(selectionStart, selectionEnd);
  const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const lineEndIndex = value.indexOf("\n", end);
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
  return { lineStart, lineEnd };
};

const applyListTransform = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  mode: "bullet" | "number" | "multilevel",
) => {
  const { lineStart, lineEnd } = getLineRange(value, selectionStart, selectionEnd);
  const lines = value.slice(lineStart, lineEnd).split("\n");

  const normalizeListText = (line: string) => line.replace(/^\s*(?:[-*+]|\d+\.)\s+/, "");

  let nextLines: string[] = [];
  if (mode === "bullet") {
    nextLines = lines.map((line) => {
      if (!line.trim()) {
        return "- ";
      }
      return `- ${normalizeListText(line)}`;
    });
  } else if (mode === "number") {
    nextLines = lines.map((line, index) => {
      if (!line.trim()) {
        return `${index + 1}. `;
      }
      return `${index + 1}. ${normalizeListText(line)}`;
    });
  } else {
    const hasIndentedList = lines.some((line) => /^\s{2,}(?:[-*+]|\d+\.)\s+/.test(line));
    nextLines = lines.map((line) => {
      if (!line.trim()) {
        return line;
      }
      if (hasIndentedList) {
        return line.replace(/^\s{2}/, "");
      }
      if (/^\s*(?:[-*+]|\d+\.)\s+/.test(line)) {
        return `  ${line.trimStart()}`;
      }
      return `  - ${line.trim()}`;
    });
  }

  const replacement = nextLines.join("\n");
  const nextValue = `${value.slice(0, lineStart)}${replacement}${value.slice(lineEnd)}`;
  return {
    nextValue,
    selectionStart: lineStart,
    selectionEnd: lineStart + replacement.length,
  };
};

export const NoteTextFormattingToolbar = ({
  textareaRef,
  active,
  value,
  textAlign,
  textSize,
  textFont,
  onTextUpdate,
  onAlignUpdate,
  onTextSizeUpdate,
  onTextFontUpdate,
}: NoteTextFormattingToolbarProps) => {
  const [focused, setFocused] = useState(false);
  const [position, setPosition] = useState<ToolbarPosition | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  const visible = active && focused && position;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!active || !textarea) {
      return;
    }

    const updatePosition = () => {
      const current = textareaRef.current;
      if (!current || document.activeElement !== current) {
        setPosition(null);
        return;
      }
      const selectionStart = current.selectionStart ?? 0;
      const selectionEnd = current.selectionEnd ?? selectionStart;
      const startRect = getCaretRect(current, selectionStart);
      const endRect = getCaretRect(current, selectionEnd);
      if (!startRect || !endRect) {
        setPosition(null);
        return;
      }
      const anchorX = selectionStart === selectionEnd ? startRect.left : (startRect.left + endRect.left) / 2;
      const anchorY = Math.min(startRect.top, endRect.top);
      const left = clamp(anchorX - 170, 8, Math.max(8, window.innerWidth - 340));
      const top = clamp(anchorY - 54, 8, Math.max(8, window.innerHeight - 52));
      setPosition({ left, top });
    };

    const onFocus = () => {
      setFocused(true);
      updatePosition();
    };
    const onBlur = () => {
      setFocused(false);
      setPosition(null);
    };

    const trackedEvents: Array<keyof HTMLElementEventMap> = ["focus", "blur", "keyup", "mouseup", "select", "input", "click", "scroll"];
    trackedEvents.forEach((eventName) => textarea.addEventListener(eventName, updatePosition));
    textarea.addEventListener("focus", onFocus);
    textarea.addEventListener("blur", onBlur);
    window.addEventListener("resize", updatePosition);

    if (document.activeElement === textarea) {
      onFocus();
    }

    return () => {
      trackedEvents.forEach((eventName) => textarea.removeEventListener(eventName, updatePosition));
      textarea.removeEventListener("focus", onFocus);
      textarea.removeEventListener("blur", onBlur);
      window.removeEventListener("resize", updatePosition);
    };
  }, [active, textareaRef, value]);

  const runAction = (action: ToolbarAction) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    const selectionStart = textarea.selectionStart ?? 0;
    const selectionEnd = textarea.selectionEnd ?? selectionStart;

    const update = (() => {
      if (action === "bold") {
        return applyStyledTransform(value, selectionStart, selectionEnd, boldMap, reverseBoldMap);
      }
      if (action === "italic") {
        return applyStyledTransform(value, selectionStart, selectionEnd, italicMap, reverseItalicMap);
      }
      if (action === "underline") {
        return applyUnderlineTransform(value, selectionStart, selectionEnd);
      }
      return applyListTransform(value, selectionStart, selectionEnd, action);
    })();

    onTextUpdate(update.nextValue, update.selectionStart, update.selectionEnd);
  };

  const alignButtons = useMemo(
    () => [
      { id: "left", label: "L", title: "Align left" },
      { id: "center", label: "C", title: "Align center" },
      { id: "right", label: "R", title: "Align right" },
    ] as const,
    [],
  );

  if (!visible) {
    return null;
  }

  return (
    <div
      ref={toolbarRef}
      className="pointer-events-auto fixed z-[70] flex items-center gap-1 rounded-xl border border-zinc-300 bg-white/96 px-2 py-1.5 shadow-xl backdrop-blur-sm motion-toolbar-enter"
      style={{ left: `${position.left}px`, top: `${position.top}px` }}
      onMouseDown={(event) => event.preventDefault()}
      role="toolbar"
      aria-label="Text formatting"
    >
      <button type="button" onClick={() => runAction("bold")} className="rounded border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100" title="Bold">
        B
      </button>
      <button type="button" onClick={() => runAction("italic")} className="rounded border border-zinc-300 px-2 py-1 text-[11px] italic text-zinc-700 hover:bg-zinc-100" title="Italic">
        I
      </button>
      <button type="button" onClick={() => runAction("underline")} className="rounded border border-zinc-300 px-2 py-1 text-[11px] underline text-zinc-700 hover:bg-zinc-100" title="Underline">
        U
      </button>
      <div className="mx-0.5 h-4 w-px bg-zinc-300" />
      <button type="button" onClick={() => runAction("bullet")} className="rounded border border-zinc-300 px-2 py-1 text-[11px] text-zinc-700 hover:bg-zinc-100" title="Bulleted list">
        Bul
      </button>
      <button type="button" onClick={() => runAction("number")} className="rounded border border-zinc-300 px-2 py-1 text-[11px] text-zinc-700 hover:bg-zinc-100" title="Numbered list">
        Num
      </button>
      <button type="button" onClick={() => runAction("multilevel")} className="rounded border border-zinc-300 px-2 py-1 text-[11px] text-zinc-700 hover:bg-zinc-100" title="Multilevel list">
        Multi
      </button>
      <div className="mx-0.5 h-4 w-px bg-zinc-300" />
      {alignButtons.map((button) => (
        <button
          key={button.id}
          type="button"
          onClick={() => onAlignUpdate(button.id)}
          className={`rounded border px-2 py-1 text-[11px] ${
            textAlign === button.id
              ? "border-sky-500 bg-sky-50 text-sky-700"
              : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
          }`}
          title={button.title}
          aria-label={button.title}
        >
          {button.label}
        </button>
      ))}
      <div className="mx-0.5 h-4 w-px bg-zinc-300" />
      <select
        value={textFont ?? "patrick_hand"}
        onChange={(event) => onTextFontUpdate(event.target.value as NonNullable<Note["textFont"]>)}
        className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-700 hover:bg-zinc-100"
        title="Font family"
        aria-label="Font family"
      >
        {NOTE_TEXT_FONTS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        value={textSize ?? "md"}
        onChange={(event) => onTextSizeUpdate(event.target.value as NonNullable<Note["textSize"]>)}
        className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-700 hover:bg-zinc-100"
        title="Font size"
        aria-label="Font size"
      >
        {NOTE_TEXT_SIZES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label === "S" ? "14px" : option.label === "M" ? "17px" : "20px"}
          </option>
        ))}
      </select>
    </div>
  );
};
