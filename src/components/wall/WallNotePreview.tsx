"use client";

import { memo, type CSSProperties, type ReactNode } from "react";

import { formatJournalDateLabel, getNoteTextFontFamily, getNoteTextStyle, truncateNoteText } from "@/components/wall/wall-canvas-helpers";
import { WebBookmarkCard } from "@/components/wall/WebBookmarkCard";
import { parseCurrencyAmountInput } from "@/features/wall/currency";
import { readCardColors } from "@/components/wall/wallTimelineViewHelpers";
import { NOTE_DEFAULTS } from "@/features/wall/constants";
import { EISENHOWER_QUADRANTS, countEisenhowerTasks, normalizeEisenhowerNote } from "@/features/wall/eisenhower";
import type { Note } from "@/features/wall/types";

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
  small: { bodyClamp: 5, quadrantClamp: 2, footerClamp: 2 },
  medium: { bodyClamp: 7, quadrantClamp: 3, footerClamp: 3 },
  large: { bodyClamp: 10, quadrantClamp: 4, footerClamp: 5 },
} as const;

const journalClipPath = "polygon(10px 0%, calc(100% - 18px) 0%, 100% 14px, calc(100% - 5px) calc(100% - 16px), calc(100% - 24px) 100%, 20px 100%, 0% calc(100% - 12px), 0% 10px)";
const journalBackground = "linear-gradient(90deg, rgba(226,141,141,0.42) 0 1px, transparent 1px 44px, rgba(226,141,141,0.42) 44px 45px, transparent 45px), repeating-linear-gradient(180deg, rgba(233,233,233,0.92) 0 1px, transparent 1px 31px), #ffffff";

const stripWikiLinkMarkup = (text: string) => text.replace(/\[\[([^\]\n]+?)\]\]/g, "$1");

const lineClampStyle = (lines: number): CSSProperties => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

const shellStyle = ({ note, selected, tone }: Pick<WallNotePreviewProps, "note" | "selected" | "tone">): CSSProperties => ({
  background: note.noteKind === "journal" ? journalBackground : note.color,
  borderRadius: note.noteKind === "journal" ? 20 : note.noteKind === "eisenhower" ? 18 : 16,
  border: selected ? "1.5px solid var(--timeline-selection)" : "1px solid var(--timeline-note-border)",
  boxShadow: tone === "detail"
    ? selected
      ? "0 0 0 1px var(--timeline-selection), 0 24px 64px rgba(0,0,0,0.22)"
      : "0 24px 64px rgba(0,0,0,0.18)"
    : selected
      ? "0 0 0 1px var(--timeline-selection), 0 16px 38px rgba(0,0,0,0.18)"
      : "0 12px 28px rgba(0,0,0,0.12)",
  clipPath: note.noteKind === "journal" ? journalClipPath : undefined,
});

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
      const list = canon.items
        .filter((item) => item.title.trim() || item.text.trim())
        .map((item, index) => `${index + 1}. ${item.title.trim() || item.text.trim()}`)
        .join("\n");
      return list || "Add list items";
    }
    return [canon.statement, canon.interpretation, canon.example].map((value) => value?.trim()).filter(Boolean).join("\n\n") || "Add statement";
  }
  if (note.noteKind === "quote") {
    return cleaned || "Add quote text";
  }
  return cleaned || "Empty note";
};

const NoteShell = ({ children, note, width, height, selected, tone }: WallNotePreviewProps & { children: ReactNode }) => (
  <div
    className="relative overflow-hidden"
    style={{
      ...shellStyle({ note, selected, tone }),
      width,
      height,
    }}
  >
    {children}
  </div>
);

const StandardRenderer = ({ note, width, height, readableText, textFontFamily, baseFontSize, baseLineHeight, bodyClamp, tone }: RendererProps) => {
  const previewText = tone === "detail"
    ? stripWikiLinkMarkup(note.text) || "Empty note"
    : truncateNoteText(stripWikiLinkMarkup(note.text), { ...note, w: width, h: height }) || "Empty note";
  return (
    <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
      <div className="flex h-full flex-col p-3.5">
        <p
          className="whitespace-pre-wrap [overflow-wrap:anywhere]"
          style={{
            ...lineClampStyle(tone === "detail" ? 999 : bodyClamp),
            color: readableText,
            fontFamily: textFontFamily,
            fontSize: baseFontSize,
            lineHeight: baseLineHeight,
          }}
        >
          {previewText}
        </p>
      </div>
    </NoteShell>
  );
};

const QuoteRenderer = ({ note, width, height, readableText, mutedText, textFontFamily, baseFontSize, baseLineHeight, bodyClamp, tone }: RendererProps) => (
  <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
    <div className="flex h-full flex-col p-3.5">
      <span className="absolute left-3 top-1 text-[30px] font-bold leading-none" style={{ color: mutedText }}>
        &ldquo;
      </span>
      <div className="flex-1 pl-5 pt-4">
        <p
          className="whitespace-pre-wrap italic [overflow-wrap:anywhere]"
          style={{
            ...lineClampStyle(tone === "detail" ? 999 : bodyClamp),
            color: readableText,
            fontFamily: textFontFamily,
            fontSize: baseFontSize,
            lineHeight: baseLineHeight,
          }}
        >
          {getBodyText(note)}
        </p>
      </div>
      {note.quoteAuthor?.trim() && (
        <p className="mt-2 text-right text-[11px] italic" style={{ color: mutedText }}>
          {note.quoteAuthor.trim()}
        </p>
      )}
    </div>
  </NoteShell>
);

