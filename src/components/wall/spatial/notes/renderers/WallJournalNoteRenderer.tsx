import { Rect, Text } from "react-konva";

import {
  atelierPalette,
  colorWithAlpha,
  getNoteStrokeColor,
} from "@/components/wall/spatial/notes/note-style";
import type { Note } from "@/features/wall/types";

const JOURNAL_HORIZONTAL_INSET = 20;

type WallJournalNoteRendererProps = {
  note: Note;
  cornerRadius: number;
  dateLabel: string;
  title: string;
  body: string;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  isFlashing: boolean;
  isDragging: boolean;
};

export const WallJournalNoteRenderer = ({
  note,
  cornerRadius,
  dateLabel,
  title,
  body,
  isSelected,
  isHovered,
  isHighlighted,
  isFlashing,
  isDragging,
}: WallJournalNoteRendererProps) => (
  <>
    <Rect
      width={note.w}
      height={note.h}
      cornerRadius={cornerRadius}
      fill={atelierPalette.paper}
      stroke={getNoteStrokeColor({ isSelected, isHovered, isHighlighted, accent: atelierPalette.terracotta })}
      strokeWidth={isHighlighted ? 2.4 : isSelected ? 2 : isHovered ? 1.3 : 0.9}
      shadowColor={atelierPalette.paperShadow}
      shadowBlur={isFlashing ? 28 : isDragging ? 24 : 16}
      shadowOpacity={isFlashing ? 0.18 : isDragging ? 0.14 : 0.08}
      shadowOffsetY={isDragging ? 7 : 3}
    />
    <Text
      x={JOURNAL_HORIZONTAL_INSET}
      y={20}
      width={Math.max(0, note.w - JOURNAL_HORIZONTAL_INSET * 2)}
      fontSize={10}
      fontFamily="Newsreader"
      fontStyle="italic"
      fill={colorWithAlpha(atelierPalette.mutedText, 0.62)}
      letterSpacing={1.8}
      text={dateLabel.toUpperCase()}
      listening={false}
    />
    <Text
      x={JOURNAL_HORIZONTAL_INSET}
      y={52}
      width={Math.max(0, note.w - JOURNAL_HORIZONTAL_INSET * 2)}
      fontSize={23}
      fontFamily="Newsreader"
      fontStyle="italic"
      fill={atelierPalette.text}
      text={title}
      ellipsis
      listening={false}
    />
    <Text
      x={JOURNAL_HORIZONTAL_INSET}
      y={92}
      width={Math.max(0, note.w - JOURNAL_HORIZONTAL_INSET * 2)}
      height={Math.max(0, note.h - 114)}
      fontSize={18}
      fontFamily="Newsreader"
      lineHeight={1.58}
      fill={colorWithAlpha(atelierPalette.text, 0.82)}
      text={body}
      ellipsis
      listening={false}
    />
  </>
);
