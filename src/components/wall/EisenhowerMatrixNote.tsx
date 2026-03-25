"use client";

import { Group, Rect, Text } from "react-konva";

import { EISENHOWER_QUADRANTS, countEisenhowerTasks, normalizeEisenhowerNote } from "@/features/wall/eisenhower";
import type { Note } from "@/features/wall/types";

type EisenhowerMatrixNoteProps = {
  note: Note;
  isSelected: boolean;
  isHovered: boolean;
  isDragging: boolean;
  isFlashing: boolean;
  isHighlighted: boolean;
  colorWashOpacity: number;
  textSpringFactor: number;
  openEditor: (noteId: string, text: string, focusField?: string) => void;
  selectSingleNote: (noteId: string) => void;
  isTimeLocked: boolean;
};

const palette = {
  paper: "#fffdfa",
  wash: "#f6f3ee",
  text: "#1c1c19",
  muted: "#8b716a",
  terracotta: "#a33818",
  forest: "#4d6356",
  gold: "#755717",
  shadow: "#1c1c19",
  line: "rgba(223,192,184,0.58)",
};

const borderColor = (isHighlighted: boolean, isSelected: boolean, isHovered: boolean) =>
  isHighlighted ? "#f59e0b" : isSelected ? palette.terracotta : isHovered ? "rgba(163,56,24,0.48)" : palette.line;

export const EisenhowerMatrixNote = ({
  note,
  isSelected,
  isHovered,
  isDragging,
  isFlashing,
  isHighlighted,
  colorWashOpacity,
  textSpringFactor,
  openEditor,
  selectSingleNote,
  isTimeLocked,
}: EisenhowerMatrixNoteProps) => {
  const matrix = normalizeEisenhowerNote(note.eisenhower, note.createdAt);
  const compact = note.w < 300 || note.h < 232;
  const ultraCompact = note.w < 248 || note.h < 194;
  const shellRadius = 16;
  const padding = compact ? 12 : 14;
  const topMetaHeight = compact ? 34 : 38;
  const cellGap = compact ? 8 : 10;
  const gridY = padding + topMetaHeight;
  const gridW = Math.max(40, note.w - padding * 2);
  const gridH = Math.max(68, note.h - gridY - padding);
  const cellW = Math.max(36, (gridW - cellGap) / 2);
  const cellH = Math.max(34, (gridH - cellGap) / 2);
  const titleFontSize = ultraCompact ? 10 : compact ? 10.5 : 11;
  const bodyFontSize = ultraCompact ? 9 : compact ? 9.5 : 10.5;

  return (
    <>
      <Rect
        width={note.w}
        height={note.h}
        cornerRadius={shellRadius}
        fill={palette.paper}
        stroke={borderColor(isHighlighted, isSelected, isHovered)}
        strokeWidth={isHighlighted ? 2.4 : isSelected ? 2 : isHovered ? 1.3 : 0.9}
        shadowColor={palette.shadow}
        shadowBlur={isFlashing ? 28 : isDragging ? 24 : 16}
        shadowOpacity={isFlashing ? 0.18 : isDragging ? 0.14 : 0.08}
        shadowOffsetY={isDragging ? 7 : 3}
      />
      <Rect width={note.w} height={note.h} cornerRadius={shellRadius} fill="rgba(246,243,238,0.72)" listening={false} />
      <Text x={padding} y={padding} width={gridW * 0.48} fontSize={9} fontStyle="bold" fill={palette.muted} text={matrix.displayDate.toUpperCase()} listening={false} />
      <Text x={padding + gridW * 0.52} y={padding} width={gridW * 0.48} align="right" fontSize={9} fontStyle="bold" fill={palette.forest} text="EISENHOWER" listening={false} />

      {EISENHOWER_QUADRANTS.map((quadrant, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = padding + col * (cellW + cellGap);
        const y = gridY + row * (cellH + cellGap);
        const current = matrix.quadrants[quadrant.key];
        const preview = current.content.trim() || quadrant.placeholder;
        const taskCount = countEisenhowerTasks(current.content);
        const titleColor = quadrant.key === "doFirst"
          ? palette.terracotta
          : quadrant.key === "schedule"
            ? palette.forest
            : quadrant.key === "delegate"
              ? palette.gold
              : palette.muted;

        return (
          <Group
            key={quadrant.key}
            onClick={(event) => {
              if (isTimeLocked) {
                return;
              }
              event.cancelBubble = true;
              selectSingleNote(note.id);
              openEditor(note.id, note.text, quadrant.key);
            }}
            onTap={(event) => {
              if (isTimeLocked) {
                return;
              }
              event.cancelBubble = true;
              selectSingleNote(note.id);
              openEditor(note.id, note.text, quadrant.key);
            }}
          >
            <Rect x={x} y={y} width={cellW} height={cellH} cornerRadius={13} fill={quadrant.tint} listening={false} />
            <Text
              x={x + 10}
              y={y + 9}
              width={cellW - 44}
              fontSize={titleFontSize}
              fontStyle="bold"
              fill={titleColor}
              text={ultraCompact ? quadrant.shortTitle.toUpperCase() : (current.title || quadrant.title).toUpperCase()}
              wrap="none"
              ellipsis
              listening={false}
            />
            <Text x={x + cellW - 26} y={y + 9} width={16} align="right" fontSize={10} fill={palette.muted} text={String(taskCount)} listening={false} />
            {!ultraCompact && (
              <Text
                x={x + 10}
                y={y + 28}
                width={cellW - 20}
                height={cellH - 38}
                fontSize={bodyFontSize * textSpringFactor}
                lineHeight={1.34}
                fill={current.content.trim() ? palette.text : palette.muted}
                text={preview}
                ellipsis
                listening={false}
              />
            )}
          </Group>
        );
      })}
      {colorWashOpacity > 0 && <Rect width={note.w} height={note.h} cornerRadius={shellRadius} fill="#ffffff" opacity={colorWashOpacity} />}
    </>
  );
};
