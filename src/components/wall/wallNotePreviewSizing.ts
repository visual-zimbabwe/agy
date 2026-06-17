"use client";

import { isImageNote } from "@/features/wall/image-notes";
import type { Note } from "@/features/wall/types";

export type WallPreviewSurface = "wall" | "timeline-stream" | "timeline-canvas" | "timeline-detail";
export type WallPreviewScale = "small" | "medium" | "large";

export type WallPreviewDimensions = {
  width: number;
  height: number;
  scale: number;
};

type ResolveWallPreviewDimensionsOptions = {
  surface: WallPreviewSurface;
  previewScale?: WallPreviewScale;
  maxWidth?: number;
  maxHeight?: number;
};

const BARE_ATTACHMENT_PATTERN = /([\w-]+\.(pdf|docx?|txt|png|jpe?g|gif|webp|zip|csv|md|xlsx?|pptx?))/i;

const stripWikiLinkMarkup = (text: string) => text.replace(/\[\[([^\]\n]+?)\]\]/g, "$1");

export const isBareAttachmentNote = (note: Pick<Note, "noteKind" | "text" | "imageUrl" | "file" | "bookmark">) => {
  if (note.noteKind === "file" || note.noteKind === "web-bookmark") {
    return true;
  }
  if (isImageNote(note)) {
    return false;
  }
  if (note.noteKind && note.noteKind !== "standard") {
    return false;
  }
  return BARE_ATTACHMENT_PATTERN.test(stripWikiLinkMarkup(note.text));
};

const minimumDimensionsBySurface: Record<WallPreviewSurface, { width: number; height: number }> = {
  wall: { width: 1, height: 1 },
  "timeline-stream": { width: 220, height: 170 },
  "timeline-canvas": { width: 144, height: 116 },
  "timeline-detail": { width: 260, height: 220 },
};

const timelineStreamAttachmentMax = { width: 320, height: 260 };

const timelineCanvasScaleByPreviewScale: Record<WallPreviewScale, number> = {
  small: 0.7,
  medium: 0.84,
  large: 1,
};

const clampBaseDimension = (value: number, minimum: number) => Math.max(minimum, Math.round(value));

const shouldClampTimelineStreamAttachment = (note: Pick<Note, "noteKind" | "text" | "imageUrl" | "file" | "bookmark">) =>
  note.noteKind === "web-bookmark" || isBareAttachmentNote(note);

const fitTimelineStreamAttachmentDimensions = (
  width: number,
  height: number,
  minimum: { width: number; height: number },
  limits?: { maxWidth?: number; maxHeight?: number },
) => {
  const maxWidth = limits?.maxWidth ?? timelineStreamAttachmentMax.width;
  const maxHeight = limits?.maxHeight ?? timelineStreamAttachmentMax.height;
  const scale = Math.min(1, maxWidth / width, maxHeight / height);

  return {
    width: Math.max(minimum.width, Math.round(width * scale)),
    height: Math.max(minimum.height, Math.round(height * scale)),
    scale,
  };
};

export const resolveWallPreviewDimensions = (
  note: Pick<Note, "w" | "h" | "noteKind" | "text" | "imageUrl" | "file" | "bookmark">,
  options: ResolveWallPreviewDimensionsOptions,
): WallPreviewDimensions => {
  const { surface, previewScale = "large", maxWidth, maxHeight } = options;
  const minimum = minimumDimensionsBySurface[surface];
  const intrinsicWidth = clampBaseDimension(note.w, minimum.width);
  const intrinsicHeight = clampBaseDimension(note.h, minimum.height);
  if (surface === "timeline-canvas") {
    const baseScale = timelineCanvasScaleByPreviewScale[previewScale];
    return {
      width: Math.max(minimum.width, Math.round(intrinsicWidth * baseScale)),
      height: Math.max(minimum.height, Math.round(intrinsicHeight * baseScale)),
      scale: baseScale,
    };
  }

  if (surface === "timeline-stream" && shouldClampTimelineStreamAttachment(note)) {
    return fitTimelineStreamAttachmentDimensions(intrinsicWidth, intrinsicHeight, minimum, {
      maxWidth,
      maxHeight,
    });
  }

  return {
    width: intrinsicWidth,
    height: intrinsicHeight,
    scale: 1,
  };
};
