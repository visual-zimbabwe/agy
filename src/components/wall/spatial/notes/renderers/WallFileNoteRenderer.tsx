import { Group, Rect, Text } from "react-konva";

import {
  atelierPalette,
  colorWithAlpha,
} from "@/components/wall/spatial/notes/note-style";
import type { Note } from "@/features/wall/types";

type WallFileNoteRendererProps = {
  note: Note;
  label: string;
  meta: string;
  isTimeLocked: boolean;
  onDownloadFileNote: (noteId: string) => void;
};

export const WallFileNoteRenderer = ({
  note,
  label,
  meta,
  isTimeLocked,
  onDownloadFileNote,
}: WallFileNoteRendererProps) => (
  <>
    <Rect
      width={note.w}
      height={note.h}
      cornerRadius={14}
      fill={atelierPalette.paper}
      stroke={colorWithAlpha(atelierPalette.quietText, 0.16)}
      strokeWidth={1}
      listening={false}
    />
    <Rect
      x={18}
      y={Math.max(16, note.h / 2 - 30)}
      width={46}
      height={46}
      cornerRadius={12}
      fill={colorWithAlpha(atelierPalette.terracotta, 0.1)}
      listening={false}
    />
    <Text
      x={18}
      y={Math.max(25, note.h / 2 - 21)}
      width={46}
      align="center"
      fontSize={22}
      fill={atelierPalette.terracotta}
      text="▤"
      listening={false}
    />
    <Text
      x={78}
      y={Math.max(18, note.h / 2 - 24)}
      width={Math.max(0, note.w - 120)}
      fontSize={13}
      fontStyle="bold"
      fill={atelierPalette.text}
      text={label}
      ellipsis
      listening={false}
    />
    <Text
      x={78}
      y={Math.max(38, note.h / 2 - 4)}
      width={Math.max(0, note.w - 120)}
      fontSize={10}
      fill={colorWithAlpha(atelierPalette.quietText, 0.8)}
      text={meta.toUpperCase()}
      ellipsis
      listening={false}
    />
    <Group
      x={Math.max(18, note.w - 42)}
      y={Math.max(26, note.h / 2 - 18)}
      onClick={(event) => {
        if (isTimeLocked) {
          return;
        }
        event.cancelBubble = true;
        onDownloadFileNote(note.id);
      }}
      onTap={(event) => {
        if (isTimeLocked) {
          return;
        }
        event.cancelBubble = true;
        onDownloadFileNote(note.id);
      }}
    >
      <Text
        x={0}
        y={0}
        width={18}
        align="center"
        fontSize={16}
        fill={colorWithAlpha(atelierPalette.quietText, 0.58)}
        text="↓"
        listening={false}
      />
    </Group>
  </>
);
