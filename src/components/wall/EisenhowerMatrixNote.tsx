"use client";

import { Group, Line, Rect, Text } from "react-konva";

import { EISENHOWER_QUADRANTS, countEisenhowerTasks, getEisenhowerTotalTaskCount, normalizeEisenhowerNote } from "@/features/wall/eisenhower";
import { NOTE_DEFAULTS } from "@/features/wall/constants";
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

const borderColor = (isHighlighted: boolean, isSelected: boolean, isHovered: boolean) =>
  isHighlighted ? "#f59e0b" : isSelected ? "#0f172a" : isHovered ? "#52525b" : "#d4d4d8";

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
  const ultraCompact = note.w < 250 || note.h < 190;
  const headerHeight = compact ? 40 : 52;
  const footerHeight = ultraCompact ? 0 : compact ? 18 : 26;
  const gridX = 12;
  const gridY = headerHeight;
  const gridW = Math.max(0, note.w - 24);
  const gridH = Math.max(40, note.h - headerHeight - footerHeight - 10);
  const cellGap = 8;
  const cellW = Math.max(36, (gridW - cellGap) / 2);
  const cellH = Math.max(30, (gridH - cellGap) / 2);
  const totalTasks = getEisenhowerTotalTaskCount({ eisenhower: matrix });
  const titleFontSize = ultraCompact ? 10 : compact ? 11 : 12;
  const bodyFontSize = ultraCompact ? 9 : compact ? 10 : 11;
  const axisFontSize = ultraCompact ? 8 : 9;

  return (
    <>
      <Rect
        width={note.w}
        height={note.h}
        cornerRadius={18}
        fill="#FBF7F1"
        stroke={borderColor(isHighlighted, isSelected, isHovered)}
        strokeWidth={isHighlighted ? 2.6 : isSelected ? 2.4 : isHovered ? 1.4 : 1}
        shadowColor="#101010"
        shadowBlur={isFlashing ? 30 : isDragging ? 26 : 12}
        shadowOpacity={isFlashing ? 0.34 : isDragging ? 0.28 : 0.14}
        shadowOffsetY={isDragging ? 7 : 3}
      />
      <Rect width={note.w} height={note.h} cornerRadius={18} fill={note.color} opacity={0.18} listening={false} />
      <Rect x={12} y={12} width={note.w - 24} height={note.h - 24} cornerRadius={16} fill="#fffdfa" opacity={0.84} listening={false} />
      <Text x={16} y={15} width={note.w - 124} fontSize={compact ? 10 : 11} fontStyle="bold" fill="#6b7280" text={matrix.displayDate} listening={false} />
      <Text x={note.w - 126} y={14} width={110} align="right" fontSize={compact ? 10 : 11} fontStyle="bold" fill="#111827" text="Eisenhower Matrix" listening={false} />
      <Text x={gridX} y={headerHeight - 13} width={cellW} align="center" fontSize={axisFontSize} fill="#6b7280" text="Urgent" listening={false} />
      <Text x={gridX + cellW + cellGap} y={headerHeight - 13} width={cellW} align="center" fontSize={axisFontSize} fill="#6b7280" text="Not Urgent" listening={false} />
      {!compact && <Text x={2} y={gridY + gridH / 2 - 26} width={20} rotation={-90} fontSize={axisFontSize} fill="#6b7280" text="Important" listening={false} />}
      <Line points={[gridX + cellW + cellGap / 2, gridY + 2, gridX + cellW + cellGap / 2, gridY + gridH - 2]} stroke="#d6d3d1" strokeWidth={1} listening={false} />
      <Line points={[gridX + 2, gridY + cellH + cellGap / 2, gridX + gridW - 2, gridY + cellH + cellGap / 2]} stroke="#d6d3d1" strokeWidth={1} listening={false} />

      {EISENHOWER_QUADRANTS.map((quadrant, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = gridX + col * (cellW + cellGap);
        const y = gridY + row * (cellH + cellGap);
        const current = matrix.quadrants[quadrant.key];
        const preview = current.content.trim() || quadrant.placeholder;
        const taskCount = countEisenhowerTasks(current.content);
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
            <Rect x={x} y={y} width={cellW} height={cellH} cornerRadius={13} fill={quadrant.tint} stroke="rgba(15,23,42,0.05)" strokeWidth={1} />
            <Text
              x={x + 10}
              y={y + 8}
              width={cellW - 44}
              fontSize={titleFontSize}
              fontStyle="bold"
              fill="#111827"
              text={ultraCompact ? quadrant.shortTitle : current.title || quadrant.title}
              wrap="none"
              ellipsis
              listening={false}
            />
            <Text
              x={x + cellW - 28}
              y={y + 8}
              width={18}
              align="right"
              fontSize={10}
              fill="#6b7280"
              text={String(taskCount)}
              listening={false}
            />
            {!ultraCompact && (
              <Text
                x={x + 10}
                y={y + 27}
                width={cellW - 20}
                height={cellH - 36}
                fontSize={bodyFontSize * textSpringFactor}
                lineHeight={1.32}
                fill={current.content.trim() ? (note.textColor ?? NOTE_DEFAULTS.textColor) : "#7c7f88"}
                text={preview}
                ellipsis
                listening={false}
              />
            )}
          </Group>
        );
      })}

      {!ultraCompact && (
        <Text
          x={16}
          y={note.h - footerHeight + 2}
          width={note.w - 32}
          fontSize={10}
          fill="#6b7280"
          text={`${totalTasks} ${totalTasks === 1 ? "task" : "tasks"} across four priorities`}
          listening={false}
        />
      )}
      {colorWashOpacity > 0 && <Rect width={note.w} height={note.h} cornerRadius={18} fill="#ffffff" opacity={colorWashOpacity} />}
    </>
  );
};
