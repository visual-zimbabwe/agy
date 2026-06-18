import { Image as KonvaImage, Rect, Text } from "react-konva";

import {
  IMAGE_NOTE_CAPTION_FONT_SIZE,
  IMAGE_NOTE_CAPTION_GAP,
  IMAGE_NOTE_CAPTION_LINE_HEIGHT,
  IMAGE_NOTE_PADDING,
  IMAGE_NOTE_RADIUS,
  getContainedImageLayout,
} from "@/components/wall/spatial/notes/note-layout";
import {
  atelierPalette,
  colorWithAlpha,
  getNoteStrokeColor,
} from "@/components/wall/spatial/notes/note-style";
import type { Note } from "@/features/wall/types";

type WallImageNoteRendererProps = {
  note: Note;
  imageUrl?: string;
  image?: HTMLImageElement;
  imageLoadFailed: boolean;
  captionFontFamily: string;
  accentColor: string;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  isFlashing: boolean;
  isDragging: boolean;
  isTimeLocked: boolean;
  selectSingleNote: (noteId: string) => void;
  openEditor: (noteId: string, text: string) => void;
};

export const WallImageNoteRenderer = ({
  note,
  imageUrl,
  image,
  imageLoadFailed,
  captionFontFamily,
  accentColor,
  isSelected,
  isHovered,
  isHighlighted,
  isFlashing,
  isDragging,
  isTimeLocked,
  selectSingleNote,
  openEditor,
}: WallImageNoteRendererProps) => {
  const caption = note.text.trim();
  const layout = getContainedImageLayout(note, caption, image);

  return (
    <>
      <Rect
        width={note.w}
        height={note.h}
        cornerRadius={IMAGE_NOTE_RADIUS}
        fill={atelierPalette.paper}
        stroke={getNoteStrokeColor({ isSelected, isHovered, isHighlighted, accent: accentColor })}
        strokeWidth={isHighlighted ? 2.4 : isSelected ? 2 : isHovered ? 1.3 : 0.9}
        shadowColor={atelierPalette.paperShadow}
        shadowBlur={isFlashing ? 28 : isDragging ? 24 : 16}
        shadowOpacity={isFlashing ? 0.18 : isDragging ? 0.14 : 0.08}
        shadowOffsetY={isDragging ? 7 : 3}
      />
      <Rect width={note.w} height={note.h} cornerRadius={IMAGE_NOTE_RADIUS} fill={accentColor} opacity={0.08} listening={false} />
      {image ? (
        <KonvaImage
          x={layout.imageX}
          y={layout.imageY}
          width={layout.imageWidth}
          height={layout.imageHeight}
          image={image}
          cornerRadius={Math.max(IMAGE_NOTE_RADIUS - 2, 12)}
          listening={false}
        />
      ) : (
        <>
          <Rect
            x={IMAGE_NOTE_PADDING}
            y={IMAGE_NOTE_PADDING}
            width={Math.max(1, note.w - IMAGE_NOTE_PADDING * 2)}
            height={Math.max(1, note.h - IMAGE_NOTE_PADDING * 2 - layout.captionHeight - (layout.captionHeight > 0 ? IMAGE_NOTE_CAPTION_GAP : 0))}
            cornerRadius={Math.max(IMAGE_NOTE_RADIUS - 2, 12)}
            fill={colorWithAlpha(atelierPalette.text, 0.06)}
            stroke={colorWithAlpha(atelierPalette.paperStrokeStrong, 0.16)}
            strokeWidth={1}
            dash={[6, 4]}
            listening={false}
          />
          <Text
            x={18}
            y={Math.max(18, note.h / 2 - 8)}
            width={Math.max(0, note.w - 36)}
            align="center"
            fontSize={11}
            fill={colorWithAlpha(atelierPalette.mutedText, 0.88)}
            text={imageUrl && imageLoadFailed ? "Image failed to load" : "Loading image..."}
            listening={false}
          />
        </>
      )}
      {caption ? (
        <>
          <Rect
            x={IMAGE_NOTE_PADDING}
            y={note.h - IMAGE_NOTE_PADDING - layout.captionHeight - 2}
            width={Math.max(1, note.w - IMAGE_NOTE_PADDING * 2)}
            height={layout.captionHeight + 2}
            cornerRadius={12}
            fill="#FFFFFF"
            opacity={0.94}
            listening={false}
          />
          <Text
            x={14}
            y={note.h - IMAGE_NOTE_PADDING - layout.captionHeight + 5}
            width={Math.max(0, note.w - 28)}
            height={Math.max(0, layout.captionHeight - 10)}
            fontSize={IMAGE_NOTE_CAPTION_FONT_SIZE}
            fontFamily={captionFontFamily}
            lineHeight={IMAGE_NOTE_CAPTION_LINE_HEIGHT}
            fill="#475569"
            text={caption}
            ellipsis
            onClick={(event) => {
              if (isTimeLocked) {
                return;
              }
              event.cancelBubble = true;
              selectSingleNote(note.id);
              openEditor(note.id, note.text);
            }}
          />
        </>
      ) : null}
    </>
  );
};