const JournalRenderer = ({ note, width, height, exactTextColor, textFontFamily, baseFontSize, bodyClamp, tone }: RendererProps) => {
  const dateLabel = formatJournalDateLabel(note.createdAt);
  const lineCount = Math.max(4, Math.floor(height / 32));
  const lines = Array.from({ length: lineCount }, (_, index) => 28 + index * 31);
  return (
    <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
      <div className="relative h-full px-5 pb-4 pt-3">
        <div className="absolute bottom-3 top-3 left-11 w-px bg-[rgba(226,141,141,0.55)]" />
        {lines.map((line) => (
          <div key={`${note.id}-line-${line}`} className="absolute left-3 right-3 border-t border-[rgba(233,233,233,0.92)]" style={{ top: `${line}px` }} />
        ))}
        <div className="relative z-10 pl-11 pt-0.5">
          <p className="text-[13px]" style={{ color: exactTextColor, fontFamily: textFontFamily }}>{dateLabel}</p>
          <div className="mt-1 h-px w-28 max-w-full" style={{ background: exactTextColor, opacity: 0.82 }} />
        </div>
        <div className="relative z-10 mt-4 h-[calc(100%-58px)] pl-11">
          <p
            className="whitespace-pre-wrap [overflow-wrap:anywhere]"
            style={{
              ...lineClampStyle(tone === "detail" ? 999 : bodyClamp),
              color: exactTextColor,
              fontFamily: textFontFamily,
              fontSize: Math.max(16, baseFontSize),
              lineHeight: 1.72,
            }}
          >
            {stripWikiLinkMarkup(note.text) || "Start writing"}
          </p>
        </div>
      </div>
    </NoteShell>
  );
};

