import type { ComponentProps } from "react";
import { Group, Rect, Text } from "react-konva";

import {
  atelierPalette,
  colorWithAlpha,
  getContrastTextColor,
  getNoteStrokeColor,
  resolveNoteFillColor,
} from "@/components/wall/spatial/notes/note-style";
import { isPrivateNote } from "@/features/wall/private-notes";
import type { Note } from "@/features/wall/types";
import { getWallNoteViewModel } from "@/features/wall/wall-note-view-model";
import type { WallRenderDetailLevel } from "@/features/wall/windowing";

type WallCompactNoteRendererProps = {
  note: Note;
  renderDetailLevel: Exclude<WallRenderDetailLevel, "full">;
  groupProps: ComponentProps<typeof Group>;
  cornerRadius: number;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  isFlashing: boolean;
  isDragging: boolean;
};

export const WallCompactNoteRenderer = ({
  note,
  renderDetailLevel,
  groupProps,
  cornerRadius,
  isSelected,
  isHovered,
  isHighlighted,
  isFlashing,
  isDragging,
}: WallCompactNoteRendererProps) => {
  const preview = getWallNoteViewModel(note);
  const ambient = renderDetailLevel === "ambient";
  const resolvedNoteColor = resolveNoteFillColor(note);
  const previewFill = isPrivateNote(note) ? "#F5F1EA" : "#FFFCF8";
  const previewTextColor = getContrastTextColor(resolvedNoteColor);
  const previewStroke = getNoteStrokeColor({ isSelected, isHovered, isHighlighted, accent: resolvedNoteColor });
  const previewBadge = note.noteKind ? note.noteKind.replaceAll("-", " ").toUpperCase() : "NOTE";

  return (
    <Group {...groupProps}>
      <Rect
        width={note.w}
        height={note.h}
        cornerRadius={cornerRadius}
        fill={previewFill}
        stroke={previewStroke}
        strokeWidth={isHighlighted ? 2.4 : isSelected ? 2 : isHovered ? 1.3 : 0.9}
        shadowColor={atelierPalette.paperShadow}
        shadowBlur={isFlashing ? 24 : isDragging ? 18 : 12}
        shadowOpacity={isFlashing ? 0.14 : isDragging ? 0.11 : 0.06}
        shadowOffsetY={isDragging ? 6 : 3}
      />
      <Rect width={note.w} height={note.h} cornerRadius={cornerRadius} fill={resolvedNoteColor} opacity={ambient ? 0.08 : 0.05} listening={false} />
      <Rect x={0} y={0} width={Math.max(10, Math.min(note.w, 8))} height={note.h} cornerRadius={[cornerRadius, 0, 0, cornerRadius]} fill={resolvedNoteColor} listening={false} />
      {!ambient ? (
        <>
          <Text
            x={16}
            y={16}
            width={Math.max(0, note.w - 32)}
            fontSize={Math.max(12, Math.min(18, note.w * 0.08))}
            fontStyle="bold"
            fill={previewTextColor}
            text={preview.title}
            ellipsis
            listening={false}
          />
          <Text
            x={16}
            y={Math.max(38, note.h - 28)}
            width={Math.max(0, note.w - 32)}
            fontSize={10}
            letterSpacing={1.2}
            fill={colorWithAlpha(previewTextColor, 0.68)}
            text={preview.meta}
            ellipsis
            listening={false}
          />
        </>
      ) : (
        <>
          <Rect x={14} y={14} width={Math.max(32, Math.min(note.w - 28, note.w * 0.36))} height={8} cornerRadius={4} fill={colorWithAlpha(previewTextColor, 0.22)} listening={false} />
          <Rect x={14} y={Math.max(28, note.h - 18)} width={Math.max(26, Math.min(note.w - 28, note.w * 0.22))} height={6} cornerRadius={3} fill={colorWithAlpha(previewTextColor, 0.14)} listening={false} />
        </>
      )}
      <Text
        x={Math.max(14, note.w - 86)}
        y={14}
        width={72}
        align="right"
        fontSize={9}
        letterSpacing={1.4}
        fill={colorWithAlpha(previewTextColor, 0.58)}
        text={previewBadge}
        ellipsis
        listening={false}
      />
    </Group>
  );
};
