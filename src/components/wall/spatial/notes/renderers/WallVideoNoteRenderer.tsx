import { Group, Image as KonvaImage, Line, Rect, Text } from "react-konva";

import {
  atelierPalette,
  colorWithAlpha,
} from "@/components/wall/spatial/notes/note-style";
import type { Note } from "@/features/wall/types";

type WallVideoNoteRendererProps = {
  note: Note;
  title: string;
  meta: string;
  currentTime: string;
  duration: string;
  poster?: HTMLImageElement;
  isPlaying: boolean;
  isTimeLocked: boolean;
  onToggleInlineVideoPlayback: (noteId: string) => void;
  onOpenVideoNote: (noteId: string) => void;
  onDownloadVideoNote: (noteId: string) => void;
};

export const WallVideoNoteRenderer = ({
  note,
  title,
  meta,
  currentTime,
  duration,
  poster,
  isPlaying,
  isTimeLocked,
  onToggleInlineVideoPlayback,
  onOpenVideoNote,
  onDownloadVideoNote,
}: WallVideoNoteRendererProps) => {
  const frameWidth = Math.max(0, note.w - 36);
  const frameHeight = Math.max(0, note.h - 124);
  const playButtonX = Math.max(18, (note.w - 102) / 2);
  const playButtonY = Math.max(18, frameHeight / 2 - 26);
  const progressTrackX = Math.max(92, note.w * 0.22);
  const progressTrackWidth = Math.max(56, note.w - 184);

  return (
    <>
      <Rect
        width={note.w}
        height={note.h}
        cornerRadius={22}
        fill={atelierPalette.paper}
        stroke={colorWithAlpha(atelierPalette.quietText, 0.14)}
        strokeWidth={1}
        listening={false}
      />
      <Group x={18} y={18}>
        <Rect
          width={frameWidth}
          height={frameHeight}
          cornerRadius={18}
          fill="rgba(0,0,0,0.001)"
          onMouseDown={(event) => {
            event.cancelBubble = true;
          }}
          onTouchStart={(event) => {
            event.cancelBubble = true;
          }}
          onClick={(event) => {
            if (isTimeLocked) {
              return;
            }
            event.cancelBubble = true;
            onToggleInlineVideoPlayback(note.id);
          }}
          onTap={(event) => {
            if (isTimeLocked) {
              return;
            }
            event.cancelBubble = true;
            onToggleInlineVideoPlayback(note.id);
          }}
        />
        <Rect width={frameWidth} height={frameHeight} cornerRadius={18} fill="#11120f" listening={false} />
        {poster ? (
          <KonvaImage
            image={poster}
            x={0}
            y={0}
            width={frameWidth}
            height={frameHeight}
            cornerRadius={18}
            listening={false}
          />
        ) : null}
        <Rect
          width={frameWidth}
          height={frameHeight}
          cornerRadius={18}
          fill={isPlaying ? "rgba(17,18,15,0.08)" : "rgba(17,18,15,0.16)"}
          listening={false}
        />
        {!isPlaying ? (
          <>
            <Rect
              x={playButtonX}
              y={playButtonY}
              width={66}
              height={66}
              cornerRadius={20}
              fill={colorWithAlpha(atelierPalette.terracotta, 0.9)}
              shadowColor="rgba(0,0,0,0.24)"
              shadowBlur={14}
              shadowOffsetY={6}
              listening={false}
            />
            <Line
              points={[
                playButtonX + 25,
                playButtonY + 25,
                playButtonX + 25,
                playButtonY + 53,
                playButtonX + 49,
                playButtonY + 39,
              ]}
              closed
              fill="#fffaf4"
              listening={false}
            />
          </>
        ) : (
          <>
            <Rect x={20} y={20} width={74} height={24} cornerRadius={12} fill="rgba(17,18,15,0.56)" listening={false} />
            <Text
              x={20}
              y={27}
              width={74}
              align="center"
              fontSize={10}
              fontStyle="bold"
              letterSpacing={1.4}
              fill="rgba(255,250,244,0.92)"
              text="PLAYING"
              listening={false}
            />
          </>
        )}
        <Text
          x={20}
          y={Math.max(18, note.h - 120)}
          width={72}
          fontSize={12}
          fontFamily="JetBrains Mono"
          fill="rgba(255,250,244,0.88)"
          text={currentTime}
          listening={false}
        />
        <Rect
          x={progressTrackX}
          y={Math.max(18, note.h - 115)}
          width={progressTrackWidth}
          height={6}
          cornerRadius={3}
          fill="rgba(255,255,255,0.24)"
          listening={false}
        />
        <Rect
          x={progressTrackX}
          y={Math.max(18, note.h - 115)}
          width={Math.max(28, progressTrackWidth * 0.36)}
          height={6}
          cornerRadius={3}
          fill={atelierPalette.terracotta}
          listening={false}
        />
        <Text
          x={Math.max(0, note.w - 108)}
          y={Math.max(18, note.h - 120)}
          width={72}
          align="right"
          fontSize={12}
          fontFamily="JetBrains Mono"
          fill="rgba(255,250,244,0.88)"
          text={duration}
          listening={false}
        />
      </Group>
      <Text
        x={22}
        y={Math.max(0, note.h - 84)}
        width={Math.max(0, note.w - 92)}
        fontSize={Math.max(18, Math.min(25, note.w / 11.5))}
        fontFamily="Newsreader"
        fontStyle="italic"
        fill={atelierPalette.text}
        text={title}
        ellipsis
        listening={false}
      />
      {meta ? (
        <Text
          x={22}
          y={Math.max(0, note.h - 50)}
          width={Math.max(0, note.w - 96)}
          fontSize={10}
          letterSpacing={1.2}
          fill={colorWithAlpha(atelierPalette.quietText, 0.76)}
          text={meta}
          ellipsis
          listening={false}
        />
      ) : null}
      <Group
        x={Math.max(18, note.w - 54)}
        y={Math.max(0, note.h - 56)}
        onClick={(event) => {
          if (isTimeLocked) {
            return;
          }
          event.cancelBubble = true;
          onDownloadVideoNote(note.id);
        }}
        onTap={(event) => {
          if (isTimeLocked) {
            return;
          }
          event.cancelBubble = true;
          onDownloadVideoNote(note.id);
        }}
      >
        <Text x={0} y={0} width={16} align="center" fontSize={16} fill={colorWithAlpha(atelierPalette.quietText, 0.82)} text="↓" listening={false} />
      </Group>
      <Group
        x={Math.max(42, note.w - 30)}
        y={Math.max(0, note.h - 56)}
        onClick={(event) => {
          if (isTimeLocked) {
            return;
          }
          event.cancelBubble = true;
          onOpenVideoNote(note.id);
        }}
        onTap={(event) => {
          if (isTimeLocked) {
            return;
          }
          event.cancelBubble = true;
          onOpenVideoNote(note.id);
        }}
      >
        <Text x={0} y={0} width={16} align="center" fontSize={16} fill={colorWithAlpha(atelierPalette.quietText, 0.82)} text="↗" listening={false} />
      </Group>
    </>
  );
};
