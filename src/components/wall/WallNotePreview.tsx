"use client";

import { memo, type CSSProperties, type ReactNode } from "react";

import { formatJournalDateLabel, getNoteTextFontFamily, getNoteTextStyle, truncateNoteText } from "@/components/wall/wall-canvas-helpers";
import { WebBookmarkCard } from "@/components/wall/WebBookmarkCard";
import { readCardColors } from "@/components/wall/wallTimelineViewHelpers";
import { getApodCaption } from "@/features/wall/apod";
import { AUDIO_WAVEFORM_BARS, formatAudioDuration, getAudioNoteMeta, getAudioNoteTitle } from "@/features/wall/audio-notes";
import { getFileNoteMeta, getFileNoteTitle } from "@/features/wall/file-notes";
import { getImageNoteMeta, getImageNoteTitle } from "@/features/wall/image-notes";
import { formatVideoDuration, getVideoNoteMeta, getVideoNoteTitle, getVideoPlayback } from "@/features/wall/video-notes";
import { NOTE_DEFAULTS } from "@/features/wall/constants";
import { EISENHOWER_QUADRANTS, countEisenhowerTasks, normalizeEisenhowerNote } from "@/features/wall/eisenhower";
import { isPrivateNote, privateNoteTitle } from "@/features/wall/private-notes";
import type { Note } from "@/features/wall/types";
import { getApodPlayback } from "@/lib/apod";

type WallNotePreviewProps = {
  note: Note;
  width: number;
  height: number;
  scale: "small" | "medium" | "large";
  tone?: "card" | "detail";
  selected?: boolean;
};

type RendererProps = WallNotePreviewProps & {
  readableText: string;
  mutedText: string;
  softText: string;
  activeBackground: string;
  activeText: string;
  exactTextColor: string;
  textFontFamily: string;
  baseFontSize: number;
  baseLineHeight: number;
  bodyClamp: number;
  quadrantClamp: number;
};

const previewConfig = {
  small: { bodyClamp: 5, quadrantClamp: 2 },
  medium: { bodyClamp: 7, quadrantClamp: 3 },
  large: { bodyClamp: 10, quadrantClamp: 4 },
} as const;

const atelier = {
  paper: "#fffdfa",
  warm: "#fcf9f4",
  wash: "#f6f3ee",
  terracotta: "#a33818",
  forest: "#4d6356",
  gold: "#755717",
  ink: "#1c1c19",
  muted: "#5b463f",
  quiet: "#8b716a",
  line: "rgba(223,192,184,0.6)",
  shadow: "0 18px 42px rgba(28,28,25,0.12)",
  shadowDetail: "0 24px 56px rgba(28,28,25,0.16)",
};

const THRONE_CARD_BACKGROUND = "#35322f";
const THRONE_CARD_TEXT = "#f5f0e8";
const THRONE_CARD_MUTED = "rgba(245,240,232,0.42)";
const THRONE_CARD_RULE = "rgba(245,240,232,0.18)";
const THRONE_CARD_ACCENT = "#a67a10";

const lineClampStyle = (lines: number): CSSProperties => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

const stripWikiLinkMarkup = (text: string) => text.replace(/\[\[([^\]\n]+?)\]\]/g, "$1");

const splitNoteText = (text: string) => stripWikiLinkMarkup(text).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

const splitJokerText = (text: string) => {
  const lines = splitNoteText(text);
  return {
    setup: lines[0] || text.trim() || "Why don't scientists trust atoms?",
    punchline: lines.slice(1).join(" ") || "Because they make up everything!",
  };
};

const getBodyText = (note: Note) => {
  const cleaned = stripWikiLinkMarkup(note.text);
  if (note.vocabulary) {
    return note.vocabulary.flipped
      ? note.vocabulary.meaning?.trim() || "Add meaning in Word Review"
      : note.vocabulary.word?.trim() || "Add word in Word Review";
  }
  if (note.noteKind === "canon") {
    const canon = note.canon;
    if (!canon) {
      return cleaned;
    }
    if (canon.mode === "list") {
      return canon.items
        .filter((item) => item.title.trim() || item.text.trim())
        .map((item, index) => `${index + 1}. ${item.title.trim() || item.text.trim()}`)
        .join("\n") || "Add list items";
    }
    return [canon.statement, canon.interpretation, canon.example].map((value) => value?.trim()).filter(Boolean).join("\n\n") || "Add statement";
  }
  if (note.noteKind === "quote") {
    return cleaned || "Add quote text";
  }
  return cleaned || "Empty note";
};

const looksLikeCode = (text: string) => /(^|\n)\s*(def |const |let |function |class |import |from |<\w)|=>|\{\s*$|console\.|return\s+/m.test(text);
const fileNameMatch = (text: string) => text.match(/([\w-]+\.(pdf|docx?|txt|png|jpe?g|zip|csv|md))/i);

const codeFileNameMatch = (text: string) =>
  text.match(/([\w./-]+\.(?:py|ts|tsx|js|jsx|mjs|cjs|java|rb|go|rs|php|html|css|scss|json|ya?ml|xml|sql|sh|bash|zsh|ps1|psm1|psd1|bat|cmd|toml|ini|env|dockerfile|md|txt))/i);

type CodeLanguage =
  | "plain"
  | "markdown"
  | "javascript"
  | "typescript"
  | "python"
  | "ruby"
  | "go"
  | "rust"
  | "java"
  | "php"
  | "html"
  | "css"
  | "scss"
  | "json"
  | "yaml"
  | "xml"
  | "sql"
  | "bash"
  | "powershell"
  | "batch"
  | "toml";

type CodeSegment = {
  text: string;
  tone: "plain" | "keyword" | "string" | "comment" | "number" | "function" | "variable" | "property" | "command";
};

type ParsedCodeNote = {
  body: string;
  fileName?: string;
  language: CodeLanguage;
  languageLabel: string;
};

const CODE_LANGUAGE_ALIASES: Record<string, string> = {
  plaintext: "plain",
  text: "plain",
  txt: "plain",
  md: "markdown",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  rb: "ruby",
  rs: "rust",
  yml: "yaml",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  ps1: "powershell",
  psm1: "powershell",
  psd1: "powershell",
  cmd: "batch",
};

const CODE_LANGUAGE_LABELS: Record<string, string> = {
  plain: "Plain Text",
  markdown: "Markdown",
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  ruby: "Ruby",
  go: "Go",
  rust: "Rust",
  java: "Java",
  php: "PHP",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  json: "JSON",
  yaml: "YAML",
  xml: "XML",
  sql: "SQL",
  bash: "Bash",
  powershell: "PowerShell",
  batch: "Batch",
  toml: "TOML",
};

const CODE_KEYWORDS = {
  shared: new Set([
    "break", "case", "catch", "class", "const", "continue", "default", "do", "else", "enum", "export", "extends", "false", "finally",
    "for", "from", "function", "if", "import", "in", "let", "new", "null", "return", "static", "super", "switch", "this", "throw",
    "true", "try", "typeof", "undefined", "var", "while", "yield", "async", "await",
  ]),
  python: new Set(["and", "as", "assert", "class", "def", "del", "elif", "except", "False", "finally", "for", "from", "if", "import", "in", "is", "lambda", "None", "nonlocal", "not", "or", "pass", "raise", "return", "True", "try", "while", "with", "yield"]),
  bash: new Set(["if", "then", "else", "elif", "fi", "for", "do", "done", "case", "esac", "function", "in", "while"]),
  powershell: new Set(["function", "param", "if", "else", "elseif", "switch", "foreach", "return", "try", "catch", "finally", "throw", "begin", "process", "end"]),
  sql: new Set(["select", "from", "where", "join", "inner", "left", "right", "full", "outer", "on", "group", "by", "order", "insert", "into", "values", "update", "set", "delete", "create", "table", "view", "as", "and", "or", "limit"]),
};

const normalizeCodeLanguage = (value?: string): CodeLanguage => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return "plain";
  }
  return (CODE_LANGUAGE_ALIASES[normalized] ?? normalized) as CodeLanguage;
};

