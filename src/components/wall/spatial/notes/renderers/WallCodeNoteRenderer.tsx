import { Group, Rect, Text } from "react-konva";

import { parseCodeNote, tokenizeCodeLine } from "@/components/wall/codeNoteRendering";
import type { Note } from "@/features/wall/types";

type WallCodeNoteRendererProps = {
  note: Note;
  text: string;
};

export const WallCodeNoteRenderer = ({ note, text }: WallCodeNoteRendererProps) => {
  const parsedCodeNote = parseCodeNote(text);
  const renderedCodeLines = parsedCodeNote?.body.split("\n").slice(0, 8) ?? [];

  return (
    <>
      <Rect width={note.w} height={note.h} cornerRadius={18} fill="#1E1E1E" listening={false} />
      <Rect width={note.w} height={note.h} cornerRadius={18} stroke="rgba(255,255,255,0.06)" strokeWidth={1} listening={false} />
      <Rect x={18} y={18} width={10} height={10} cornerRadius={5} fill="#FF5F56" listening={false} />
      <Rect x={34} y={18} width={10} height={10} cornerRadius={5} fill="#FFBD2E" listening={false} />
      <Rect x={50} y={18} width={10} height={10} cornerRadius={5} fill="#27C93F" listening={false} />
      <Text
        x={Math.max(108, note.w - 144)}
        y={18}
        width={92}
        align="right"
        fontSize={9}
        fontFamily="JetBrains Mono"
        fontStyle="bold"
        letterSpacing={1.1}
        fill="rgba(255,255,255,0.42)"
        text={(parsedCodeNote?.fileName ?? "main.py").toUpperCase()}
        ellipsis
        listening={false}
      />
      <Group x={Math.max(18, note.w - 48)} y={16} listening={false}>
        <Rect x={6} y={2} width={12} height={14} cornerRadius={2} fill="rgba(255,255,255,0.14)" />
        <Rect x={2} y={6} width={12} height={14} cornerRadius={2} fill="rgba(255,255,255,0.24)" />
      </Group>
      {renderedCodeLines.map((line, lineIndex) => {
        const segments = tokenizeCodeLine(line, parsedCodeNote?.language ?? "plain");
        let cursorX = 22;
        const baseY = 64 + lineIndex * 26;

        return (
          <Group key={`${note.id}-code-line-${lineIndex}`} listening={false}>
            {segments.map((segment, segmentIndex) => {
              const fill =
                segment.tone === "keyword" ? "#c586c0" :
                  segment.tone === "string" ? "#ce9178" :
                    segment.tone === "comment" ? "#6a9955" :
                      segment.tone === "number" ? "#b5cea8" :
                        segment.tone === "function" ? "#dcdcaa" :
                          segment.tone === "variable" ? "#9cdcfe" :
                            segment.tone === "property" ? "#7fc7ff" :
                              segment.tone === "command" ? "#4fc1ff" :
                                "#d4d4d4";
              const segmentText = segment.text.replace(/\t/g, "  ");
              const widthEstimate = segmentText.length * 7.2;
              const node = (
                <Text
                  key={`${note.id}-code-line-${lineIndex}-segment-${segmentIndex}`}
                  x={cursorX}
                  y={baseY}
                  fontSize={12}
                  fontFamily="JetBrains Mono"
                  lineHeight={1.45}
                  fill={fill}
                  text={segmentText}
                />
              );
              cursorX += widthEstimate;
              return node;
            })}
          </Group>
        );
      })}
    </>
  );
};
