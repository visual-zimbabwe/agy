"use client";

export type ToolbarAction = "bold" | "italic" | "underline" | "code" | "highlight";

export type TextSelectionUpdate = {
  nextValue: string;
  selectionStart: number;
  selectionEnd: number;
};

export type SlashQueryMatch = {
  query: string;
  start: number;
  end: number;
};

const plainUpper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const plainLower = "abcdefghijklmnopqrstuvwxyz";
const plainDigits = "0123456789";
const underlineMark = "\u0332";

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

const buildMathAlphabet = (startCodePoint: number, source: string) =>
  Array.from(source, (_, index) => String.fromCodePoint(startCodePoint + index)).join("");

const boldUpper = buildMathAlphabet(0x1d5d4, plainUpper);
const boldLower = buildMathAlphabet(0x1d5ee, plainLower);
const boldDigits = buildMathAlphabet(0x1d7ec, plainDigits);
const italicUpper = buildMathAlphabet(0x1d608, plainUpper);
const italicLower = buildMathAlphabet(0x1d622, plainLower);

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

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const getCaretRect = (textarea: HTMLTextAreaElement, index: number) => {
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

  return {
    nextValue: `${value.slice(0, start)}${transformed}${value.slice(end)}`,
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

  return {
    nextValue: `${value.slice(0, start)}${transformed}${value.slice(end)}`,
    selectionStart: start,
    selectionEnd: start + transformed.length,
  };
};

const toggleMarkdownWrap = (value: string, selectionStart: number, selectionEnd: number, wrapper: string): TextSelectionUpdate => {
  const start = Math.min(selectionStart, selectionEnd);
  const end = Math.max(selectionStart, selectionEnd);
  if (start === end) {
    const insertion = `${wrapper}${wrapper}`;
    return {
      nextValue: `${value.slice(0, start)}${insertion}${value.slice(end)}`,
      selectionStart: start + wrapper.length,
      selectionEnd: start + wrapper.length,
    };
  }

  const selected = value.slice(start, end);
  const before = value.slice(Math.max(0, start - wrapper.length), start);
  const after = value.slice(end, end + wrapper.length);
  if (before === wrapper && after === wrapper) {
    return {
      nextValue: `${value.slice(0, start - wrapper.length)}${selected}${value.slice(end + wrapper.length)}`,
      selectionStart: start - wrapper.length,
      selectionEnd: end - wrapper.length,
    };
  }

  return {
    nextValue: `${value.slice(0, start)}${wrapper}${selected}${wrapper}${value.slice(end)}`,
    selectionStart: start + wrapper.length,
    selectionEnd: end + wrapper.length,
  };
};

export const applyToolbarAction = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  action: ToolbarAction,
): TextSelectionUpdate => {
  if (action === "bold") {
    return applyStyledTransform(value, selectionStart, selectionEnd, boldMap, reverseBoldMap);
  }
  if (action === "italic") {
    return applyStyledTransform(value, selectionStart, selectionEnd, italicMap, reverseItalicMap);
  }
  if (action === "underline") {
    return applyUnderlineTransform(value, selectionStart, selectionEnd);
  }
  return toggleMarkdownWrap(value, selectionStart, selectionEnd, "`");
};

export const insertMarkdownLink = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  href: string,
): TextSelectionUpdate => {
  const start = Math.min(selectionStart, selectionEnd);
  const end = Math.max(selectionStart, selectionEnd);
  const selected = value.slice(start, end).trim();
  const label = selected || "link";
  const insertion = `[${label}](${href})`;
  return {
    nextValue: `${value.slice(0, start)}${insertion}${value.slice(end)}`,
    selectionStart: start + 1,
    selectionEnd: start + 1 + label.length,
  };
};

export const insertAtSelection = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  insertion: string,
): TextSelectionUpdate => {
  const start = Math.min(selectionStart, selectionEnd);
  const end = Math.max(selectionStart, selectionEnd);
  return {
    nextValue: `${value.slice(0, start)}${insertion}${value.slice(end)}`,
    selectionStart: start + insertion.length,
    selectionEnd: start + insertion.length,
  };
};

export const replaceRange = (value: string, rangeStart: number, rangeEnd: number, replacement: string): TextSelectionUpdate => ({
  nextValue: `${value.slice(0, rangeStart)}${replacement}${value.slice(rangeEnd)}`,
  selectionStart: rangeStart + replacement.length,
  selectionEnd: rangeStart + replacement.length,
});

export const getLineRange = (value: string, selectionStart: number, selectionEnd: number) => {
  const start = Math.min(selectionStart, selectionEnd);
  const end = Math.max(selectionStart, selectionEnd);
  const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const lineEndIndex = value.indexOf("\n", end);
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
  return { lineStart, lineEnd };
};

export const applyListPrefix = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
): TextSelectionUpdate => {
  const { lineStart, lineEnd } = getLineRange(value, selectionStart, selectionEnd);
  const lines = value.slice(lineStart, lineEnd).split("\n");
  const replacement = lines
    .map((line) => {
      const trimmed = line.replace(/^\s*(?:-\s+|\[\s\]\s+|\d+\.\s+)/, "");
      return `${prefix}${trimmed}`;
    })
    .join("\n");

  return {
    nextValue: `${value.slice(0, lineStart)}${replacement}${value.slice(lineEnd)}`,
    selectionStart: lineStart,
    selectionEnd: lineStart + replacement.length,
  };
};

export const parseSlashQuery = (value: string, cursor: number): SlashQueryMatch | null => {
  const lineStart = value.lastIndexOf("\n", Math.max(0, cursor - 1)) + 1;
  const beforeCursor = value.slice(lineStart, cursor);
  const match = beforeCursor.match(/(?:^|\s)\/([a-z-]*)$/i);
  if (!match || match.index == null) {
    return null;
  }

  const slashIndex = lineStart + match.index + match[0].lastIndexOf("/");
  return {
    query: match[1] ?? "",
    start: slashIndex,
    end: cursor,
  };
};