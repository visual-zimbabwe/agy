"use client";

import { useEffect, useMemo } from "react";

import { WallRenderedNote } from "@/components/wall/WallRenderedNote";
import { resolveWallPreviewDimensions } from "@/components/wall/wallNotePreviewSizing";
import { formatTimelineDateTime } from "@/components/wall/wallTimelineViewHelpers";
import type { Note } from "@/features/wall/types";

type WallTimelineViewProps = {
  notes: Note[];
  selectedNoteId?: string;
  activeTimestamp?: number;
  onSelectNote: (noteId: string) => void;
  onRevealNote: (noteId: string) => void;
  onExit: () => void;
};

type TimelineEntry = {
  id: string;
  note: Note;
  ts: number;
  side: "left" | "right" | "center";
  desktop: ReturnType<typeof resolveWallPreviewDimensions>;
  mobile: ReturnType<typeof resolveWallPreviewDimensions>;
};

type TimelineGroup = {
  key: string;
  label: string;
  entries: TimelineEntry[];
};

const shellStyles = {
  background: "#fcf9f4",
  backgroundImage: "radial-gradient(circle at 50% 18%, rgba(255,255,255,0.9) 0%, rgba(252,249,244,1) 42%, rgba(240,237,232,0.84) 100%)",
  axis: "rgba(223, 192, 184, 0.55)",
  axisSoft: "rgba(223, 192, 184, 0.24)",
  chipBg: "rgba(246, 243, 238, 0.94)",
  chipBorder: "rgba(223, 192, 184, 0.36)",
  text: "#1c1c19",
  muted: "rgba(77, 99, 86, 0.82)",
  quiet: "rgba(139, 113, 106, 0.72)",
  shadow: "0 18px 42px rgba(28, 28, 25, 0.08)",
};

const desktopColumnWidth = 520;
const mobileColumnWidth = 320;

const dayKey = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const startOfDay = (timestamp: number) => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const formatDayLabel = (timestamp: number, latestDay: number) => {
  const deltaDays = Math.round((latestDay - startOfDay(timestamp)) / 86_400_000);
  if (deltaDays === 0) {
    return "Today";
  }
  if (deltaDays === 1) {
    return "Yesterday";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(timestamp);
};

const formatTimeLabel = (timestamp: number) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);

const buildTimelineGroups = (notes: Note[]) => {
  const sorted = [...notes]
    .filter((note) => !note.deletedAt)
    .sort((left, right) => {
      const delta = right.createdAt - left.createdAt;
      if (delta !== 0) {
        return delta;
      }
      return right.updatedAt - left.updatedAt;
    });

  if (sorted.length === 0) {
    return [] as TimelineGroup[];
  }

  const latestDay = startOfDay(sorted[0]!.createdAt);
  let streamIndex = 0;
  const groupMap = new Map<string, TimelineGroup>();

  for (const note of sorted) {
    const timestamp = note.createdAt;
    const key = dayKey(timestamp);
    const side = note.pinned ? "center" : streamIndex % 2 === 0 ? "left" : "right";

    if (!note.pinned) {
      streamIndex += 1;
    }

    const current = groupMap.get(key);
    const entry: TimelineEntry = {
      id: note.id,
      note,
      ts: timestamp,
      side,
      desktop: resolveWallPreviewDimensions(note, { surface: "timeline-stream" }),
      mobile: resolveWallPreviewDimensions(note, { surface: "timeline-stream" }),
    };

    if (current) {
      current.entries.push(entry);
      continue;
    }

    groupMap.set(key, {
      key,
      label: formatDayLabel(timestamp, latestDay),
      entries: [entry],
    });
  }

  return [...groupMap.values()];
};