const inferCodeLanguageFromFileName = (fileName?: string): CodeLanguage | undefined => {
  const lower = fileName?.trim().toLowerCase();
  if (!lower) {
    return undefined;
  }
  if (lower.endsWith(".py")) return "python";
  if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return "typescript";
  if (lower.endsWith(".js") || lower.endsWith(".jsx") || lower.endsWith(".mjs") || lower.endsWith(".cjs")) return "javascript";
  if (lower.endsWith(".sh") || lower.endsWith(".bash") || lower.endsWith(".zsh")) return "bash";
  if (lower.endsWith(".ps1") || lower.endsWith(".psm1") || lower.endsWith(".psd1")) return "powershell";
  if (lower.endsWith(".sql")) return "sql";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".yaml") || lower.endsWith(".yml")) return "yaml";
  if (lower.endsWith(".html")) return "html";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".scss")) return "scss";
  if (lower.endsWith(".go")) return "go";
  if (lower.endsWith(".rs")) return "rust";
  if (lower.endsWith(".java")) return "java";
  if (lower.endsWith(".php")) return "php";
  if (lower.endsWith(".toml")) return "toml";
  if (lower.endsWith(".md")) return "markdown";
  if (lower.endsWith(".bat") || lower.endsWith(".cmd")) return "batch";
  return undefined;
};

