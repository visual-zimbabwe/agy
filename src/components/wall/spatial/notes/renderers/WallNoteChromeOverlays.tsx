import { Group, Rect, Text } from "react-konva";

import type { Note } from "@/features/wall/types";

type WikiLinkChip = {
  targetNoteId: string;
  title: string;
};

type WallNoteChromeOverlaysProps = {
  note: Note;
  cornerRadius: number;
  isHighlighted: boolean;
  isPinned: boolean;
  showHeatmap: boolean;
  heatmapReferenceTs: number;
  colorWashOpacity: number;
  showNoteTags: boolean;
  isPrivate: boolean;
  isImageNote: boolean;
  isEisenhower: boolean;
  isVideo: boolean;
  isBookmark: boolean;
  wikiLinks: WikiLinkChip[];
  noteTags: string[];
  overflowTags: number;
  tagPalette: { bg: string; border: string; text: string };
  isTimeLocked: boolean;
  recencyIntensity: (updatedAt: number, referenceTs: number, windowMs?: number) => number;
  onNavigateWikiLink: (noteId: string) => void;
};

export const WallNoteChromeOverlays = ({
  note,
  cornerRadius,
  isHighlighted,
  isPinned,
  showHeatmap,
  heatmapReferenceTs,
  colorWashOpacity,
  showNoteTags,
  isPrivate,
  isImageNote,
  isEisenhower,
  isVideo,
  isBookmark,
  wikiLinks,
  noteTags,
  overflowTags,
  tagPalette,
  isTimeLocked,
  recencyIntensity,
  onNavigateWikiLink,
}: WallNoteChromeOverlaysProps) => (
  <>
    {isHighlighted ? (
      <Rect
        width={note.w}
        height={note.h}
        cornerRadius={cornerRadius}
        stroke="#fbbf24"
        strokeWidth={1.2}
        opacity={0.8}
        dash={[7, 4]}
      />
    ) : null}
    {isPinned ? (
      <Text
        x={Math.max(12, note.w - 42)}
        y={10}
        width={30}
        align="right"
        fontSize={10}
        fontStyle="bold"
        fill="#334155"
        text="PIN"
      />
    ) : null}
    {showHeatmap ? (
      <Rect
        width={note.w}
        height={note.h}
        cornerRadius={cornerRadius}
        fill="#ef4444"
        opacity={0.08 + recencyIntensity(note.updatedAt, heatmapReferenceTs) * 0.35}
      />
    ) : null}
    {colorWashOpacity > 0 ? (
      <Rect width={note.w} height={note.h} cornerRadius={cornerRadius} fill="#ffffff" opacity={colorWashOpacity} />
    ) : null}
    {wikiLinks.length > 0 && !isImageNote && !isEisenhower && !isBookmark
      ? wikiLinks.slice(0, 4).map((wikiLink, index) => {
          const column = index % 2;
          const row = Math.floor(index / 2);
          const chipWidth = Math.max(74, Math.min((note.w - 30) / 2, 112));
          const x = 12 + column * (chipWidth + 8);
          const y = Math.max(12, note.h - 28 - row * 20 - (showNoteTags ? 20 : 0));

          return (
            <Group
              key={`${note.id}-wiki-${wikiLink.targetNoteId}`}
              onClick={(event) => {
                if (isTimeLocked) {
                  return;
                }
                event.cancelBubble = true;
                onNavigateWikiLink(wikiLink.targetNoteId);
              }}
              onTap={(event) => {
                if (isTimeLocked) {
                  return;
                }
                event.cancelBubble = true;
                onNavigateWikiLink(wikiLink.targetNoteId);
              }}
            >
              <Rect
                x={x}
                y={y}
                width={chipWidth}
                height={16}
                cornerRadius={8}
                fill="rgba(248,250,252,0.9)"
                stroke="rgba(100,116,139,0.55)"
                strokeWidth={0.8}
              />
              <Text
                x={x + 7}
                y={y + 2}
                width={chipWidth - 14}
                fontSize={10}
                fontStyle="bold"
                fill="#475569"
                text={wikiLink.title}
                wrap="none"
                ellipsis
              />
            </Group>
          );
        })
      : null}
    {showNoteTags && !isPrivate && !isImageNote && !isEisenhower && !isVideo
      ? noteTags.map((tag, index) => (
          <Group key={`${note.id}-tag-${tag}`}>
            <Rect
              x={12 + index * 64}
              y={Math.max(10, note.h - 25)}
              width={60}
              height={16}
              cornerRadius={8}
              fill={tagPalette.bg}
              stroke={tagPalette.border}
              strokeWidth={0.8}
            />
            <Text
              x={16 + index * 64}
              y={Math.max(12, note.h - 23)}
              width={52}
              fontSize={10}
              fill={tagPalette.text}
              text={`#${tag}`}
              wrap="none"
              ellipsis
            />
          </Group>
        ))
      : null}
    {showNoteTags && !isPrivate && !isImageNote && !isEisenhower && !isVideo && overflowTags > 0 ? (
      <Text
        x={Math.max(12, note.w - 36)}
        y={Math.max(12, note.h - 23)}
        width={24}
        align="right"
        fontSize={10}
        fill={tagPalette.text}
        text={`+${overflowTags}`}
      />
    ) : null}
  </>
);