const CanonRenderer = ({ note, width, height, readableText, mutedText, textFontFamily, baseFontSize, baseLineHeight, bodyClamp, tone }: RendererProps) => (
  <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
    <div className="flex h-full flex-col p-3.5">
      <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: mutedText }}>
        Canon
      </p>
      {note.canon?.title?.trim() && (
        <p className="mt-1 truncate text-sm font-semibold" style={{ color: readableText }}>
          {note.canon.title.trim()}
        </p>
      )}
      <p
        className="mt-3 whitespace-pre-wrap [overflow-wrap:anywhere]"
        style={{
          ...lineClampStyle(tone === "detail" ? 999 : bodyClamp),
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

const VocabularyRenderer = ({ note, width, height, readableText, activeBackground, activeText, textFontFamily, tone }: RendererProps) => {
  const isBack = Boolean(note.vocabulary?.flipped);
  return (
    <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
      <div className="flex h-full flex-col justify-between p-4 text-center">
        <div className="flex-1 content-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: activeText, opacity: 0.8 }}>
            {isBack ? "Meaning" : "Word"}
          </p>
          <p className="mt-3 whitespace-pre-wrap [overflow-wrap:anywhere]" style={{ color: readableText, fontFamily: textFontFamily, fontSize: isBack ? 18 : 24, lineHeight: 1.3 }}>
            {getBodyText(note)}
          </p>
        </div>
        <div className="rounded-full px-3 py-1 text-[11px] font-semibold" style={{ background: activeBackground, color: activeText }}>
          {isBack ? "Back" : "Front"}
        </div>
      </div>
    </NoteShell>
  );
};

const CurrencyRenderer = ({ note, width, height, activeBackground, activeText, tone }: Pick<RendererProps, "note" | "width" | "height" | "activeBackground" | "activeText" | "tone">) => {
  const state = note.currency;
  const converted = parseCurrencyAmountInput(state?.amountInput) * (state?.usdRate ?? 1);
  const trendGlyph = state?.trend === "up" ? "↑" : state?.trend === "down" ? "↓" : "•";
  return (
    <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
      <div className="flex h-full flex-col p-3.5 text-white" style={{ background: "linear-gradient(180deg, rgba(75,63,114,0.98), rgba(40,27,68,0.98))" }}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "rgba(230,224,255,0.78)" }}>Agy Currency</p>
          <span className="rounded-full px-2 py-1 text-[10px] font-semibold" style={{ background: activeBackground, color: activeText }}>{state?.rateSource ?? "default"}</span>
        </div>
        <p className="mt-3 text-xl font-semibold">1 {state?.baseCurrency ?? "USD"} = {(state?.usdRate ?? 1).toFixed((state?.usdRate ?? 1) >= 1 ? 2 : 4)} USD</p>
        <p className="mt-2 text-sm" style={{ color: "rgba(233,230,255,0.86)" }}>1000 {state?.baseCurrency ?? "USD"} = {(state?.thousandValueUsd ?? 1000).toFixed(2)} USD</p>
        <p className="mt-2 text-xs" style={{ color: "rgba(233,230,255,0.72)" }}>{state?.amountInput ?? "0"} {state?.baseCurrency ?? "USD"} {"->"} {converted.toFixed(2)} USD</p>
        <div className="mt-auto flex items-center justify-between gap-2 text-[11px]" style={{ color: "rgba(230,224,255,0.72)" }}>
          <span>{trendGlyph} {state?.detectedCountryName ?? "Fallback"}</span>
          <span>{state?.status ?? "idle"}</span>
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

const ImageRenderer = ({ note, width, height, readableText, mutedText, textFontFamily, bodyClamp, tone }: RendererProps) => (
  <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
    <div className="flex h-full flex-col rounded-[inherit] bg-white/96 p-1.5">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[14px] bg-[#f4f6fb]">
        {note.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={note.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-[11px]" style={{ color: mutedText }}>No image</div>
        )}
      </div>
      {note.text.trim() && (
        <p
          className="mt-2 px-2 pb-1 whitespace-pre-wrap [overflow-wrap:anywhere]"
          style={{
            ...lineClampStyle(tone === "detail" ? 999 : bodyClamp),
            color: readableText,
            fontFamily: textFontFamily,
            fontSize: 12,
            lineHeight: 1.35,
          }}
        >
          {note.text.trim()}
        </p>
      )}
    </div>
  </NoteShell>
);

const EisenhowerRenderer = ({ note, width, height, readableText, mutedText, softText, quadrantClamp, tone }: RendererProps) => {
  const matrix = normalizeEisenhowerNote(note.eisenhower, note.createdAt);
  return (
    <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
      <div className="h-full rounded-[inherit] bg-[#fbf7f1] p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[11px] font-semibold" style={{ color: mutedText }}>{matrix.displayDate}</p>
          <p className="rounded-full bg-black/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#111827]">Eisenhower</p>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: softText }}>
          <span className="text-center">Urgent</span>
          <span className="text-center">Not Urgent</span>
        </div>
        <div className="mt-2 grid h-[calc(100%-56px)] grid-cols-2 gap-2">
          {EISENHOWER_QUADRANTS.map((quadrant) => {
            const current = matrix.quadrants[quadrant.key];
            const taskCount = countEisenhowerTasks(current.content);
            return (
              <div key={quadrant.key} className="flex min-h-0 flex-col rounded-[14px] border border-black/5 p-2" style={{ background: quadrant.tint }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-[11px] font-semibold text-[#111827]">{current.title || quadrant.title}</p>
                  <span className="text-[10px] font-semibold" style={{ color: mutedText }}>{taskCount}</span>
                </div>
                <p
                  className="mt-1 whitespace-pre-wrap [overflow-wrap:anywhere]"
                  style={{
                    ...lineClampStyle(tone === "detail" ? previewConfig.large.footerClamp : quadrantClamp),
                    color: current.content.trim() ? readableText : softText,
                    fontSize: 11,
                    lineHeight: 1.28,
                  }}
                >
                  {current.content.trim() || quadrant.placeholder}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </NoteShell>
  );
};

const FallbackRenderer = ({ note, width, height, readableText, mutedText, textFontFamily, bodyClamp, tone }: RendererProps) => (
  <NoteShell note={note} width={width} height={height} selected={false} scale="medium" tone={tone}>
    <div className="flex h-full flex-col p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: mutedText }}>Unknown note type</p>
      <p
        className="mt-2 whitespace-pre-wrap [overflow-wrap:anywhere]"
        style={{
          ...lineClampStyle(tone === "detail" ? 999 : bodyClamp),
          color: readableText,
          fontFamily: textFontFamily,
          fontSize: 13,
          lineHeight: 1.35,
        }}
      >
        {stripWikiLinkMarkup(note.text) || "No preview available"}
      </p>
    </div>
  </NoteShell>
);

type NoteRenderer = (props: RendererProps) => ReactNode;

const noteRenderers: Record<string, NoteRenderer> = {
  standard: StandardRenderer,
  quote: QuoteRenderer,
  canon: CanonRenderer,
  journal: JournalRenderer,
  eisenhower: EisenhowerRenderer,
  currency: CurrencyRenderer,
  "web-bookmark": WebBookmarkRenderer,
  image: ImageRenderer,
  vocabulary: VocabularyRenderer,
  fallback: FallbackRenderer,
};

const resolveRendererKey = (note: Note) => {
  if (note.imageUrl?.trim()) {
    return "image";
  }
  if (note.vocabulary) {
    return "vocabulary";
  }
  if (note.noteKind === "joker") {
    return "quote";
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
  const renderNote: NoteRenderer = noteRenderers[resolveRendererKey(note)] ?? noteRenderers.fallback!;

  return (
    <div className="relative" data-note-kind={note.noteKind ?? "standard"}>
      {selected && <div className="pointer-events-none absolute -inset-1 rounded-[24px] border border-[var(--timeline-selection)] opacity-80" />}
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


















