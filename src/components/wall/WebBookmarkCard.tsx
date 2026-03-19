"use client";

import type { CSSProperties, KeyboardEvent } from "react";

import {
  WEB_BOOKMARK_ACCENT,
  bookmarkDomainLabel,
  bookmarkUpdatedLabel,
  inferBookmarkKindLabel,
  isBookmarkMetadataRich,
  resolveBookmarkDisplaySize,
} from "@/features/wall/bookmarks";
import type { Note } from "@/features/wall/types";

type WebBookmarkCardProps = {
  note: Note;
  tone?: "wall" | "card" | "detail";
  interactive?: boolean;
  onOpen?: () => void;
  className?: string;
  style?: CSSProperties;
};

const shellClassByTone: Record<NonNullable<WebBookmarkCardProps["tone"]>, string> = {
  wall: "shadow-[0_18px_42px_rgba(0,0,0,0.18)]",
  card: "shadow-[0_16px_34px_rgba(0,0,0,0.12)]",
  detail: "shadow-[0_24px_56px_rgba(0,0,0,0.18)]",
};

const actionLabelByStatus = {
  idle: "Preview",
  loading: "Refreshing",
  ready: "Open",
  error: "Retry",
} as const;

export const WebBookmarkCard = ({ note, tone = "card", interactive = false, onOpen, className = "", style }: WebBookmarkCardProps) => {
  const bookmark = note.bookmark;
  const metadata = bookmark?.metadata;
  const displaySize = resolveBookmarkDisplaySize(note);
  const domain = bookmarkDomainLabel(metadata?.domain || bookmark?.normalizedUrl || bookmark?.url);
  const title = metadata?.title?.trim() || domain || "Paste a URL";
  const description = metadata?.description?.trim() || (bookmark?.status === "error" ? bookmark.error || "Preview could not be loaded." : "Save a webpage as a rich bookmark preview.");
  const siteName = metadata?.siteName?.trim() || domain || "Website";
  const badge = inferBookmarkKindLabel(metadata?.kind);
  const updatedLabel = bookmarkUpdatedLabel(bookmark?.lastSuccessAt ?? bookmark?.fetchedAt);
  const faviconUrl = metadata?.faviconUrl;
  const imageUrl = metadata?.imageUrl;
  const hasRichMetadata = isBookmarkMetadataRich(metadata);
  const showExpandedImage = displaySize === "expanded" && Boolean(imageUrl);
  const showComfortableThumb = displaySize === "comfortable" && Boolean(imageUrl);
  const contentActionLabel = actionLabelByStatus[bookmark?.status ?? "idle"];
  const buttonProps = interactive && onOpen ? {
    onClick: onOpen,
    role: "button",
    tabIndex: 0,
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onOpen();
      }
    },
  } : {};

  return (
    <div
      className={`group relative overflow-hidden rounded-[24px] border border-[color:rgba(0,71,83,0.16)] bg-[var(--color-surface-elevated)] text-[var(--color-text)] ${shellClassByTone[tone]} ${interactive ? "cursor-pointer transition-transform duration-150 hover:-translate-y-0.5" : ""} ${className}`}
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(244,250,249,0.98) 100%)",
        ...style,
      }}
      {...buttonProps}
    >

      {showExpandedImage ? (
        <div className="relative h-32 overflow-hidden border-b border-[color:rgba(0,71,83,0.10)] bg-[color:rgba(0,71,83,0.08)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.00),rgba(0,0,0,0.18))]" />
        </div>
      ) : null}

      <div className="flex h-full flex-col p-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:rgba(0,71,83,0.78)]">
              <span className="rounded-full border border-[color:rgba(0,71,83,0.14)] bg-[color:rgba(0,71,83,0.08)] px-2 py-1">{badge}</span>
              <span>{hasRichMetadata ? siteName : domain || "Bookmark"}</span>
            </div>
          </div>
          <span className="rounded-full border border-[color:rgba(0,71,83,0.14)] bg-[color:rgba(0,71,83,0.06)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:rgba(0,71,83,0.72)]">
            {contentActionLabel}
          </span>
        </div>

        <div className={`mt-3 ${showComfortableThumb ? "grid grid-cols-[1fr_92px] gap-3" : ""}`}>
          <div className="min-w-0">
            <p className={`font-semibold leading-tight text-[color:rgba(5,44,51,0.96)] ${displaySize === "compact" ? "line-clamp-2 text-[15px]" : displaySize === "expanded" ? "line-clamp-3 text-[18px]" : "line-clamp-3 text-[17px]"}`}>
              {title}
            </p>
            {displaySize !== "compact" ? (
              <p className={`mt-2 text-[color:rgba(5,44,51,0.70)] ${displaySize === "expanded" ? "line-clamp-4 text-[13px] leading-6" : "line-clamp-3 text-[12px] leading-5"}`}>
                {description}
              </p>
            ) : null}
          </div>

          {showComfortableThumb ? (
            <div className="overflow-hidden rounded-[16px] border border-[color:rgba(0,71,83,0.10)] bg-[color:rgba(0,71,83,0.08)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[color:rgba(0,71,83,0.10)] pt-3 text-[11px] text-[color:rgba(5,44,51,0.68)]">
          <div className="flex min-w-0 items-center gap-2">
            {faviconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={faviconUrl} alt="" className="h-4 w-4 rounded-sm bg-white object-cover" loading="lazy" />
            ) : (
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm text-[9px] font-bold text-white" style={{ background: WEB_BOOKMARK_ACCENT }}>
                {domain.slice(0, 1).toUpperCase() || "W"}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-medium text-[color:rgba(5,44,51,0.84)]">{siteName}</p>
              <p className="truncate text-[10px] uppercase tracking-[0.12em] text-[color:rgba(5,44,51,0.52)]">{domain}</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-medium text-[color:rgba(5,44,51,0.74)]">{updatedLabel}</p>
            <p className="text-[10px] uppercase tracking-[0.12em] text-[color:rgba(5,44,51,0.48)]">
              {bookmark?.status === "ready" ? "cached" : bookmark?.status === "error" ? "fallback" : "preview"}
            </p>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-[24px] ring-1 ring-inset ring-[color:rgba(255,255,255,0.42)]" />
    </div>
  );
};



