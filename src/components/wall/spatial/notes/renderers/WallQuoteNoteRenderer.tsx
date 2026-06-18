import { Text } from "react-konva";

import {
  atelierPalette,
  colorWithAlpha,
} from "@/components/wall/spatial/notes/note-style";
import type { Note } from "@/features/wall/types";

type WallQuoteNoteRendererProps = {
  note: Note;
  body: string;
  attribution: string;
  source: string;
  footerLines: number;
  textColor: string;
};

export const WallQuoteNoteRenderer = ({
  note,
  body,
  attribution,
  source,
  footerLines,
  textColor,
}: WallQuoteNoteRendererProps) => {
  const quoteFooterHeight = footerLines > 1 ? 40 : footerLines === 1 ? 24 : 0;

  return (
    <>
      <Text
        x={Math.max(24, note.w - 54)}
        y={14}
        width={34}
        align="right"
        fontSize={38}
        fontFamily="Newsreader"
        fill={colorWithAlpha(atelierPalette.terracotta, 0.18)}
        text="””"
        listening={false}
      />
      <Text
        x={24}
        y={34}
        width={Math.max(0, note.w - 50)}
        height={Math.max(24, note.h - quoteFooterHeight - 64)}
        fontSize={Math.max(20, Math.min(30, Math.min(note.w / 6.6, note.h / 4.6)))}
        fontFamily="Newsreader"
        fontStyle="italic"
        fill={textColor}
        lineHeight={1.18}
        text={body}
        ellipsis
        listening={false}
      />
      {attribution ? (
        <Text
          x={24}
          y={Math.max(12, note.h - (footerLines > 1 ? 38 : 24))}
          width={Math.max(0, note.w - 48)}
          fontSize={10}
          fontStyle="bold"
          fill={colorWithAlpha(atelierPalette.forest, 0.82)}
          letterSpacing={1.6}
          text={`- ${attribution.toUpperCase()}`}
          wrap="none"
          ellipsis
          listening={false}
        />
      ) : null}
      {source ? (
        <Text
          x={24}
          y={Math.max(12, note.h - 20)}
          width={Math.max(0, note.w - 48)}
          fontSize={9}
          fill={colorWithAlpha(atelierPalette.mutedText, 0.68)}
          letterSpacing={1.1}
          text={source.toUpperCase()}
          wrap="none"
          ellipsis
          listening={false}
        />
      ) : null}
    </>
  );
};
