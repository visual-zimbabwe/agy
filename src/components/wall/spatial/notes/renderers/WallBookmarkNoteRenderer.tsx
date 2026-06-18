import { Group, Image as KonvaImage, Rect, Text } from "react-konva";

import {
  atelierPalette,
  getNoteStrokeColor,
} from "@/components/wall/spatial/notes/note-style";
import { bookmarkUrlLabel, resolveBookmarkDisplaySize, WEB_BOOKMARK_ACCENT } from "@/features/wall/bookmarks";
import type { Note } from "@/features/wall/types";

type WallBookmarkNoteRendererProps = {
  note: Note;
  bookmarkImage?: HTMLImageElement;
  bookmarkFavicon?: HTMLImageElement;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  isFlashing: boolean;
  isDragging: boolean;
  isTimeLocked: boolean;
  openExternalUrl: (url: string) => void;
};

type BookmarkChromeProps = {
  note: Note;
  hasThumb: boolean;
  thumbWidth: number;
  bookmarkFavicon?: HTMLImageElement;
  sourceLabel: string;
};

const getBookmarkTargetUrl = (note: Note) => note.bookmark?.metadata?.finalUrl || note.bookmark?.normalizedUrl || note.bookmark?.url;

const getBookmarkSourceLabel = (note: Note) =>
  bookmarkUrlLabel(note.bookmark?.url || note.bookmark?.normalizedUrl || note.bookmark?.metadata?.finalUrl || "")
  || note.bookmark?.metadata?.siteName?.trim()
  || note.bookmark?.metadata?.domain
  || "Website";

const BookmarkDescription = ({ note, contentWidth }: { note: Note; contentWidth: number }) => {
  if (resolveBookmarkDisplaySize(note) === "compact") {
    return null;
  }

  return (
    <Text
      x={16}
      y={52}
      width={contentWidth}
      height={Math.max(24, note.h - 84)}
      fontSize={12}
      lineHeight={1.32}
      fill="rgba(18,44,52,0.72)"
      text={note.bookmark?.metadata?.description?.trim() || note.bookmark?.error || "Bookmark preview is still loading metadata."}
      ellipsis
      listening={false}
    />
  );
};

const BookmarkThumbnail = ({
  note,
  bookmarkImage,
  hasThumb,
  thumbX,
  thumbY,
  thumbWidth,
  thumbHeight,
}: {
  note: Note;
  bookmarkImage?: HTMLImageElement;
  hasThumb: boolean;
  thumbX: number;
  thumbY: number;
  thumbWidth: number;
  thumbHeight: number;
}) => {
  if (!hasThumb) {
    return null;
  }

  return (
    <>
      <Rect x={thumbX} y={thumbY} width={thumbWidth} height={thumbHeight} cornerRadius={14} fill="rgba(0,71,83,0.06)" stroke="rgba(0,71,83,0.10)" strokeWidth={1} listening={false} />
      {bookmarkImage ? (
        <KonvaImage x={thumbX} y={thumbY} width={thumbWidth} height={thumbHeight} image={bookmarkImage} cornerRadius={14} listening={false} />
      ) : (
        <Text
          x={thumbX + 12}
          y={thumbY + thumbHeight / 2 - 8}
          width={Math.max(0, thumbWidth - 24)}
          align="center"
          fontSize={11}
          fontStyle="bold"
          fill="rgba(0,71,83,0.58)"
          text={note.bookmark?.metadata?.siteName?.trim() || note.bookmark?.metadata?.domain || "Preview"}
          ellipsis
          listening={false}
        />
      )}
    </>
  );
};

const BookmarkChrome = ({ note, hasThumb, thumbWidth, bookmarkFavicon, sourceLabel }: BookmarkChromeProps) => (
  <Group x={16} y={Math.max(16, note.h - 28)} listening={false}>
    {bookmarkFavicon ? (
      <KonvaImage x={0} y={0} width={16} height={16} image={bookmarkFavicon} cornerRadius={4} listening={false} />
    ) : (
      <Rect x={0} y={0} width={16} height={16} cornerRadius={4} fill={WEB_BOOKMARK_ACCENT} listening={false} />
    )}
    <Text
      x={24}
      y={1}
      width={Math.max(0, note.w - (hasThumb ? thumbWidth + 144 : 150))}
      fontSize={11}
      fill="rgba(18,44,52,0.72)"
      text={sourceLabel}
      ellipsis
      listening={false}
    />
  </Group>
);

