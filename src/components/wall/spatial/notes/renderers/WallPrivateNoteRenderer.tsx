import { Circle, Line, Rect, Text } from "react-konva";

import {
  atelierPalette,
  colorWithAlpha,
  getNoteStrokeColor,
} from "@/components/wall/spatial/notes/note-style";
import type { Note } from "@/features/wall/types";
import { getWallNoteViewModel } from "@/features/wall/wall-note-view-model";

type WallPrivateNoteRendererProps = {
  note: Note;
  cornerRadius: number;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  isFlashing: boolean;
  isDragging: boolean;
  isTimeLocked: boolean;
  selectSingleNote: (noteId: string) => void;
  openEditor: (noteId: string, text: string) => void;
};

export const WallPrivateNoteRenderer = ({
  note,
  cornerRadius,
  isSelected,
  isHovered,
  isHighlighted,
  isFlashing,
  isDragging,
  isTimeLocked,
  selectSingleNote,
  openEditor,
}: WallPrivateNoteRendererProps) => {
  const viewModel = getWallNoteViewModel(note, { surface: "canvas-full", uppercaseMeta: true });
  const decryptButtonWidth = Math.min(184, Math.max(128, note.w * 0.56));
  const decryptButtonX = Math.max(26, note.w / 2 - decryptButtonWidth / 2);
  const decryptButtonY = Math.max(note.h - 74, note.h * 0.72);
  const lockIconY = Math.max(18, note.h * 0.11);

  const openDecrypt = (event: { cancelBubble: boolean }) => {
    if (isTimeLocked) {
      return;
    }
    event.cancelBubble = true;
    selectSingleNote(note.id);
    openEditor(note.id, note.text);
  };

  return (
    <>
      <Rect
        width={note.w}
        height={note.h}
        cornerRadius={cornerRadius}
        fill={atelierPalette.paper}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: note.w, y: note.h }}
        fillLinearGradientColorStops={[0, "#FFFDF9", 0.55, "#FBF8F2", 1, "#F5F1EA"]}
        stroke={getNoteStrokeColor({ isSelected, isHovered, isHighlighted, accent: atelierPalette.forest })}
        strokeWidth={isHighlighted ? 2.4 : isSelected ? 2 : isHovered ? 1.3 : 0.9}
        shadowColor={atelierPalette.paperShadow}
        shadowBlur={isFlashing ? 28 : isDragging ? 24 : 16}
        shadowOpacity={isFlashing ? 0.18 : isDragging ? 0.14 : 0.08}
        shadowOffsetY={isDragging ? 7 : 3}
      />
      <Rect width={note.w} height={note.h} cornerRadius={cornerRadius} fill={colorWithAlpha("#FFFFFF", 0.68)} listening={false} />
      <Rect
        x={note.w * 0.08}
        y={note.h * 0.06}
        width={note.w * 0.84}
        height={note.h * 0.88}
        cornerRadius={Math.min(30, cornerRadius + 8)}
        stroke={colorWithAlpha(atelierPalette.quietText, 0.08)}
        strokeWidth={1}
        listening={false}
      />
      <Rect
        x={Math.max(24, note.w / 2 - 38)}
        y={lockIconY}
        width={76}
        height={76}
        cornerRadius={24}
        fill="rgba(246, 241, 234, 0.96)"
        stroke="rgba(140,124,114,0.12)"
        strokeWidth={1}
        shadowColor={atelierPalette.paperShadow}
        shadowBlur={12}
        shadowOpacity={0.06}
        shadowOffsetY={3}
        listening={false}
      />
      <Line
        points={[
          note.w / 2 - 12,
          lockIconY + 23,
          note.w / 2 - 12,
          lockIconY + 16,
          note.w / 2 + 12,
          lockIconY + 16,
          note.w / 2 + 12,
          lockIconY + 23,
        ]}
        stroke={atelierPalette.mutedText}
        strokeWidth={5}
        lineCap="round"
        lineJoin="round"
        listening={false}
      />
      <Rect
        x={note.w / 2 - 15}
        y={lockIconY + 23}
        width={30}
        height={28}
        cornerRadius={6}
        fill={atelierPalette.mutedText}
        listening={false}
      />
      <Circle x={note.w / 2} y={lockIconY + 40} radius={4.5} fill={atelierPalette.paper} listening={false} />
      <Text
        x={22}
        y={Math.max(108, lockIconY + 88)}
        width={Math.max(0, note.w - 44)}
        align="center"
        fontSize={Math.max(18, Math.min(24, note.w * 0.11))}
        fontFamily="Newsreader"
        fontStyle="italic"
        fill={atelierPalette.text}
        text={viewModel.title}
        listening={false}
      />
      <Text
        x={28}
        y={Math.max(150, lockIconY + 134)}
        width={Math.max(0, note.w - 56)}
        align="center"
        fontSize={Math.max(10, Math.min(12, note.w * 0.05))}
        letterSpacing={2.2}
        fill={colorWithAlpha(atelierPalette.quietText, 0.9)}
        text={viewModel.privacyMetaLabel?.toUpperCase() ?? "SECURED NODE"}
        listening={false}
      />
      <Rect
        x={decryptButtonX}
        y={decryptButtonY}
        width={decryptButtonWidth}
        height={40}
        cornerRadius={20}
        fill={colorWithAlpha("#FFFFFF", 0.74)}
        stroke={colorWithAlpha(atelierPalette.quietText, 0.34)}
        strokeWidth={1.6}
        onClick={openDecrypt}
        onTap={openDecrypt}
      />
      <Text
        x={decryptButtonX}
        y={decryptButtonY + 12}
        width={decryptButtonWidth}
        align="center"
        fontSize={Math.max(11, Math.min(16, note.w * 0.07))}
        letterSpacing={2.4}
        fill={atelierPalette.text}
        text="DECRYPT"
        listening={false}
      />
    </>
  );
};
