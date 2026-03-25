"use client";

import { memo, type CSSProperties, type ReactNode } from "react";

import { formatJournalDateLabel, getNoteTextFontFamily, getNoteTextStyle, truncateNoteText } from "@/components/wall/wall-canvas-helpers";
import { WebBookmarkCard } from "@/components/wall/WebBookmarkCard";
import { readCardColors } from "@/components/wall/wallTimelineViewHelpers";
import { getApodCaption } from "@/features/wall/apod";
import { NOTE_DEFAULTS } from "@/features/wall/constants";
import { parseCurrencyAmountInput } from "@/features/wall/currency";
import { EISENHOWER_QUADRANTS, countEisenhowerTasks, normalizeEisenhowerNote } from "@/features/wall/eisenhower";
import { getPoetryTitle } from "@/features/wall/poetry";
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

const shellStyle = ({ note, selected, tone }: Pick<WallNotePreviewProps, "note" | "selected" | "tone">): CSSProperties => ({
  width: "100%",
  height: "100%",
  borderRadius: note.noteKind === "economist" ? 18 : 16,
  background: note.noteKind === "throne" ? "#31302d" : note.noteKind === "joker" ? "#ffdea5" : atelier.paper,
  boxShadow: tone === "detail" ? atelier.shadowDetail : atelier.shadow,
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

const PrivateRenderer = ({ note, width, height, activeBackground, activeText, mutedText, tone }: RendererProps) => (
  <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
    <div className="flex h-full flex-col justify-between p-5" style={{ background: "linear-gradient(180deg, rgba(77,99,86,0.06), rgba(252,249,244,0.94))" }}>
      <div>
        <MetaLabel color={atelier.forest}>Protected</MetaLabel>
        <p className="mt-3 font-[Newsreader] text-[26px] italic leading-tight" style={{ color: atelier.ink }}>{privateNoteTitle(note)}</p>
        <p className="mt-3 text-sm leading-6" style={{ color: mutedText }}>Content stays hidden on the wall, timeline previews, and standard exports.</p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full px-3 py-1 text-[11px] font-semibold" style={{ background: activeBackground, color: activeText }}>Passphrase required</span>
        <span className="text-[11px]" style={{ color: mutedText }}>Locked shell</span>
      </div>
    </div>
  </NoteShell>
);

const StandardRenderer = ({ note, width, height, readableText, textFontFamily, baseFontSize, baseLineHeight, bodyClamp, tone }: RendererProps) => {
  const lines = splitNoteText(note.text);
  const title = lines.length > 1 ? lines[0] : "Quick Thought";
  const bodyText = lines.length > 1 ? lines.slice(1).join("\n") : stripWikiLinkMarkup(note.text) || "Double-click or press Enter to edit";
  const body = tone === "detail" ? bodyText : truncateNoteText(bodyText, { ...note, w: width, h: height - 52 }) || bodyText;
  return (
    <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
      <div className="flex h-full flex-col p-4" style={{ background: "linear-gradient(180deg, rgba(246,243,238,0.62), rgba(255,255,255,0.94))" }}>
        <p className="text-base font-bold" style={{ color: atelier.ink }}>{title}</p>
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
  const converted = parseCurrencyAmountInput(state?.amountInput) * (state?.usdRate ?? 1);
  const trend = state?.trend === "up" ? "+" : state?.trend === "down" ? "-" : "=";
  return (
    <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
      <div className="h-full p-5" style={{ background: "linear-gradient(180deg, rgba(246,243,238,0.84), rgba(255,255,255,0.98))" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <MetaLabel>Currency Pair</MetaLabel>
            <p className="mt-2 text-[24px] font-bold leading-none" style={{ color: atelier.ink }}>{state?.baseCurrency ?? "USD"} / USD</p>
          </div>
          <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ background: "rgba(77,99,86,0.12)", color: atelier.forest }}>{trend} {state?.trend ?? "flat"}</span>
        </div>
        <div className="mt-5 flex items-end gap-2">
          <span className="text-[34px] font-black leading-none" style={{ color: atelier.ink }}>{(state?.usdRate ?? 1).toFixed((state?.usdRate ?? 1) >= 1 ? 2 : 4)}</span>
          <span className="pb-1 text-sm" style={{ color: atelier.quiet }}>USD per 1 {state?.baseCurrency ?? "USD"}</span>
        </div>
        <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="mt-4 h-12 w-full" aria-hidden>
          <path d="M0,15 Q10,12 20,16 T40,10 T60,14 T80,8 T100,12" fill="none" stroke="#4d6356" strokeWidth="2" opacity="0.55" />
          <path d="M0,15 Q10,12 20,16 T40,10 T60,14 T80,8 T100,12 L100,20 L0,20 Z" fill="#4d6356" opacity="0.12" />
        </svg>
        <p className="mt-3 text-xs" style={{ color: atelier.muted }}>{state?.amountInput ?? "0"} {state?.baseCurrency ?? "USD"} {"->"} {converted.toFixed(2)} USD</p>
        <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.16em]" style={{ color: atelier.quiet }}>
          <span>Source: {state?.rateSource ?? "default"}</span>
          <span>{state?.detectedCountryName ?? "Fallback"}</span>
        </div>
      </div>
    </NoteShell>
  );
};

const WebBookmarkRenderer = ({ note, width, height, tone }: Pick<RendererProps, "note" | "width" | "height" | "tone">) => (
  <div style={{ width, height }}>
    <WebBookmarkCard note={note} tone={tone} />
  </div>
);

const ImageRenderer = ({ note, width, height, tone }: RendererProps) => (
  <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
    <div className="flex h-full flex-col p-3">
      <div className="min-h-0 flex-1 overflow-hidden rounded-[12px] bg-[#ebe8e3]">
        {note.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={note.imageUrl} alt="" className="h-full w-full object-cover grayscale transition-all duration-700 hover:grayscale-0" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-[11px]" style={{ color: atelier.quiet }}>No image</div>
        )}
      </div>
      {note.text.trim() && <p className="mt-4 text-center font-[Newsreader] text-lg italic" style={{ color: "rgba(28,28,25,0.72)" }}>{note.text.trim()}</p>}
    </div>
  </NoteShell>
);

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

const PoetryRenderer = ({ note, width, height, readableText, mutedText, bodyClamp, tone }: RendererProps) => (
  <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
    <div className="flex h-full flex-col items-center p-5 text-center" style={{ background: "linear-gradient(180deg, rgba(246,243,238,0.58), rgba(255,255,255,0.98))" }}>
      <MetaLabel color={atelier.quiet}>Source: Poetry API</MetaLabel>
      <p className="mt-5 font-[Newsreader] text-[22px] font-semibold italic leading-tight" style={{ color: atelier.ink }}>{getPoetryTitle(note)}</p>
      <p className="mt-2 text-[11px] italic" style={{ color: mutedText }}>{note.poetry?.author?.trim() || note.quoteAuthor?.trim() || "Unknown Poet"}</p>
      <p className="mt-5 whitespace-pre-wrap font-[Newsreader] text-[18px] italic leading-[1.5] [overflow-wrap:anywhere]" style={{ ...lineClampStyle(tone === "detail" ? 999 : bodyClamp + 2), color: readableText }}>{note.text.trim() || note.poetry?.error || "Loading poem..."}</p>
      <div className="mt-auto w-20 border-t pt-4 text-[10px] uppercase tracking-[0.18em]" style={{ borderColor: "rgba(163,56,24,0.12)", color: "rgba(163,56,24,0.68)" }}>{note.poetry?.author?.trim() || "PoetryDB"}</div>
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
  const text = stripWikiLinkMarkup(note.text);
  const match = fileNameMatch(text);
  return (
    <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
      <div className="h-full overflow-hidden rounded-[inherit] bg-[#1e1e1e] text-[#d4d4d4]">
        <div className="flex items-center justify-between px-4 py-3" style={{ background: "#252526" }}>
          <div className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" /><span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" /></div>
          <div className="text-right text-[10px] uppercase tracking-[0.16em] text-white/40">{match?.[1] ?? "main.py"}</div>
        </div>
        <pre className="m-0 h-[calc(100%-44px)] overflow-hidden px-4 py-4 text-[11px] leading-5" style={{ fontFamily: "JetBrains Mono, monospace" }}><code>{text}</code></pre>
      </div>
    </NoteShell>
  );
};

const FileRenderer = ({ note, width, height, tone }: RendererProps) => {
  const text = stripWikiLinkMarkup(note.text);
  const match = fileNameMatch(text);
  const file = match?.[1] ?? "Document";
  const meta = text.replace(file, "").trim() || "File note";
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
  if (!note.noteKind && looksLikeCode(cleaned)) {
    return "code";
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