export const WallBookmarkNoteRenderer = ({
  note,
  bookmarkImage,
  bookmarkFavicon,
  isSelected,
  isHovered,
  isHighlighted,
  isFlashing,
  isDragging,
  isTimeLocked,
  openExternalUrl,
}: WallBookmarkNoteRendererProps) => {
  const bookmarkDisplaySize = resolveBookmarkDisplaySize(note);
  const hasThumb = Boolean(bookmarkImage) && bookmarkDisplaySize !== "compact";
  const thumbWidth = bookmarkDisplaySize === "expanded" ? 178 : 156;
  const thumbHeight = bookmarkDisplaySize === "expanded" ? Math.max(92, note.h - 28) : Math.max(78, note.h - 34);
  const thumbX = hasThumb ? Math.max(16, note.w - thumbWidth - 16) : 0;
  const thumbY = hasThumb ? Math.max(14, (note.h - thumbHeight) / 2) : 0;
  const contentWidth = Math.max(0, note.w - (hasThumb ? thumbWidth + 48 : 32));
  const targetUrl = getBookmarkTargetUrl(note);
  const sourceLabel = getBookmarkSourceLabel(note);

  return (
    <>
      <Rect
        width={note.w}
        height={note.h}
        cornerRadius={18}
        fill={atelierPalette.paper}
        stroke={getNoteStrokeColor({ isSelected, isHovered, isHighlighted, accent: atelierPalette.forest })}
        strokeWidth={isHighlighted ? 2.4 : isSelected ? 2 : isHovered ? 1.3 : 0.9}
        shadowColor={atelierPalette.paperShadow}
        shadowBlur={isFlashing ? 28 : isDragging ? 24 : 16}
        shadowOpacity={isFlashing ? 0.18 : isDragging ? 0.14 : 0.08}
        shadowOffsetY={isDragging ? 7 : 3}
      />
      <Group
        x={Math.max(16, note.w - 84)}
        y={14}
        onClick={(event) => {
          if (isTimeLocked) {
            return;
          }
          event.cancelBubble = true;
          if (targetUrl) {
            openExternalUrl(targetUrl);
          }
        }}
        onTap={(event) => {
          if (isTimeLocked) {
            return;
          }
          event.cancelBubble = true;
          if (targetUrl) {
            openExternalUrl(targetUrl);
          }
        }}
      >
        <Rect width={68} height={24} cornerRadius={12} fill="rgba(0,71,83,0.08)" stroke="rgba(0,71,83,0.16)" strokeWidth={1} />
        <Text x={0} y={7} width={68} align="center" fontSize={10} fontStyle="bold" fill="#0B3F49" text="OPEN" />
      </Group>
      <Text
        x={16}
        y={24}
        width={contentWidth}
        fontSize={bookmarkDisplaySize === "compact" ? 14 : 17}
        fontStyle="bold"
        fill="#122C34"
        text={note.bookmark?.metadata?.title?.trim() || note.bookmark?.metadata?.domain || "Paste a URL"}
        ellipsis
        lineHeight={1.16}
        listening={false}
      />
      <BookmarkDescription note={note} contentWidth={contentWidth} />
      <BookmarkThumbnail note={note} bookmarkImage={bookmarkImage} hasThumb={hasThumb} thumbX={thumbX} thumbY={thumbY} thumbWidth={thumbWidth} thumbHeight={thumbHeight} />
      <BookmarkChrome note={note} hasThumb={hasThumb} thumbWidth={thumbWidth} bookmarkFavicon={bookmarkFavicon} sourceLabel={sourceLabel} />
    </>
  );
};