export const WallTimelineView = ({
  notes,
  onExit,
}: WallTimelineViewProps) => {
  const groups = useMemo(() => buildTimelineGroups(notes), [notes]);
  const noteCount = groups.reduce((count, group) => count + group.entries.length, 0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === "input" || tagName === "textarea" || target?.isContentEditable) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        onExit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit]);

  return (
    <div
      className="absolute inset-0 z-20 overflow-hidden"
      style={{
        background: shellStyles.background,
        backgroundImage: shellStyles.backgroundImage,
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0))" }} />

      <header className="absolute inset-x-0 top-0 z-10 border-b border-white/30 bg-[rgba(252,249,244,0.82)] px-4 py-5 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="font-[Newsreader] text-[28px] italic leading-none" style={{ color: shellStyles.text }}>Timeline</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.24em]" style={{ color: shellStyles.quiet }}>
              View mode only · {noteCount} note{noteCount === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="pointer-events-auto inline-flex items-center rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors hover:bg-white/60"
            style={{
              borderColor: shellStyles.chipBorder,
              background: shellStyles.chipBg,
              color: shellStyles.text,
              boxShadow: shellStyles.shadow,
            }}
          >
            Close
          </button>
        </div>
      </header>

      <div className="wall-timeline-scrollbar relative h-full overflow-auto px-4 pb-24 pt-28 sm:px-6 lg:px-10">
        <div className="relative mx-auto max-w-6xl pb-20">
          <div
            className="pointer-events-none absolute bottom-0 top-0 left-1/2 hidden -translate-x-1/2 md:block"
            style={{ width: "1px", background: `linear-gradient(180deg, transparent 0%, ${shellStyles.axis} 6%, ${shellStyles.axisSoft} 100%)` }}
          />

          {groups.length === 0 ? (
            <div className="mx-auto mt-24 max-w-xl rounded-[28px] border border-dashed px-8 py-14 text-center shadow-[0_20px_40px_rgba(28,28,25,0.05)]" style={{ borderColor: shellStyles.chipBorder, background: "rgba(255,255,255,0.6)" }}>
              <p className="font-[Newsreader] text-3xl italic" style={{ color: shellStyles.text }}>Nothing on the timeline yet.</p>
              <p className="mt-4 text-sm leading-7" style={{ color: shellStyles.muted }}>
                This view only renders existing wall notes. Create notes on the wall, then return here to review them chronologically.
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <section key={group.key} className="relative">
                <div className="relative z-[1] mb-10 mt-10 flex justify-center md:mb-16 md:mt-14">
                  <span
                    className="inline-flex rounded-full border px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] shadow-sm"
                    style={{
                      borderColor: shellStyles.chipBorder,
                      background: shellStyles.chipBg,
                      color: shellStyles.muted,
                    }}
                  >
                    {group.label}
                  </span>
                </div>

                <div className="space-y-12 md:space-y-16">
                  {group.entries.map((entry) => {
                    const commonTimeLabel = (
                      <p className="mt-4 text-[10px] uppercase tracking-[0.24em]" style={{ color: shellStyles.quiet }}>
                        {formatTimeLabel(entry.ts)}
                      </p>
                    );

                    if (entry.side === "center") {
                      return (
                        <div key={entry.id} className="flex justify-center px-4">
                          <div className="max-w-full text-center">
                            <WallRenderedNote note={entry.note} width={entry.mobile.width} height={entry.mobile.height} showNoteTags={false} />
                            {commonTimeLabel}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={entry.id} className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_88px_minmax(0,1fr)] md:gap-10">
                        <div className={`flex ${entry.side === "left" ? "justify-end text-right" : "justify-start md:col-start-3"}`}>
                          <div className={`flex max-w-full flex-col ${entry.side === "left" ? "items-end text-right" : "items-start text-left"}`}>
                            <div className="md:hidden">
                              <WallRenderedNote note={entry.note} width={entry.mobile.width} height={entry.mobile.height} showNoteTags={false} />
                            </div>
                            <div className="hidden md:block">
                              <WallRenderedNote note={entry.note} width={entry.desktop.width} height={entry.desktop.height} showNoteTags={false} />
                            </div>
                            {commonTimeLabel}
                          </div>
                        </div>

                        <div className="relative hidden items-start justify-center md:flex">
                          <div className="mt-4 h-3 w-3 rounded-full border-2 bg-[#fcf9f4]" style={{ borderColor: shellStyles.axis }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 rounded-full border px-5 py-2 text-[10px] uppercase tracking-[0.22em] opacity-70 md:inline-flex" style={{ borderColor: shellStyles.chipBorder, background: "rgba(252,249,244,0.66)", color: shellStyles.quiet }}>
        Notes are read-only in timeline
      </div>

      <span className="sr-only">{groups.length > 0 ? formatTimelineDateTime(groups[0]!.entries[0]!.ts) : "Timeline view"}</span>
    </div>
  );
};

