import { Text } from "react-konva";

import { atelierPalette } from "@/components/wall/spatial/notes/note-style";
import type { Note } from "@/features/wall/types";

type WallStandardNoteRendererProps = {
  note: Note;
  title: string;
  body: string;
  fontFamily: string;
  wikiFooterHeight: number;
};

export const WallStandardNoteRenderer = ({
  note,
  title,
  body,
  fontFamily,
  wikiFooterHeight,
}: WallStandardNoteRendererProps) => (
  <>
    <Text
      x={20}
      y={20}
      width={Math.max(0, note.w - 40)}
      fontSize={16}
      fontFamily={fontFamily}
      fontStyle="bold"
      fill={atelierPalette.text}
      text={title}
      ellipsis
      listening={false}
    />
    {body ? (
      <Text
        x={20}
        y={50}
        width={Math.max(0, note.w - 40)}
        height={Math.max(0, note.h - 70 - wikiFooterHeight)}
        fontSize={15}
        fontFamily={fontFamily}
        lineHeight={1.58}
        fill={atelierPalette.mutedText}
        text={body}
        ellipsis
        listening={false}
      />
    ) : null}
  </>
);
