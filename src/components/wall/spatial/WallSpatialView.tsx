"use client";

import {
  type Dispatch,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from "react";
import { Layer, Rect } from "react-konva";
import type Konva from "konva";

import { WallDotMatrixLayer } from "@/components/wall/WallDotMatrixLayer";
import { WallFloatingUi } from "@/components/wall/WallFloatingUi";
import { WallLinksZonesLayer } from "@/components/wall/WallLinksZonesLayer";
import { WallNotesLayer } from "@/components/wall/WallNotesLayer";
import { WallOverlaysLayer } from "@/components/wall/WallOverlaysLayer";
import { WallStage } from "@/components/wall/WallStage";
import {
  getNoteTextStyle,
  getNoteTextFontFamily,
  noteTagChipPalette,
  recencyIntensity,
  tagGroupColor,
  truncateNoteText,
} from "@/components/wall/wall-canvas-helpers";
import { linkColorByType, linkPoints, linkStrokeByType } from "@/components/wall/wall-links-geometry";
import { toWorldPoint } from "@/components/wall/wall-coordinates";
import { NOTE_DEFAULTS, ZONE_DEFAULTS } from "@/features/wall/constants";
import type { Link, LinkType, Note, WallAssetMap, Zone } from "@/features/wall/types";
import type { WallRenderBudget, WallRenderDetailLevel } from "@/features/wall/windowing";
import { getImageFilesFromDataTransfer } from "@/lib/wall-image-upload";
import { getVideoPlayback } from "@/features/wall/video-notes";

type Bounds = { x: number; y: number; w: number; h: number };
type TagGroup = { tag: string; noteIds: string[]; bounds: Bounds };
type TagLabelLayout = Record<string, { x: number; y: number }>;

type CameraState = { x: number; y: number; zoom: number };
type ViewportState = { w: number; h: number };

type SelectionBox = {
  startX: number;
  startY: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

type GuideLineState = {
  vertical?: { x: number; y1: number; y2: number; distance?: number };
  horizontal?: { y: number; x1: number; x2: number; distance?: number };
};

type ResizeDraft = { x: number; y: number; w: number; h: number };

type LayoutPreferences = {
  showToolsPanel: boolean;
  showDetailsPanel: boolean;
  showContextBar: boolean;
  showNoteTags: boolean;
};

type SpatialPreferences = {
  showDotMatrix: boolean;
  snapToGuides: boolean;
  snapToGrid: boolean;
  dotGridSpacing: number;
};

type InlineVideoScreenRect = {
  left: number;
  top: number;
  width: number;
  height: number;
  title: string;
  playback: NonNullable<ReturnType<typeof getVideoPlayback>>;
  posterUrl?: string;
};

export type WallSpatialViewProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  stageRef: MutableRefObject<Konva.Stage | null>;
  noteTransformerRef: MutableRefObject<Konva.Transformer | null>;
  zoneTransformerRef: MutableRefObject<Konva.Transformer | null>;
  noteNodeRefs: MutableRefObject<Record<string, Konva.Group | null>>;
  zoneNodeRefs: MutableRefObject<Record<string, Konva.Group | null>>;
  dragSelectionStartRef: MutableRefObject<Record<string, { x: number; y: number }> | null>;
  dragAnchorRef: MutableRefObject<{ id: string; x: number; y: number } | null>;
  dragSingleStartRef: MutableRefObject<{ id: string; x: number; y: number; altClone: boolean } | null>;
  wallInlineVideoRef: MutableRefObject<HTMLVideoElement | null>;
  hydrated: boolean;
  readingMode: boolean;
  timelineViewActive: boolean;
  isFocusMode: boolean;
  isImageDragOver: boolean;
  isTimeLocked: boolean;
  isSpaceDown: boolean;
  isMiddleDragging: boolean;
  isLeftCanvasDragging: boolean;
  boxSelectMode: boolean;
  camera: CameraState;
  viewport: ViewportState;
  spatialPrefs: SpatialPreferences;
  layoutPrefs: LayoutPreferences;
  setCamera: (camera: CameraState) => void;
  setIsMiddleDragging: Dispatch<SetStateAction<boolean>>;
  setIsLeftCanvasDragging: Dispatch<SetStateAction<boolean>>;
  setIsImageDragOver: Dispatch<SetStateAction<boolean>>;
  setGuideLines: Dispatch<SetStateAction<GuideLineState>>;
  setFocusedNoteId: Dispatch<SetStateAction<string | undefined>>;
  setInlinePlayingVideoNoteId: Dispatch<SetStateAction<string | undefined>>;
  setEditing: Dispatch<SetStateAction<{ id: string; text: string; focusField?: string } | null>>;
  setHoveredNoteId: Dispatch<SetStateAction<string | undefined>>;
  setDraggingNoteId: Dispatch<SetStateAction<string | undefined>>;
  setResizingNoteDrafts: Dispatch<SetStateAction<Record<string, ResizeDraft>>>;
  setLinkMenu: Dispatch<SetStateAction<{ open: boolean; x: number; y: number; linkId?: string }>>;
  selectionBox: SelectionBox | null;
  setSelectionBox: Dispatch<SetStateAction<SelectionBox | null>>;
  guideLines: GuideLineState;
  showHeatmap: boolean;
  heatmapReferenceTs: number;
  layerVisibleNotes: Note[];
  layerVisibleZones: Zone[];
  layerVisibleLinks: Link[];
  layerRenderDetailLevel: WallRenderDetailLevel;
  layerRenderBudget: WallRenderBudget;
  resolvedWallAssets: WallAssetMap;
  activeSelectedNoteIds: string[];
  displayNotesById: Record<string, Note>;
  renderSnapshotNotes: Record<string, Note>;
  renderPathLinkIds: Set<string>;
  clusterBounds: Bounds[];
  autoTagGroups: TagGroup[];
  autoTagLabelLayout: TagLabelLayout;
  showAutoTagGroups: boolean;
  wikiLinksByNoteId: Record<string, Array<{ targetNoteId: string; title: string }>>;
  resizingNoteDrafts: Record<string, ResizeDraft>;
  hoveredNoteId?: string;
  draggingNoteId?: string;
  inlinePlayingVideoNoteId?: string;
  inlinePlayingVideoScreenRect: InlineVideoScreenRect | null;
  playingAudioNoteId?: string;
  playingAudioCurrentTimeSeconds: number;
  playingAudioDurationSeconds?: number;
  selectedNoteId?: string;
  selectedLinkId?: string;
  selectedZoneId?: string;
  flashNoteId?: string;
  linkingFromNoteId?: string;
  linkType: LinkType;
  editingId?: string;
  stopCameraAnimation: () => void;
  resetSelection: () => void;
  clearNoteSelection: () => void;
  finalizeBoxSelection: () => void;
  findNoteAtWorldPoint: (x: number, y: number) => Note | undefined;
  handleImageFileInsert: (file: File, target?: { noteId?: string; x?: number; y?: number }) => void | Promise<void>;
  syncPrimarySelection: (noteIds: string[]) => void;
  selectSingleNote: (noteId: string) => void;
  toggleSelectNote: (noteId: string) => void;
  selectLink: (linkId: string) => void;
  selectZone: (zoneId: string) => void;
  selectGroup: (groupId: string) => void;
  setLinkingFromNote: (noteId: string | undefined) => void;
  openEditor: (noteId: string, text: string) => void;
  openImageInsert: (noteId: string) => void;
  resolveSnappedPosition: (note: Note, candidateX: number, candidateY: number) => { x: number; y: number };
  runHistoryGroup: (action: () => void) => void;
  moveNote: (noteId: string, x: number, y: number) => void;
  updateNote: (noteId: string, patch: Partial<Note>) => void;
  moveZone: (zoneId: string, x: number, y: number) => void;
  updateZone: (zoneId: string, patch: Partial<Zone>) => void;
  createLink: (fromNoteId: string, toNoteId: string, type: LinkType) => void;
  toggleVocabularyFlip: (noteId: string) => void;
  duplicateNoteAt: (noteId: string, x: number, y: number) => void;
  focusNote: (noteId: string) => void;
  openBookmarkUrl: (url: string) => void;
  downloadFileNote: (noteId: string) => void;
  toggleAudioNotePlayback: (noteId: string) => void;
  openAudioNote: (noteId: string) => void;
  downloadAudioNote: (noteId: string) => void;
  toggleInlineVideoPlayback: (noteId: string) => void;
  downloadVideoNote: (noteId: string) => void;
  showClusters: boolean;
  chromeSlot?: ReactNode;
};

export const WallSpatialView = ({
  containerRef,
  stageRef,
  noteTransformerRef,
  zoneTransformerRef,
  noteNodeRefs,
  zoneNodeRefs,
  dragSelectionStartRef,
  dragAnchorRef,
  dragSingleStartRef,
  wallInlineVideoRef,
  hydrated,
  readingMode,
  timelineViewActive,
  isFocusMode,
  isImageDragOver,
  isTimeLocked,
  isSpaceDown,
  isMiddleDragging,
  isLeftCanvasDragging,
  boxSelectMode,
  camera,
  viewport,
  spatialPrefs,
  layoutPrefs,
  setCamera,
  setIsMiddleDragging,
  setIsLeftCanvasDragging,
  setIsImageDragOver,
  setGuideLines,
  setFocusedNoteId,
  setInlinePlayingVideoNoteId,
  setEditing,
  setHoveredNoteId,
  setDraggingNoteId,
  setResizingNoteDrafts,
  setLinkMenu,
  selectionBox,
  setSelectionBox,
  guideLines,
  showHeatmap,
  heatmapReferenceTs,
  layerVisibleNotes,
  layerVisibleZones,
  layerVisibleLinks,
  layerRenderDetailLevel,
  layerRenderBudget,
  resolvedWallAssets,
  activeSelectedNoteIds,
  displayNotesById,
  renderSnapshotNotes,
  renderPathLinkIds,
  clusterBounds,
  autoTagGroups,
  autoTagLabelLayout,
  showAutoTagGroups,
  wikiLinksByNoteId,
  resizingNoteDrafts,
  hoveredNoteId,
  draggingNoteId,
  inlinePlayingVideoNoteId,
  inlinePlayingVideoScreenRect,
  playingAudioNoteId,
  playingAudioCurrentTimeSeconds,
  playingAudioDurationSeconds,
  selectedNoteId,
  selectedLinkId,
  selectedZoneId,
  flashNoteId,
  linkingFromNoteId,
  linkType,
  editingId,
  stopCameraAnimation,
  resetSelection,
  clearNoteSelection,
  finalizeBoxSelection,
  findNoteAtWorldPoint,
  handleImageFileInsert,
  syncPrimarySelection,
  selectSingleNote,
  toggleSelectNote,
  selectLink,
  selectZone,
  selectGroup,
  setLinkingFromNote,
  openEditor,
  openImageInsert,
  resolveSnappedPosition,
  runHistoryGroup,
  moveNote,
  updateNote,
  moveZone,
  updateZone,
  createLink,
  toggleVocabularyFlip,
  duplicateNoteAt,
  focusNote,
  openBookmarkUrl,
  downloadFileNote,
  toggleAudioNotePlayback,
  openAudioNote,
  downloadAudioNote,
  toggleInlineVideoPlayback,
  downloadVideoNote,
  showClusters,
  chromeSlot,
}: WallSpatialViewProps) => (
  <div
    ref={containerRef}
    data-tour-anchor="canvas"
    className={`relative flex-1 overflow-hidden ${
      timelineViewActive ? "cursor-default" : isSpaceDown || isMiddleDragging || isLeftCanvasDragging ? "cursor-grabbing" : "cursor-grab"
    }`}
    onDragOver={(event) => {
      const files = getImageFilesFromDataTransfer(event.dataTransfer);
      if (isTimeLocked || files.length === 0) {
        return;
      }
      event.preventDefault();
      setIsImageDragOver(true);
    }}
    onDragLeave={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
        setIsImageDragOver(false);
      }
    }}
    onDrop={(event) => {
      const files = getImageFilesFromDataTransfer(event.dataTransfer);
      if (isTimeLocked || files.length === 0) {
        return;
      }
      event.preventDefault();
      setIsImageDragOver(false);
      const bounds = containerRef.current?.getBoundingClientRect();
      if (!bounds) {
        return;
      }
      const droppedFile = files[0];
      if (!droppedFile) {
        return;
      }
      const world = toWorldPoint(event.clientX - bounds.left, event.clientY - bounds.top, camera);
      const targetNote = findNoteAtWorldPoint(world.x, world.y);
      void handleImageFileInsert(droppedFile, targetNote ? { noteId: targetNote.id } : world);
    }}
    onMouseUp={() => {
      setIsMiddleDragging(false);
      setIsLeftCanvasDragging(false);
      setGuideLines({});
      finalizeBoxSelection();
    }}
    onMouseLeave={() => {
      setIsMiddleDragging(false);
      setIsLeftCanvasDragging(false);
      setGuideLines({});
      finalizeBoxSelection();
    }}
    onContextMenu={(event) => {
      event.preventDefault();
    }}
  >
    {!hydrated && (
      <div className="absolute inset-0 z-10 grid place-items-center bg-[color:rgb(24_32_44_/_0.12)] backdrop-blur-sm">
        <p className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-sm text-[var(--color-text-muted)] shadow-[var(--shadow-sm)]">
          Loading wall...
        </p>
      </div>
    )}

    {readingMode && (
      <div className="pointer-events-auto absolute right-4 top-4 z-[45] rounded-full border border-[var(--color-border)] bg-[var(--color-surface-glass)] px-3 py-1.5 text-[11px] text-[var(--color-text-muted)] shadow-[var(--shadow-sm)] backdrop-blur-[var(--blur-panel)]">
        Reading mode. Press R to exit.
      </div>
    )}

    {isFocusMode && !readingMode && (
      <button
        type="button"
        onClick={() => setFocusedNoteId(undefined)}
        className="pointer-events-auto absolute right-4 top-4 z-[45] rounded-full border border-[var(--color-border)] bg-[var(--color-surface-glass)] px-3 py-1.5 text-[11px] text-[var(--color-text-muted)] shadow-[var(--shadow-sm)] backdrop-blur-[var(--blur-panel)] hover:bg-[var(--color-surface)]"
      >
        Focus mode. Click to exit.
      </button>
    )}

    {isImageDragOver && !isTimeLocked && (
      <div className="pointer-events-none absolute inset-6 z-[44] rounded-[32px] border-2 border-dashed border-[var(--color-accent-strong)] bg-[rgba(255,248,232,0.78)] shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm">
        <div className="grid h-full place-items-center text-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Drop Image</p>
            <p className="mt-3 font-[Georgia] text-3xl text-[var(--color-text)]">Release to insert image</p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Drop on empty canvas to create a new media card, or drop on a note to replace its image.</p>
          </div>
        </div>
      </div>
    )}

    {chromeSlot}

    {!timelineViewActive && (
      <WallStage
        stageRef={stageRef}
        viewport={viewport}
        camera={camera}
        setCamera={setCamera}
        isSpaceDown={isSpaceDown}
        isMiddleDragging={isMiddleDragging}
        isLeftCanvasDragging={isLeftCanvasDragging}
        setIsMiddleDragging={setIsMiddleDragging}
        setIsLeftCanvasDragging={setIsLeftCanvasDragging}
        boxSelectMode={boxSelectMode}
        isTimeLocked={isTimeLocked}
        selectionBox={selectionBox}
        setSelectionBox={setSelectionBox}
        toWorldPoint={toWorldPoint}
        onUserCameraIntent={stopCameraAnimation}
        onEmptyCanvasClick={() => {
          resetSelection();
          clearNoteSelection();
          setEditing(null);
          setFocusedNoteId(undefined);
          setInlinePlayingVideoNoteId(undefined);
        }}
      >
        <Layer listening={false}>
          <WallDotMatrixLayer
            showDotMatrix={spatialPrefs.showDotMatrix}
            dotGridSpacing={spatialPrefs.dotGridSpacing}
            camera={camera}
            viewport={viewport}
          />
        </Layer>

        <Layer>
          <WallLinksZonesLayer
            visibleLinks={layerVisibleLinks}
            visibleZones={layerVisibleZones}
            notesById={displayNotesById}
            selectedLinkId={selectedLinkId}
            selectedNoteId={selectedNoteId}
            selectedZoneId={selectedZoneId}
            pathLinkIds={renderPathLinkIds}
            linkColorByType={linkColorByType}
            linkStrokeByType={linkStrokeByType}
            linkPoints={linkPoints}
            zoneNodeRefs={zoneNodeRefs}
            isTimeLocked={isTimeLocked}
            onSelectLink={(linkId) => {
              setLinkMenu((previous) => ({ ...previous, open: false }));
              clearNoteSelection();
              selectLink(linkId);
            }}
            onOpenLinkMenu={(x, y, linkId) => {
              clearNoteSelection();
              selectLink(linkId);
              setLinkMenu({
                open: true,
                x,
                y,
                linkId,
              });
            }}
            onSelectZone={(zoneId, groupId) => {
              clearNoteSelection();
              selectZone(zoneId);
              if (groupId) {
                selectGroup(groupId);
              }
            }}
            onMoveZone={moveZone}
            onResizeZone={updateZone}
          />

          {isFocusMode && (
            <Rect
              listening={false}
              x={-camera.x / camera.zoom}
              y={-camera.y / camera.zoom}
              width={viewport.w / camera.zoom}
              height={viewport.h / camera.zoom}
              fill="rgb(15 23 42 / 0.26)"
            />
          )}

          <WallNotesLayer
            visibleNotes={layerVisibleNotes}
            renderDetailLevel={layerRenderDetailLevel}
            renderBudget={layerRenderBudget}
            assetRecords={resolvedWallAssets}
            activeSelectedNoteIds={activeSelectedNoteIds}
            selectedNoteId={selectedNoteId}
            flashNoteId={flashNoteId}
            hoveredNoteId={hoveredNoteId}
            draggingNoteId={draggingNoteId}
            resizingNoteDrafts={resizingNoteDrafts}
            notesById={renderSnapshotNotes}
            linkingFromNoteId={linkingFromNoteId}
            linkType={linkType}
            isTimeLocked={isTimeLocked}
            showHeatmap={showHeatmap}
            heatmapReferenceTs={heatmapReferenceTs}
            showNoteTags={layoutPrefs.showNoteTags}
            noteNodeRefs={noteNodeRefs}
            dragSelectionStartRef={dragSelectionStartRef}
            dragAnchorRef={dragAnchorRef}
            dragSingleStartRef={dragSingleStartRef}
            setHoveredNoteId={setHoveredNoteId}
            setDraggingNoteId={setDraggingNoteId}
            setGuideLines={setGuideLines}
            setResizingNoteDrafts={setResizingNoteDrafts}
            syncPrimarySelection={syncPrimarySelection}
            selectSingleNote={selectSingleNote}
            toggleSelectNote={toggleSelectNote}
            setLinkingFromNote={setLinkingFromNote}
            setEditing={setEditing}
            openEditor={openEditor}
            createLink={createLink}
            resolveSnappedPosition={resolveSnappedPosition}
            runHistoryGroup={runHistoryGroup}
            moveNote={moveNote}
            updateNote={updateNote}
            openImageInsert={(noteId) => openImageInsert(noteId)}
            toggleVocabularyFlip={toggleVocabularyFlip}
            duplicateNoteAt={duplicateNoteAt}
            getNoteTextStyle={getNoteTextStyle}
            getNoteTextFontFamily={getNoteTextFontFamily}
            truncateNoteText={truncateNoteText}
            noteTagChipPalette={noteTagChipPalette}
            recencyIntensity={recencyIntensity}
            wikiLinksByNoteId={wikiLinksByNoteId}
            onNavigateWikiLink={focusNote}
            editingId={editingId}
            openExternalUrl={openBookmarkUrl}
            onDownloadFileNote={downloadFileNote}
            onToggleAudioPlayback={toggleAudioNotePlayback}
            playingAudioNoteId={playingAudioNoteId}
            playingAudioCurrentTimeSeconds={playingAudioCurrentTimeSeconds}
            playingAudioDurationSeconds={playingAudioDurationSeconds}
            onOpenAudioNote={openAudioNote}
            onDownloadAudioNote={downloadAudioNote}
            inlinePlayingVideoNoteId={inlinePlayingVideoNoteId}
            onToggleInlineVideoPlayback={toggleInlineVideoPlayback}
            onOpenVideoNote={(noteId) => {
              const note = renderSnapshotNotes[noteId];
              if (!note) {
                return;
              }
              openEditor(noteId, note.text);
            }}
            onDownloadVideoNote={downloadVideoNote}
          />

          <WallOverlaysLayer
            showClusters={showClusters}
            clusterBounds={clusterBounds}
            showAutoTagGroups={showAutoTagGroups}
            autoTagGroups={autoTagGroups}
            autoTagLabelLayout={autoTagLabelLayout}
            tagGroupColor={tagGroupColor}
            selectionBox={selectionBox}
            guideLines={guideLines}
            noteTransformerRef={noteTransformerRef}
            zoneTransformerRef={zoneTransformerRef}
            noteMinWidth={NOTE_DEFAULTS.minWidth}
            noteMinHeight={NOTE_DEFAULTS.minHeight}
            zoneMinWidth={ZONE_DEFAULTS.minWidth}
            zoneMinHeight={ZONE_DEFAULTS.minHeight}
          />
        </Layer>
      </WallStage>
    )}

    {!timelineViewActive && inlinePlayingVideoScreenRect ? (
      <div className="pointer-events-none absolute inset-0 z-[18]">
        <div
          className="pointer-events-auto absolute overflow-hidden rounded-[20px] border border-black/10 bg-black shadow-[0_18px_50px_rgba(15,23,42,0.22)]"
          style={{
            left: inlinePlayingVideoScreenRect.left,
            top: inlinePlayingVideoScreenRect.top,
            width: inlinePlayingVideoScreenRect.width,
            height: inlinePlayingVideoScreenRect.height,
          }}
        >
          {inlinePlayingVideoScreenRect.playback.kind === "direct" ? (
            <video
              ref={wallInlineVideoRef}
              key={`${inlinePlayingVideoNoteId ?? "video"}:${inlinePlayingVideoScreenRect.playback.url}`}
              className="h-full w-full bg-black object-contain"
              src={inlinePlayingVideoScreenRect.playback.url}
              poster={inlinePlayingVideoScreenRect.posterUrl}
              controls
              autoPlay
              playsInline
              preload="metadata"
            />
          ) : (
            <iframe
              key={`${inlinePlayingVideoNoteId ?? "video"}:${inlinePlayingVideoScreenRect.playback.url}`}
              src={inlinePlayingVideoScreenRect.playback.url}
              title={inlinePlayingVideoScreenRect.title}
              className="h-full w-full border-0 bg-black"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
          <button
            type="button"
            onClick={() => setInlinePlayingVideoNoteId(undefined)}
            className="absolute right-3 top-3 rounded-full border border-white/18 bg-black/60 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white/88 backdrop-blur"
            aria-label={`Close ${inlinePlayingVideoScreenRect.title} playback`}
          >
            Close
          </button>
        </div>
      </div>
    ) : null}

    {!readingMode && !timelineViewActive && <WallFloatingUi />}
  </div>
);