const inferCodeLanguage = (body: string, fileName?: string, hintedLanguage?: string): CodeLanguage => {
  const explicit = normalizeCodeLanguage(hintedLanguage);
  if (explicit !== "plain") {
    return explicit;
  }
  const fromFile = inferCodeLanguageFromFileName(fileName);
  if (fromFile) {
    return fromFile;
  }
  const trimmed = body.trim();
  if (trimmed.startsWith("#!/bin/bash") || trimmed.startsWith("#!/usr/bin/env bash") || trimmed.startsWith("$ ") || /\b(Get-ChildItem|Where-Object|Select-String|Invoke-WebRequest|Set-Content)\b/.test(trimmed)) {
    return /\b(Get-ChildItem|Where-Object|Select-String|Invoke-WebRequest|\$env:)\b/.test(trimmed) ? "powershell" : "bash";
  }
  if (/^\s*def\s+\w+\s*\(/m.test(trimmed) || /\b(import|from)\s+\w+/m.test(trimmed)) return "python";
  if (/^\s*(const|let|export|import)\s+/m.test(trimmed) || /=>/.test(trimmed)) return "typescript";
  if (/^\s*SELECT\b/i.test(trimmed) || /\bFROM\b/i.test(trimmed)) return "sql";
  if (/^\s*[\[{]/.test(trimmed)) return "json";
  return "plain";
};

const parseCodeNote = (text: string): ParsedCodeNote => {
  const cleaned = stripWikiLinkMarkup(text).trim();
  const fenced = cleaned.match(/^\`\`\`([^\n`]*)\n([\s\S]*?)\n\`\`\`$/);
  const hintedLanguage = fenced?.[1]?.trim();
  const rawBody = fenced?.[2] ?? cleaned;
  const lines = rawBody.split(/\r?\n/);
  const firstLine = lines[0]?.trim();
  const fileName = codeFileNameMatch(cleaned)?.[1] ?? (firstLine && inferCodeLanguageFromFileName(firstLine) ? firstLine : undefined);
  const body = fileName && firstLine === fileName ? lines.slice(1).join("\n").trim() : rawBody.trim();
  const language = inferCodeLanguage(body, fileName, hintedLanguage);

  return {
    body: body || cleaned || "const idea = \"\";",
    fileName: fileName ?? undefined,
    language,
    languageLabel: CODE_LANGUAGE_LABELS[language] ?? "Code",
  };
};

const tokenizeCodeLine = (line: string, language: CodeLanguage): CodeSegment[] => {
  const patterns = /(#.*$|\/\/.*$|--.*$|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|`(?:\\.|[^`])*`|\$env:[\w]+|\$[\w:.-]+|@[\"']|-[A-Za-z][\w-]*\b|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][\w-]*\s*(?=\()|\b[A-Za-z_][\w-]*\b|[^\sA-Za-z0-9]+)/g;
  const sharedKeywords = CODE_KEYWORDS.shared;
  const languageKeywords =
    language === "python" ? CODE_KEYWORDS.python :
      language === "bash" ? CODE_KEYWORDS.bash :
        language === "powershell" ? CODE_KEYWORDS.powershell :
          language === "sql" ? CODE_KEYWORDS.sql :
            undefined;
  const segments: CodeSegment[] = [];
  let lastIndex = 0;

  for (const match of line.matchAll(patterns)) {
    const token = match[0];
    const start = match.index ?? 0;
    if (start > lastIndex) {
      segments.push({ text: line.slice(lastIndex, start), tone: "plain" });
    }

    let tone: CodeSegment["tone"] = "plain";
    const normalized = token.trim();
    const lower = normalized.toLowerCase();

    if (/^(#|\/\/|--)/.test(normalized)) {
      tone = "comment";
    } else if (/^["'`]/.test(normalized) || /^@["']$/.test(normalized)) {
      tone = "string";
    } else if (/^\$env:|^\$[\w:.-]+/.test(normalized)) {
      tone = "variable";
    } else if (/^-[A-Za-z]/.test(normalized) && (language === "powershell" || language === "bash" || language === "batch")) {
      tone = "property";
    } else if (/^\d/.test(normalized)) {
      tone = "number";
    } else if ((languageKeywords && languageKeywords.has(lower)) || sharedKeywords.has(normalized) || sharedKeywords.has(lower)) {
      tone = "keyword";
    } else if (/^[A-Za-z_][\w-]*$/.test(normalized) && line.slice((match.index ?? 0) + token.length).trimStart().startsWith("(")) {
      tone = "function";
    } else if ((language === "bash" || language === "powershell" || language === "batch") && /^[A-Za-z_][\w-]*$/.test(normalized) && (match.index ?? 0) === line.search(/\S/)) {
      tone = "command";
    }

    segments.push({ text: token, tone });
    lastIndex = start + token.length;
  }

  if (lastIndex < line.length) {
    segments.push({ text: line.slice(lastIndex), tone: "plain" });
  }

  return segments.length > 0 ? segments : [{ text: line, tone: "plain" }];
};
const shellStyle = ({ note, selected, tone }: Pick<WallNotePreviewProps, "note" | "selected" | "tone">): CSSProperties => ({
  width: "100%",
  height: "100%",
  borderRadius: note.noteKind === "economist" ? 18 : note.noteKind === "standard" ? 18 : 16,
  background: note.noteKind === "throne" ? "#31302d" : note.noteKind === "joker" ? "#ffdea5" : note.noteKind === "standard" ? "#ffffff" : atelier.paper,
  boxShadow: note.noteKind === "standard"
    ? tone === "detail"
      ? "0 18px 42px rgba(28,28,25,0.10)"
      : "0 10px 30px rgba(28,28,25,0.06)"
    : tone === "detail"
      ? atelier.shadowDetail
      : atelier.shadow,
  border: selected ? `1.5px solid ${atelier.terracotta}` : `1px solid ${atelier.line}`,
  overflow: "hidden",
  position: "relative",
});

const NoteShell = ({ children, note, width, height, selected, tone }: WallNotePreviewProps & { children: ReactNode }) => (
  <div
    className="relative"
    style={{
      ...shellStyle({ note, selected, tone }),
      width,
      height,
    }}
  >
    {children}
    <div className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.52)" }} />
  </div>
);

const MetaLabel = ({ children, color = atelier.quiet }: { children: ReactNode; color?: string }) => (
  <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color }}>{children}</p>
);

const formatCurrencyDisplayRate = (value: number) => value.toFixed(value >= 1 ? 2 : 4);

const getCurrencyDisplayState = (baseCurrency?: string, usdRate?: number, previousUsdRate?: number) => {
  const safeBaseCurrency = baseCurrency ?? "USD";
  const safeUsdRate = typeof usdRate === "number" && Number.isFinite(usdRate) && usdRate > 0 ? usdRate : 1;
  const displayRate = 1 / safeUsdRate;
  const previousDisplayRate =
    typeof previousUsdRate === "number" && Number.isFinite(previousUsdRate) && previousUsdRate > 0 ? 1 / previousUsdRate : undefined;
  const changePercent = previousDisplayRate
    ? ((displayRate - previousDisplayRate) / previousDisplayRate) * 100
    : 0;

  return {
    pairLabel: `USD / ${safeBaseCurrency}`,
    displayRate,
    quoteLabel: `${safeBaseCurrency} per 1 USD`,
    changePercent,
  };
};

const formatCurrencyChangeBadge = (value: number) => {
  const rounded = Math.round(value * 10) / 10;
  const prefix = rounded > 0 ? "+" : "";
  return `${prefix}${rounded.toFixed(1)}%`;
};

const formatCurrencyUpdatedAgo = (value?: number) => {
  if (!value) {
    return "Updated just now";
  }

  const elapsedMs = Date.now() - value;
  if (elapsedMs < 60_000) {
    return "Updated just now";
  }
  const elapsedMinutes = Math.round(elapsedMs / 60_000);
  if (elapsedMinutes < 60) {
    return `Updated ${elapsedMinutes}m ago`;
  }
  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `Updated ${elapsedHours}h ago`;
  }
  const elapsedDays = Math.round(elapsedHours / 24);
  return `Updated ${elapsedDays}d ago`;
};

const PrivateRenderer = ({ note, width, height, tone }: RendererProps) => (
  <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
    <div
      className="flex h-full flex-col items-center justify-between overflow-hidden rounded-[24px] px-6 py-7 text-center"
      style={{
        background: "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.96), rgba(248,244,236,0.94) 58%, rgba(241,235,225,0.98) 100%)",
      }}
    >
      <div className="absolute inset-[7%] rounded-[28px] border border-[rgba(140,124,114,0.08)]" />
      <div className="relative flex h-full w-full flex-col items-center justify-between">
        <div className="mt-1 flex h-[76px] w-[76px] items-center justify-center rounded-[24px] border border-[rgba(140,124,114,0.12)] bg-[rgba(246,241,234,0.96)] shadow-[0_10px_26px_rgba(28,28,25,0.07)]">
          <div className="relative h-9 w-8">
            <div className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 rounded-t-full border-[5px] border-b-0 border-[rgba(91,70,63,0.92)]" />
            <div className="absolute bottom-0 left-1/2 h-5 w-8 -translate-x-1/2 rounded-[7px] bg-[rgba(91,70,63,0.92)]">
              <div className="absolute left-1/2 top-1.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#f8f4ee]" />
            </div>
          </div>
        </div>
        <div className="mt-6">
          <p className="font-[Newsreader] text-[26px] italic leading-tight" style={{ color: atelier.ink }}>{privateNoteTitle(note)}</p>
          <p className="mt-5 text-[12px] tracking-[0.28em]" style={{ color: "rgba(140,113,106,0.9)" }}>SECURED NODE</p>
        </div>
        <div className="mb-1 mt-7 inline-flex min-h-[42px] min-w-[164px] items-center justify-center rounded-full border border-[rgba(140,124,114,0.34)] bg-[rgba(255,255,255,0.72)] px-8 text-[13px] tracking-[0.26em]" style={{ color: atelier.ink }}>
          DECRYPT
        </div>
      </div>
    </div>
  </NoteShell>
);

const StandardRenderer = ({ note, width, height, readableText, textFontFamily, baseFontSize, bodyClamp, tone }: RendererProps) => {
  const lines = splitNoteText(note.text);
  const title = lines.length > 1 ? lines[0] : lines.length === 1 ? lines[0] : "Quick Thought";
  const bodyText = lines.length > 1 ? lines.slice(1).join("\n") : lines.length === 1 ? "" : "Double-click or press Enter to edit";
  const body = bodyText ? (tone === "detail" ? bodyText : truncateNoteText(bodyText, { ...note, w: width, h: height - 52 }) || bodyText) : "";
  return (
    <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
      <div className="flex h-full flex-col px-[22px] py-[20px]" style={{ background: "#ffffff" }}>
        <p
          style={{
            color: atelier.ink,
            fontFamily: textFontFamily,
            fontSize: 16,
            lineHeight: 1.25,
            fontWeight: 700,
          }}
        >
          {title}
        </p>
        <p
          className="mt-4 whitespace-pre-wrap [overflow-wrap:anywhere]"
          style={{
            ...lineClampStyle(tone === "detail" ? 999 : bodyClamp + 1),
            color: readableText,
            fontFamily: textFontFamily,
            fontSize: Math.max(15, baseFontSize),
            lineHeight: 1.58,
          }}
        >
          {body}
        </p>
      </div>
    </NoteShell>
  );
};

const QuoteRenderer = ({ note, width, height, readableText, mutedText, bodyClamp, tone }: RendererProps) => {
  const author = note.quoteAuthor?.trim();
  const source = note.quoteSource?.trim();
  const quoteFontSize = Math.max(26, Math.min(36, Math.min(width * 0.16, height * 0.19)));

  return (
    <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
      <div className="h-full px-7 pb-7 pt-6" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.98))" }}>
        <p
          className="absolute right-6 top-4 text-[44px] leading-none tracking-[-0.12em]"
          style={{ color: "rgba(163,56,24,0.18)", fontFamily: "\"Newsreader\", serif" }}
        >
          &rdquo;&rdquo;
        </p>
        <blockquote
          className="whitespace-pre-wrap font-[Newsreader] italic [overflow-wrap:anywhere]"
          style={{
            ...lineClampStyle(tone === "detail" ? 999 : bodyClamp + 2),
            color: readableText,
            fontSize: quoteFontSize,
            lineHeight: 1.18,
            paddingTop: 34,
          }}
        >
          {getBodyText(note)}
        </blockquote>
        {(author || source) && (
          <div className="mt-8">
            {author && <cite className="block text-[11px] uppercase tracking-[0.18em] not-italic" style={{ color: mutedText }}>- {author}</cite>}
            {source && <p className="mt-2 text-[10px] uppercase tracking-[0.16em]" style={{ color: "rgba(91,70,63,0.68)" }}>{source}</p>}
          </div>
        )}
      </div>
    </NoteShell>
  );
};

const JournalRenderer = ({ note, width, height, readableText, bodyClamp, tone }: RendererProps) => {
  const lines = splitNoteText(note.text);
  const title = lines[0] || "Dear Wall,";
  const body = lines.slice(1).join("\n") || stripWikiLinkMarkup(note.text) || "Start writing";
  return (
    <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
      <div className="h-full p-6" style={{ background: "linear-gradient(180deg, rgba(246,243,238,0.82), rgba(255,255,255,0.98))" }}>
        <p className="text-[10px] uppercase italic tracking-[0.18em]" style={{ color: "rgba(88,66,60,0.62)", fontFamily: "\"Newsreader\", serif" }}>
          {formatJournalDateLabel(note.createdAt)}
        </p>
        <p className="mt-4 font-[Newsreader] text-[27px] italic leading-[1.02]" style={{ color: atelier.ink }}>{title}</p>
        <p
          className="mt-5 whitespace-pre-wrap font-[Newsreader] text-[18px] leading-[1.58] [overflow-wrap:anywhere]"
          style={{ ...lineClampStyle(tone === "detail" ? 999 : bodyClamp + 1), color: readableText }}
        >
          {body}
        </p>
      </div>
    </NoteShell>
  );
};

const CanonRenderer = ({ note, width, height, readableText, textFontFamily, baseFontSize, baseLineHeight, bodyClamp, tone }: RendererProps) => (
  <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
    <div className="flex h-full flex-col p-4" style={{ background: "linear-gradient(180deg, rgba(117,87,23,0.06), rgba(255,255,255,0.96))" }}>
      <MetaLabel color={atelier.gold}>Canon</MetaLabel>
      {note.canon?.title?.trim() && <p className="mt-2 text-sm font-bold" style={{ color: atelier.ink }}>{note.canon.title.trim()}</p>}
      <p
        className="mt-3 whitespace-pre-wrap [overflow-wrap:anywhere]"
        style={{
          ...lineClampStyle(tone === "detail" ? 999 : bodyClamp + 1),
          color: readableText,
          fontFamily: textFontFamily,
          fontSize: baseFontSize,
          lineHeight: baseLineHeight,
        }}
      >
        {getBodyText(note)}
      </p>
    </div>
  </NoteShell>
);

const VocabularyRenderer = ({ note, width, height, readableText, activeBackground, activeText, tone }: RendererProps) => {
  const isBack = Boolean(note.vocabulary?.flipped);
  return (
    <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
      <div className="flex h-full flex-col justify-between p-5 text-center" style={{ background: "linear-gradient(180deg, rgba(163,56,24,0.06), rgba(255,255,255,0.98))" }}>
        <MetaLabel color={atelier.terracotta}>{isBack ? "Meaning" : "Word"}</MetaLabel>
        <div className="flex-1 content-center">
          <p className="whitespace-pre-wrap font-[Newsreader] text-[28px] italic leading-tight [overflow-wrap:anywhere]" style={{ color: readableText }}>{getBodyText(note)}</p>
        </div>
        <div className="mx-auto rounded-full px-3 py-1 text-[11px] font-semibold" style={{ background: activeBackground, color: activeText }}>{isBack ? "Back" : "Front"}</div>
      </div>
    </NoteShell>
  );
};

const CurrencyRenderer = ({ note, width, height, tone }: Pick<RendererProps, "note" | "width" | "height" | "tone">) => {
  const state = note.currency;
  const display = getCurrencyDisplayState(state?.baseCurrency, state?.usdRate, state?.previousUsdRate);
  const badgeX = Math.max(112, width - 88);
  const chartPath = [
    `M 18 ${136}`,
    `C ${Math.max(34, width * 0.18)} ${132}, ${Math.max(54, width * 0.3)} ${142}, ${Math.max(84, width * 0.42)} ${122}`,
    `S ${Math.max(146, width * 0.72)} ${102}, ${Math.max(208, width - 18)} ${132}`,
  ].join(" ");

  return (
    <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
      <div className="relative h-full" style={{ background: atelier.paper }}>
        <p
          className="absolute"
          style={{
            left: 18,
            top: 18,
            width: Math.max(0, width - 36),
            color: "rgba(140,124,114,0.75)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.08em",
          }}
        >
          CURRENCY PAIR
        </p>

        <p
          className="absolute"
          style={{
            left: 18,
            top: 36,
            width: Math.max(0, width - 128),
            color: atelier.ink,
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {display.pairLabel}
        </p>

        <div
          className="absolute flex items-center justify-center rounded-[6px]"
          style={{
            left: badgeX,
            top: 34,
            width: 52,
            height: 18,
            background: "#DCEEDD",
          }}
        >
          <span style={{ color: atelier.forest, fontSize: 10, fontWeight: 700 }}>
            {formatCurrencyChangeBadge(display.changePercent)}
          </span>
        </div>

        <svg
          aria-hidden
          className="absolute"
          viewBox="0 0 24 24"
          style={{ left: Math.max(18, width - 38), top: 24, width: 26, height: 26 }}
        >
          <path d="M4 16l5-5 4 4 7-8" fill="none" stroke={atelier.forest} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 7h5v5" fill="none" stroke={atelier.forest} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <p
          className="absolute"
          style={{
            left: 18,
            top: 72,
            width: Math.max(92, width - 132),
            color: atelier.ink,
            fontSize: 32,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {formatCurrencyDisplayRate(display.displayRate)}
        </p>

        <p
          className="absolute"
          style={{
            left: Math.min(width - 132, 112),
            top: 85,
            width: Math.max(0, width - 130),
            color: atelier.muted,
            fontSize: 11,
            lineHeight: 1.1,
          }}
        >
          {display.quoteLabel}
        </p>

        <svg aria-hidden className="absolute inset-x-0" style={{ top: 96, height: 64, width: "100%" }}>
          <path d={chartPath} fill="none" stroke="#D5DBD7" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <p
          className="absolute"
          style={{
            left: 18,
            top: Math.max(18, height - 28),
            width: Math.max(0, width - 142),
            color: "rgba(140,124,114,0.72)",
            fontSize: 9,
            letterSpacing: "0.03em",
          }}
        >
          {state?.rateSource === "default" ? "SOURCE: DEFAULT RATE" : "SOURCE: CURRENCY API"}
        </p>

        <p
          className="absolute text-right"
          style={{
            left: Math.max(112, width - 116),
            top: Math.max(18, height - 28),
            width: 98,
            color: "rgba(140,124,114,0.72)",
            fontSize: 9,
          }}
        >
          {formatCurrencyUpdatedAgo(state?.rateUpdatedAt)}
        </p>
      </div>
    </NoteShell>
  );
};

const WebBookmarkRenderer = ({ note, width, height, tone }: Pick<RendererProps, "note" | "width" | "height" | "tone">) => (
  <div style={{ width, height }}>
    <WebBookmarkCard note={note} tone={tone} />
  </div>
);

const ImageRenderer = ({ note, width, height, tone }: RendererProps) => {
  const title = getImageNoteTitle(note.file);
  const meta = getImageNoteMeta(note.file);
  const caption = note.text.trim();
  return (
    <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
      <div className="flex h-full flex-col bg-[linear-gradient(180deg,#fffdfa_0%,#fbf7f1_100%)] px-5 pb-6 pt-5">
        {meta ? <MetaLabel>{meta}</MetaLabel> : null}
        <div className="mt-3 min-h-0 flex-1 overflow-hidden rounded-[6px] bg-[#ece6df] shadow-[0_12px_28px_rgba(28,28,25,0.08)]">
          {note.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={note.imageUrl} alt={caption || title} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-[11px]" style={{ color: atelier.quiet }}>No image</div>
          )}
        </div>
        {caption ? <p className="mt-5 text-center font-[Newsreader] text-[clamp(20px,3.2vw,28px)] italic leading-[1.18]" style={{ color: "rgba(70,63,58,0.82)" }}>{caption}</p> : null}
      </div>
    </NoteShell>
  );
};

const ApodRenderer = ({ note, width, height, readableText, mutedText, bodyClamp, tone }: RendererProps) => {
  const caption = getApodCaption(note);
  const playback = getApodPlayback(note.apod);
  const isVideo = note.apod?.mediaType === "video";
  return (
    <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="relative aspect-video bg-[#31302d]">
          {isVideo && playback?.kind === "direct" ? (
            <video src={playback.url} poster={note.imageUrl} className="h-full w-full object-cover opacity-85" controls muted loop playsInline preload="metadata" />
          ) : isVideo && playback?.kind === "embed" ? (
            <iframe
              src={playback.url}
              title={note.apod?.title || "NASA APOD video"}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : note.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={note.imageUrl} alt={note.apod?.title || "NASA APOD"} className="h-full w-full object-cover opacity-85" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-[11px] text-white/80">{note.apod?.error || "Loading APOD"}</div>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/18 text-3xl text-white backdrop-blur-md">▶</div>
          </div>
          <div className="absolute bottom-0 left-0 h-1.5 w-full bg-white/18"><div className="h-full w-1/3" style={{ background: atelier.terracotta }} /></div>
        </div>
        <div className="flex flex-1 flex-col p-4" style={{ background: atelier.paper }}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold" style={{ color: atelier.ink }}>{note.apod?.title || "Fluid Dynamics Study v02"}</p>
            <span className="text-[10px] uppercase tracking-[0.16em]" style={{ color: atelier.quiet }}>{note.apod?.date || "media"}</span>
          </div>
          {caption && <p className="mt-3 text-sm leading-6" style={{ ...lineClampStyle(tone === "detail" ? 999 : bodyClamp), color: readableText }}>{caption}</p>}
          <div className="mt-auto pt-4 text-[10px] uppercase tracking-[0.18em]" style={{ color: mutedText }}>Source: Multimedia API</div>
        </div>
      </div>
    </NoteShell>
  );
};

const PoetryRenderer = ({ note, width, height, readableText, bodyClamp, tone }: RendererProps) => (
  <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
    <div className="flex h-full flex-col px-6 pb-5 pt-5" style={{ background: "linear-gradient(180deg, rgba(246,243,238,0.62), rgba(255,255,255,0.98))" }}>
      <div className="text-center">
        <MetaLabel color="rgba(139,113,106,0.46)">Source: Poetry API</MetaLabel>
      </div>
      <div className="flex flex-1 items-center justify-center px-1">
        <p
          className="w-full whitespace-pre-wrap font-[Newsreader] text-[18px] italic leading-[1.58] [overflow-wrap:anywhere]"
          style={{ ...lineClampStyle(tone === "detail" ? 999 : bodyClamp + 6), color: readableText, textAlign: "center" }}
        >
          {note.text.trim() || note.poetry?.error || "Loading poem..."}
        </p>
      </div>
      <div className="mt-3 border-t pt-4" style={{ borderColor: "rgba(223,192,184,0.3)" }}>
        <p className="text-center text-[18px] font-medium" style={{ color: "rgba(196,118,95,0.92)", fontFamily: "\"Manrope\", sans-serif" }}>
          {note.poetry?.author?.trim() || note.quoteAuthor?.trim() || "Unknown Poet"}
        </p>
      </div>
    </div>
  </NoteShell>
);

const EisenhowerRenderer = ({ note, width, height, readableText, mutedText, softText, quadrantClamp, tone }: RendererProps) => {
  const matrix = normalizeEisenhowerNote(note.eisenhower, note.createdAt);
  return (
    <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
      <div className="h-full p-4" style={{ background: "linear-gradient(180deg, rgba(246,243,238,0.74), rgba(255,255,255,0.98))" }}>
        <div className="grid h-full grid-cols-2 grid-rows-[auto_1fr_1fr] gap-3">
          <div className="col-span-2 flex items-start justify-between gap-3">
            <MetaLabel>{matrix.displayDate}</MetaLabel>
            <MetaLabel color={atelier.forest}>Eisenhower</MetaLabel>
          </div>
          {EISENHOWER_QUADRANTS.map((quadrant) => {
            const current = matrix.quadrants[quadrant.key];
            const taskCount = countEisenhowerTasks(current.content);
            return (
              <div key={quadrant.key} className="rounded-[14px] p-3" style={{ background: quadrant.tint, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35)" }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: quadrant.key === "doFirst" ? atelier.terracotta : quadrant.key === "schedule" ? atelier.forest : quadrant.key === "delegate" ? atelier.gold : atelier.muted }}>{current.title || quadrant.title}</p>
                  <span className="text-[10px] font-semibold" style={{ color: mutedText }}>{taskCount}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[11px] leading-[1.35] [overflow-wrap:anywhere]" style={{ ...lineClampStyle(tone === "detail" ? 999 : quadrantClamp), color: current.content.trim() ? readableText : softText }}>{current.content.trim() || quadrant.placeholder}</p>
              </div>
            );
          })}
        </div>
      </div>
    </NoteShell>
  );
};

const JokerRenderer = ({ note, width, height, tone }: RendererProps) => {
  const { setup, punchline } = splitJokerText(note.text);
  return (
    <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
      <div className="relative h-full overflow-hidden px-5 pb-5 pt-4" style={{ background: "#ffdea5" }}>
        <svg
          className="pointer-events-none absolute right-2 top-1 h-[54px] w-[54px] opacity-[0.22]"
          viewBox="0 0 64 64"
          aria-hidden
        >
          <path d="M14 18l8-8 8 8" fill="none" stroke="rgba(117,87,23,0.55)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M42 18l8-8 8 8" fill="none" stroke="rgba(117,87,23,0.55)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 34c5 12 15 18 20 18s15-6 20-18" fill="rgba(117,87,23,0.42)" />
        </svg>
        <MetaLabel color="rgba(93,66,1,0.72)">Source: Jokes API</MetaLabel>
        <p
          className="relative z-10 mt-5"
          style={{
            ...lineClampStyle(tone === "detail" ? 999 : 3),
            color: "#261900",
            fontSize: 16,
            lineHeight: 1.65,
            fontWeight: 500,
          }}
        >
          {setup}
        </p>
        <p
          className="relative z-10 mt-4 border-t pt-4"
          style={{
            ...lineClampStyle(tone === "detail" ? 999 : 3),
            borderColor: "rgba(38,25,0,0.10)",
            color: "rgba(38,25,0,0.92)",
            fontSize: 18,
            lineHeight: 1.55,
            fontWeight: 800,
          }}
        >
          {punchline}
        </p>
      </div>
    </NoteShell>
  );
};

const ThroneRenderer = ({ note, width, height, tone }: RendererProps) => {
  const throneText = stripWikiLinkMarkup(note.text);
  const throneDisplayText = throneText === "Summoning a line from Westeros..."
    ? throneText
    : `“${throneText || "A mind needs books as a sword needs a whetstone, if it is to keep its edge."}”`;

  return (
    <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
      <div className="relative h-full px-5 pb-5 pt-6" style={{ background: THRONE_CARD_BACKGROUND, color: THRONE_CARD_TEXT }}>
        <div
          className="absolute right-5 top-4 h-6 w-[18px]"
          style={{
            background: THRONE_CARD_ACCENT,
            clipPath: "polygon(50% 0%, 100% 16%, 100% 62%, 50% 100%, 0% 62%, 0% 16%)",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.18))",
          }}
        />
        <MetaLabel color={THRONE_CARD_MUTED}>Source: GoT API</MetaLabel>
        <p
          className="mt-7 whitespace-pre-wrap font-[Cormorant_Garamond] text-[31px] italic leading-[1.3] [overflow-wrap:anywhere]"
          style={{ ...lineClampStyle(tone === "detail" ? 999 : 5), color: THRONE_CARD_TEXT }}
        >
          {throneDisplayText}
        </p>
        <div className="absolute bottom-8 left-5 right-5 flex items-center gap-3 text-center text-[13px]" style={{ color: "rgba(245,240,232,0.74)" }}>
          <div className="h-px flex-1" style={{ background: THRONE_CARD_RULE }} />
          <span className="font-[Cormorant_Garamond] text-[21px] leading-none">{note.quoteAuthor?.trim() || "Tyrion Lannister"}</span>
          <div className="h-px flex-1" style={{ background: THRONE_CARD_RULE }} />
        </div>
      </div>
    </NoteShell>
  );
};

const EconomistRenderer = ({ note, width, height, tone }: RendererProps) => {
  const lines = splitNoteText(note.text);
  const masthead = lines[0] || "Magazine";
  const subhead = note.economist?.mainStory?.trim() || "The Infinite Canvas: A New Era of Spatial Thinking";
  return (
    <div className="relative" style={{ width, height }}>
      <div className="absolute inset-0 translate-x-3 rotate-[6deg] rounded-[16px] bg-[#ebe8e3] shadow-[0_12px_28px_rgba(28,28,25,0.12)]" />
      <div className="absolute inset-0 -translate-x-1 rotate-[-3deg] rounded-[16px] bg-[#f6f3ee] shadow-[0_16px_34px_rgba(28,28,25,0.14)]" />
      <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
        <div className="flex h-full flex-col">
          <div className="relative h-[68%] bg-[#ddd6ce]">
            {note.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={note.imageUrl} alt={masthead} className="h-full w-full object-cover" loading="lazy" />
            ) : null}
          </div>
          <div className="flex flex-1 flex-col justify-between p-4" style={{ background: atelier.paper }}>
            <div>
              <p className="text-[15px] font-bold leading-tight" style={{ color: atelier.ink }}>{subhead}</p>
            </div>
            <div>
              <p className="font-[Newsreader] text-[20px] font-black uppercase leading-none" style={{ color: atelier.ink }}>{masthead}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.16em]" style={{ color: atelier.quiet }}>Source: Magazine API</p>
            </div>
          </div>
        </div>
      </NoteShell>
    </div>
  );
};
const CodeRenderer = ({ note, width, height, tone }: RendererProps) => {
  const parsed = parseCodeNote(note.text);
  const lines = parsed.body.split("\n").slice(0, tone === "detail" ? undefined : 9);
  const tokenColorByTone: Record<CodeSegment["tone"], string> = {
    plain: "#d4d4d4",
    keyword: "#c586c0",
    string: "#ce9178",
    comment: "#6a9955",
    number: "#b5cea8",
    function: "#dcdcaa",
    variable: "#9cdcfe",
    property: "#7fc7ff",
    command: "#4fc1ff",
  };

  return (
    <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
      <div
        className="h-full overflow-hidden rounded-[inherit] text-[#d4d4d4]"
        style={{
          background: "linear-gradient(180deg, #1f1f21 0%, #1b1b1d 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <div className="flex gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
            <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
            <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/34">
              {parsed.languageLabel}
            </span>
            <span className="text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-white/44">
              {parsed.fileName ?? "snippet"}
            </span>
            <span
              aria-hidden
              className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.04] text-[11px] text-white/28"
            >
              ▣
            </span>
          </div>
        </div>
        <pre
          className="m-0 h-[calc(100%-52px)] overflow-hidden px-5 pb-5 text-[11px] leading-[1.75]"
          style={{ fontFamily: "\"JetBrains Mono\", \"Fira Code\", monospace" }}
        >
          <code>
            {lines.map((line, lineIndex) => (
              <div key={`${note.id}-code-line-${lineIndex}`} className="whitespace-pre-wrap break-words">
                {tokenizeCodeLine(line, parsed.language).map((segment, segmentIndex) => (
                  <span key={`${note.id}-code-line-${lineIndex}-segment-${segmentIndex}`} style={{ color: tokenColorByTone[segment.tone] }}>
                    {segment.text}
                  </span>
                ))}
              </div>
            ))}
          </code>
        </pre>
      </div>
    </NoteShell>
  );
};

const FileRenderer = ({ note, width, height, tone }: RendererProps) => {
  const text = stripWikiLinkMarkup(note.text);
  const match = fileNameMatch(text);
  const file = note.noteKind === "file" ? getFileNoteTitle(note.file) : match?.[1] ?? "Document";
  const meta = note.noteKind === "file" ? getFileNoteMeta(note.file) : text.replace(file, "").trim() || "File note";
  return (
    <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
      <div className="flex h-full items-center gap-4 p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-[14px]" style={{ background: "rgba(163,56,24,0.10)", color: atelier.terracotta }}>▤</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold" style={{ color: atelier.ink }}>{file}</p>
          <p className="mt-1 truncate text-[11px] uppercase tracking-[0.14em]" style={{ color: atelier.quiet }}>{meta}</p>
        </div>
        <div className="text-lg" style={{ color: "rgba(139,113,106,0.68)" }}>↓</div>
      </div>
    </NoteShell>
  );
};

const AudioRenderer = ({ note, width, height, tone }: RendererProps) => {
  const audio = note.audio;
  const title = getAudioNoteTitle(audio);
  const meta = getAudioNoteMeta(audio);
  const duration = formatAudioDuration(audio?.durationSeconds);
  const progress = audio?.durationSeconds ? formatAudioDuration(Math.max(0, Math.min(audio.durationSeconds, Math.round(audio.durationSeconds * 0.35)))) : "00:00";
  return (
    <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
      <div className="flex h-full flex-col px-7 pb-7 pt-6" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(252,249,244,0.98))" }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[16px]" style={{ background: "rgba(77,99,86,0.10)", color: atelier.forest }}>♪</div>
          <div className="flex items-center gap-2 text-[18px]" style={{ color: "rgba(139,113,106,0.84)" }}>
            <span>↓</span>
            <span>↗</span>
          </div>
        </div>
        <div className="mt-7">
          <p className="font-[Newsreader] text-[clamp(26px,5vw,34px)] italic leading-[1.08]" style={{ color: atelier.ink }}>{title}</p>
          {meta ? <p className="mt-2 text-[11px] uppercase tracking-[0.16em]" style={{ color: atelier.quiet }}>{meta}</p> : null}
        </div>
        <div className="mt-auto pt-8">
          <div className="flex h-[72px] items-center gap-2">
            {AUDIO_WAVEFORM_BARS.map((value, index) => {
              const active = index >= 2 && index <= 6;
              return (
                <div
                  key={`${note.id}-audio-bar-${index}`}
                  className="flex-1 rounded-full"
                  style={{
                    height: `${Math.max(18, Math.round(58 * value))}px`,
                    background: active ? atelier.terracotta : "rgba(223,192,184,0.34)",
                    opacity: active ? 1 : index < 2 ? 0.42 : 0.54,
                  }}
                />
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between text-[13px] uppercase tracking-[0.2em]" style={{ color: atelier.quiet }}>
            <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{progress}</span>
            <span style={{ color: 'rgba(163,56,24,0.68)', fontWeight: 700 }}>Playing</span>
            <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{duration}</span>
          </div>
        </div>
      </div>
    </NoteShell>
  );
};

const VideoRenderer = ({ note, width, height, tone }: RendererProps) => {
  const video = note.video;
  const title = getVideoNoteTitle(video);
  const meta = getVideoNoteMeta(video);
  const duration = formatVideoDuration(video?.durationSeconds);
  const progress = formatVideoDuration(video?.durationSeconds ? Math.max(0, Math.round(video.durationSeconds * 0.35)) : 0);
  const playback = getVideoPlayback(video);

  return (
    <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
      <div className="flex h-full flex-col overflow-hidden" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(252,249,244,0.98))" }}>
        <div className="relative aspect-[16/9] overflow-hidden rounded-b-[8px]" style={{ background: "linear-gradient(140deg, rgba(56,37,33,1) 0%, rgba(124,68,52,0.94) 42%, rgba(29,26,24,1) 100%)" }}>
          {playback?.kind === "direct" ? (
            <video src={playback.url} poster={video?.posterDataUrl} className="h-full w-full object-cover" controls muted playsInline preload="metadata" />
          ) : playback?.kind === "embed" ? (
            <iframe
              src={playback.url}
              title={title}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : video?.posterDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={video.posterDataUrl} alt={title} className="h-full w-full object-cover" loading="lazy" />
          ) : null}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.24))]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#a33818] text-[34px] text-white shadow-[0_16px_30px_rgba(0,0,0,0.24)]">▶</div>
          </div>
          <div className="absolute inset-x-5 bottom-4 flex items-center gap-4 text-[13px] uppercase tracking-[0.18em] text-white/88">
            <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{progress}</span>
            <div className="h-1.5 flex-1 rounded-full bg-white/22"><div className="h-full w-[36%] rounded-full" style={{ background: atelier.terracotta }} /></div>
            <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{duration}</span>
          </div>
        </div>
        <div className="flex flex-1 items-start gap-3 px-5 pb-5 pt-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-[Newsreader] text-[clamp(24px,4.4vw,34px)] italic leading-[1.02]" style={{ color: atelier.ink }}>{title}</p>
            {meta ? <p className="mt-2 truncate text-[11px] uppercase tracking-[0.18em]" style={{ color: atelier.quiet }}>{meta}</p> : null}
          </div>
          <div className="flex items-center gap-2 pt-2 text-[18px]" style={{ color: "rgba(91,70,63,0.8)" }}>
            <span>↓</span>
            <span>↗</span>
          </div>
        </div>
      </div>
    </NoteShell>
  );
};

const FallbackRenderer = ({ note, width, height, readableText, mutedText, textFontFamily, bodyClamp, tone }: RendererProps) => (
  <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
    <div className="flex h-full flex-col p-4">
      <MetaLabel color={mutedText}>Unknown note type</MetaLabel>
      <p className="mt-3 whitespace-pre-wrap [overflow-wrap:anywhere]" style={{ ...lineClampStyle(tone === "detail" ? 999 : bodyClamp), color: readableText, fontFamily: textFontFamily }}>{stripWikiLinkMarkup(note.text) || "No preview available"}</p>
    </div>
  </NoteShell>
);

type NoteRenderer = (props: RendererProps) => ReactNode;

const noteRenderers: Record<string, NoteRenderer> = {
  private: PrivateRenderer,
  standard: StandardRenderer,
  quote: QuoteRenderer,
  canon: CanonRenderer,
  journal: JournalRenderer,
  eisenhower: EisenhowerRenderer,
  currency: CurrencyRenderer,
  "web-bookmark": WebBookmarkRenderer,
  apod: ApodRenderer,
  poetry: PoetryRenderer,
  image: ImageRenderer,
  vocabulary: VocabularyRenderer,
  joker: JokerRenderer,
  throne: ThroneRenderer,
  economist: EconomistRenderer,
  code: CodeRenderer,
  file: FileRenderer,
  audio: AudioRenderer,
  video: VideoRenderer,
  fallback: FallbackRenderer,
};

const resolveRendererKey = (note: Note) => {
  if (isPrivateNote(note)) {
    return "private";
  }
  if (note.noteKind === "apod") {
    return "apod";
  }
  if (note.noteKind === "poetry") {
    return "poetry";
  }
  if (note.noteKind === "joker") {
    return "joker";
  }
  if (note.noteKind === "throne") {
    return "throne";
  }
  if (note.noteKind === "economist") {
    return "economist";
  }
  if (note.imageUrl?.trim()) {
    return "image";
  }
  if (note.vocabulary) {
    return "vocabulary";
  }
  const cleaned = stripWikiLinkMarkup(note.text);
  if ((!note.noteKind || note.noteKind === "standard") && (/^\`\`\`[\w-]*\n[\s\S]*\n\`\`\`$/.test(cleaned.trim()) || looksLikeCode(cleaned) || Boolean(codeFileNameMatch(cleaned)))) {
    return "code";
  }
  if (note.noteKind === "file") {
    return "file";
  }
  if (note.noteKind === "audio") {
    return "audio";
  }
  if (note.noteKind === "video") {
    return "video";
  }
  if (!note.noteKind && fileNameMatch(cleaned)) {
    return "file";
  }
  if (note.noteKind && note.noteKind in noteRenderers) {
    return note.noteKind;
  }
  return note.noteKind ? "fallback" : "standard";
};

export const WallNotePreview = memo(function WallNotePreview({ note, width, height, scale, tone = "card", selected = false }: WallNotePreviewProps) {
  const colors = readCardColors(note);
  const textStyle = getNoteTextStyle(note.textSize, note.textSizePx);
  const config = previewConfig[scale];
  const renderNote = (noteRenderers[resolveRendererKey(note)] ?? noteRenderers.fallback) as NoteRenderer;

  return (
    <div className="relative" data-note-kind={note.noteKind ?? "standard"}>
      {selected && <div className="pointer-events-none absolute -inset-1 rounded-[24px] border border-[#a33818] opacity-80" />}
      {renderNote({
        note,
        width,
        height,
        scale,
        tone,
        selected,
        readableText: colors.readableText || note.textColor || NOTE_DEFAULTS.textColor,
        mutedText: colors.mutedText,
        softText: colors.softText,
        activeBackground: colors.activeBackground,
        activeText: colors.activeText,
        exactTextColor: note.textColor || NOTE_DEFAULTS.textColor,
        textFontFamily: getNoteTextFontFamily(note.textFont),
        baseFontSize: textStyle.fontSize,
        baseLineHeight: textStyle.lineHeight,
        bodyClamp: config.bodyClamp,
        quadrantClamp: config.quadrantClamp,
      })}
    </div>
  );
});

