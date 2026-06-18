import { NOTE_DEFAULTS } from "@/features/wall/constants";
import type { Note } from "@/features/wall/types";

export const IMAGE_NOTE_PADDING = 6;
export const IMAGE_NOTE_RADIUS = 16;
export const IMAGE_NOTE_CAPTION_GAP = 8;
export const IMAGE_NOTE_CAPTION_FONT_SIZE = 12;
export const IMAGE_NOTE_CAPTION_LINE_HEIGHT = 1.28;
export const IMAGE_NOTE_CAPTION_MAX_LINES = 3;

export const estimateImageCaptionHeight = (noteWidth: number, caption: string) => {
  const trimmed = caption.trim();
  if (!trimmed) {
    return 0;
  }

  const innerWidth = Math.max(72, noteWidth - 24);
  const approxCharsPerLine = Math.max(16, Math.floor(innerWidth / 7));
  const lines = Math.min(IMAGE_NOTE_CAPTION_MAX_LINES, Math.max(1, Math.ceil(trimmed.length / approxCharsPerLine)));
  return Math.ceil(lines * IMAGE_NOTE_CAPTION_FONT_SIZE * IMAGE_NOTE_CAPTION_LINE_HEIGHT + 18);
};

export const getImageNoteAutoHeight = (note: Pick<Note, "w">, caption: string, image?: HTMLImageElement) => {
  const availableWidth = Math.max(1, note.w - IMAGE_NOTE_PADDING * 2);
  const captionHeight = estimateImageCaptionHeight(note.w, caption);
  const captionGap = captionHeight > 0 ? IMAGE_NOTE_CAPTION_GAP : 0;
  const fallbackHeight = availableWidth * 0.7;

  if (!image || !image.naturalWidth || !image.naturalHeight) {
    return Math.max(NOTE_DEFAULTS.minHeight, Math.round(IMAGE_NOTE_PADDING * 2 + fallbackHeight + captionGap + captionHeight));
  }

  const intrinsicHeight = image.naturalHeight * (availableWidth / image.naturalWidth);
  return Math.max(NOTE_DEFAULTS.minHeight, Math.round(IMAGE_NOTE_PADDING * 2 + intrinsicHeight + captionGap + captionHeight));
};

export const getContainedImageLayout = (note: Pick<Note, "w" | "h">, caption: string, image?: HTMLImageElement) => {
  const captionHeight = estimateImageCaptionHeight(note.w, caption);
  const captionGap = captionHeight > 0 ? IMAGE_NOTE_CAPTION_GAP : 0;
  const availableWidth = Math.max(1, note.w - IMAGE_NOTE_PADDING * 2);
  const availableHeight = Math.max(1, note.h - IMAGE_NOTE_PADDING * 2 - captionHeight - captionGap);

  if (!image || !image.naturalWidth || !image.naturalHeight) {
    return {
      captionHeight,
      imageX: IMAGE_NOTE_PADDING,
      imageY: IMAGE_NOTE_PADDING,
      imageWidth: availableWidth,
      imageHeight: availableHeight,
    };
  }

  const widthRatio = availableWidth / image.naturalWidth;
  const heightRatio = availableHeight / image.naturalHeight;
  const scale = Math.min(widthRatio, heightRatio);
  const imageWidth = Math.max(1, image.naturalWidth * scale);
  const imageHeight = Math.max(1, image.naturalHeight * scale);

  return {
    captionHeight,
    imageX: IMAGE_NOTE_PADDING + (availableWidth - imageWidth) / 2,
    imageY: IMAGE_NOTE_PADDING + (availableHeight - imageHeight) / 2,
    imageWidth,
    imageHeight,
  };
};
