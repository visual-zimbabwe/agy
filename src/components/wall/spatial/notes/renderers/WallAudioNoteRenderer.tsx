import { Group, Rect, Text } from "react-konva";

import {
  atelierPalette,
  colorWithAlpha,
} from "@/components/wall/spatial/notes/note-style";
import { AUDIO_WAVEFORM_BARS } from "@/features/wall/audio-notes";
import type { Note } from "@/features/wall/types";

type WallAudioNoteRendererProps = {
  note: Note;
  title: string;
  meta: string;
  currentTime: string;
  duration: string;
  isPlaying: boolean;
  playingCurrentTimeSeconds?: number;
  isTimeLocked: boolean;
  onToggleAudioPlayback: (noteId: string) => void;
  onOpenAudioNote: (noteId: string) => void;
  onDownloadAudioNote: (noteId: string) => void;
};

export const WallAudioNoteRenderer = ({
  note,
  title,
  meta,
  currentTime,
  duration,
  isPlaying,
  playingCurrentTimeSeconds,
  isTimeLocked,
  onToggleAudioPlayback,
  onOpenAudioNote,
  onDownloadAudioNote,
}: WallAudioNoteRendererProps) => (
  <>
    <Rect
      width={note.w}
      height={note.h}
      cornerRadius={18}
      fill={atelierPalette.paper}
      stroke={colorWithAlpha(atelierPalette.quietText, 0.16)}
      strokeWidth={1}
      listening={false}
    />
    <Rect x={24} y={24} width={58} height={58} cornerRadius={16} fill={colorWithAlpha(atelierPalette.forest, 0.1)} listening={false} />
    <Text x={24} y={38} width={58} align="center" fontSize={26} fill={atelierPalette.forest} text="♪" listening={false} />
    <Group
      x={Math.max(24, note.w / 2 - 28)}
      y={24}
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
        onToggleAudioPlayback(note.id);
      }}
      onTap={(event) => {
        if (isTimeLocked) {
          return;
        }
        event.cancelBubble = true;
        onToggleAudioPlayback(note.id);
      }}
    >
      <Rect width={56} height={22} cornerRadius={11} fill={colorWithAlpha(atelierPalette.terracotta, 0.1)} stroke={colorWithAlpha(atelierPalette.terracotta, 0.18)} strokeWidth={1} />
      <Text x={0} y={6} width={56} align="center" fontSize={11} fontStyle="bold" fill={colorWithAlpha(atelierPalette.terracotta, 0.82)} text={isPlaying ? "PAUSE" : "PLAY"} listening={false} />
    </Group>
    <Group
      x={Math.max(20, note.w - 86)}
      y={26}
      onClick={(event) => {
        if (isTimeLocked) {
          return;
        }
        event.cancelBubble = true;
        onDownloadAudioNote(note.id);
      }}
      onTap={(event) => {
        if (isTimeLocked) {
          return;
        }
        event.cancelBubble = true;
        onDownloadAudioNote(note.id);
      }}
    >
      <Text x={0} y={0} width={18} align="center" fontSize={16} fill={colorWithAlpha(atelierPalette.quietText, 0.8)} text="↓" listening={false} />
    </Group>
    <Group
      x={Math.max(44, note.w - 48)}
      y={26}
      onClick={(event) => {
        if (isTimeLocked) {
          return;
        }
        event.cancelBubble = true;
        onOpenAudioNote(note.id);
      }}
      onTap={(event) => {
        if (isTimeLocked) {
          return;
        }
        event.cancelBubble = true;
        onOpenAudioNote(note.id);
      }}
    >
      <Text x={0} y={0} width={18} align="center" fontSize={16} fill={colorWithAlpha(atelierPalette.quietText, 0.8)} text="↗" listening={false} />
    </Group>
    <Text
      x={24}
      y={96}
      width={Math.max(0, note.w - 48)}
      fontSize={Math.max(24, Math.min(34, note.w / 11))}
      fontFamily="Newsreader"
      fontStyle="italic"
      fill={atelierPalette.text}
      text={title}
      ellipsis
      listening={false}
    />
    {meta ? (
      <Text
        x={24}
        y={132}
        width={Math.max(0, note.w - 48)}
        fontSize={10}
        letterSpacing={1.2}
        fill={colorWithAlpha(atelierPalette.quietText, 0.78)}
        text={meta}
        ellipsis
        listening={false}
      />
    ) : null}
    {AUDIO_WAVEFORM_BARS.map((value, index) => {
      const barWidth = Math.max(8, Math.floor((note.w - 76) / AUDIO_WAVEFORM_BARS.length));
      const x = 24 + index * (barWidth + 2);
      const pulseOffset = isPlaying ? ((index + Math.floor((playingCurrentTimeSeconds ?? 0) * 8)) % 3) * 2 : 0;
      const barHeight = Math.max(10, Math.round(40 * value) - pulseOffset);
      const active = isPlaying ? index >= 3 && index <= 5 : index >= 4 && index <= 5;

      return (
        <Rect
          key={`${note.id}-audio-wave-${index}`}
          x={x}
          y={Math.max(160, note.h - 80 - barHeight)}
          width={barWidth}
          height={barHeight}
          cornerRadius={barWidth / 2}
          fill={active ? atelierPalette.terracotta : colorWithAlpha("#DFC0B8", 0.44)}
          listening={false}
        />
      );
    })}
    <Text x={24} y={Math.max(180, note.h - 28)} width={72} fontSize={12} fontFamily="JetBrains Mono" fill={colorWithAlpha(atelierPalette.quietText, 0.82)} text={currentTime} listening={false} />
    <Text x={Math.max(0, note.w / 2 - 40)} y={Math.max(180, note.h - 29)} width={80} align="center" fontSize={10} fontStyle="bold" letterSpacing={1.3} fill={colorWithAlpha(atelierPalette.terracotta, 0.66)} text={isPlaying ? "PLAYING" : "READY"} listening={false} />
    <Text x={Math.max(24, note.w - 96)} y={Math.max(180, note.h - 28)} width={72} align="right" fontSize={12} fontFamily="JetBrains Mono" fill={colorWithAlpha(atelierPalette.quietText, 0.82)} text={duration} listening={false} />
  </>
);
