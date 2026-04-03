"use client";

import { useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Layer, Stage } from "react-konva";
import type Konva from "konva";

import { getNoteTextFontFamily, getNoteTextStyle, noteTagChipPalette, recencyIntensity, truncateNoteText } from "@/components/wall/wall-canvas-helpers";
import { WallNotesLayer } from "@/components/wall/WallNotesLayer";
import type { Note } from "@/features/wall/types";

type WallRenderedNoteProps = {
  note: Note;
  width: number;
  height: number;
  showNoteTags?: boolean;
};

type GuideLineState = {
  vertical?: { x: number; y1: number; y2: number; distance?: number };
  horizontal?: { y: number; x1: number; x2: number; distance?: number };
};

const noop = () => undefined;

export const WallRenderedNote = ({ note, width, height, showNoteTags = true }: WallRenderedNoteProps) => {
  const stageRef = useRef<Konva.Stage | null>(null);
  const noteNodeRefs = useRef<Record<string, Konva.Group | null>>({});
  const dragSelectionStartRef = useRef<Record<string, { x: number; y: number }> | null>(null);
  const dragAnchorRef = useRef<{ id: string; x: number; y: number; } | null>(null);
  const dragSingleStartRef = useRef<{ id: string; x: number; y: number; altClone: boolean } | null>(null);
  const [hoveredNoteId, setHoveredNoteId] = useState<string | undefined>(undefined);
  const [draggingNoteId, setDraggingNoteId] = useState<string | undefined>(undefined);
  const [resizingNoteDrafts, setResizingNoteDrafts] = useState<Record<string, { x: number; y: number; w: number; h: number }>>({});
  const [, setGuideLines] = useState<GuideLineState>({});
  const [, setEditing] = useState<{ id: string; text: string } | null>(null);
  const setEditingDispatch = setEditing as Dispatch<SetStateAction<{ id: string; text: string } | null>>;

  const renderedNote = useMemo<Note>(() => ({
    ...note,
    x: 0,
    y: 0,
  }), [note]);

  const notesById = useMemo<Record<string, Note>>(() => ({
    [renderedNote.id]: renderedNote,
  }), [renderedNote]);

  return (
    <div style={{ width, height }}>
      <Stage
        ref={(node) => {
          stageRef.current = node;
        }}
        width={width}
        height={height}
        listening={false}
      >
        <Layer listening={false}>
          <WallNotesLayer
            visibleNotes={[renderedNote]}
            renderDetailLevel="full"
            renderBudget={{
              detailLevel: "full",
              overscanWorldPx: 0,
              maxRenderedNotes: 1,
              maxDecodedMediaNotes: 18,
              allowImageAutoLayout: true,
              totalVisibleNoteCount: 1,
              culledNoteCount: 0,
            }}
            activeSelectedNoteIds={[]}
            hoveredNoteId={hoveredNoteId}
            draggingNoteId={draggingNoteId}
            resizingNoteDrafts={resizingNoteDrafts}
            notesById={notesById}
            linkType="wiki"
            isTimeLocked
            showHeatmap={false}
            heatmapReferenceTs={0}
            showNoteTags={showNoteTags}
            noteNodeRefs={noteNodeRefs}
            dragSelectionStartRef={dragSelectionStartRef}
            dragAnchorRef={dragAnchorRef}
            dragSingleStartRef={dragSingleStartRef}
            setHoveredNoteId={setHoveredNoteId}
            setDraggingNoteId={setDraggingNoteId}
            setGuideLines={setGuideLines}
            setResizingNoteDrafts={setResizingNoteDrafts}
            syncPrimarySelection={noop}
            selectSingleNote={noop}
            toggleSelectNote={noop}
            setLinkingFromNote={noop}
            setEditing={setEditingDispatch}
            openEditor={noop}
            createLink={noop}
            resolveSnappedPosition={(_, candidateX, candidateY) => ({ x: candidateX, y: candidateY })}
            runHistoryGroup={(action) => action()}
            moveNote={noop}
            updateNote={noop}
            openImageInsert={noop}
            toggleVocabularyFlip={noop}
            duplicateNoteAt={noop}
            getNoteTextStyle={getNoteTextStyle}
            getNoteTextFontFamily={getNoteTextFontFamily}
            truncateNoteText={truncateNoteText}
            noteTagChipPalette={noteTagChipPalette}
            recencyIntensity={recencyIntensity}
            wikiLinksByNoteId={{}}
            onNavigateWikiLink={noop}
            openExternalUrl={noop}
            onDownloadFileNote={noop}
            onToggleAudioPlayback={noop}
            onOpenAudioNote={noop}
            onDownloadAudioNote={noop}
            onToggleInlineVideoPlayback={noop}
            onOpenVideoNote={noop}
            onDownloadVideoNote={noop}
          />
        </Layer>
      </Stage>
    </div>
  );
};
