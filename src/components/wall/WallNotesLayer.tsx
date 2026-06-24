"use client";

import { buildWallNotePresentation } from "@/components/wall/spatial/notes/build-wall-note-presentation";
import { buildWallNoteGroupProps } from "@/components/wall/spatial/notes/note-interaction";
import { getNoteCornerRadius } from "@/components/wall/spatial/notes/note-style";
import { buildOpenNoteEditor } from "@/components/wall/spatial/notes/open-note-editor";
import { WallCompactNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallCompactNoteRenderer";
import { WallFullNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallFullNoteRenderer";
import { useWallNoteAssets } from "@/components/wall/spatial/notes/useWallNoteAssets";
import { useWallNoteStyleAnimations } from "@/components/wall/spatial/notes/useWallNoteStyleAnimations";
import type { WallNotesLayerProps } from "@/components/wall/spatial/notes/wall-notes-layer-types";

export type { WallNotesLayerProps } from "@/components/wall/spatial/notes/wall-notes-layer-types";

export const WallNotesLayer = ({
  visibleNotes,
  renderDetailLevel,
  renderBudget,
  assetRecords,
  activeSelectedNoteIds,
  selectedNoteId,
  flashNoteId,
  hoveredNoteId,
  draggingNoteId,
  resizingNoteDrafts,
  notesById,
  linkingFromNoteId,
  linkType,
  isTimeLocked,
  showHeatmap,
  heatmapReferenceTs,
  showNoteTags,
  noteNodeRefs,
  dragSelectionStartRef,
  dragAnchorRef,
  dragSingleStartRef,
  setHoveredNoteId,
  setDraggingNoteId,
  setGuideLines,
  setResizingNoteDrafts,
  syncPrimarySelection,
  selectSingleNote,
  toggleSelectNote,
  setLinkingFromNote,
  setEditing,
  openEditor,
  createLink,
  resolveSnappedPosition,
  runHistoryGroup,
  moveNote,
  updateNote,
  openImageInsert,
  duplicateNoteAt,
  getNoteTextStyle,
  getNoteTextFontFamily,
  truncateNoteText,
  noteTagChipPalette,
  recencyIntensity,
  wikiLinksByNoteId,
  onNavigateWikiLink,
  editingId,
  openExternalUrl,
  onDownloadFileNote,
  onToggleAudioPlayback,
  playingAudioNoteId,
  playingAudioCurrentTimeSeconds,
  playingAudioDurationSeconds,
  onOpenAudioNote,
  onDownloadAudioNote,
  inlinePlayingVideoNoteId,
  onToggleInlineVideoPlayback,
  onOpenVideoNote,
  onDownloadVideoNote,
}: WallNotesLayerProps) => {
  const { resolvedAssetRecords, loadedImagesByUrl, failedImagesByUrl } = useWallNoteAssets({
    notesById,
    assetRecords,
    visibleNotes,
    renderDetailLevel,
    renderBudget,
    updateNote,
  });
  const { colorWashOpacityByNote, getTextSpringFactor } = useWallNoteStyleAnimations(visibleNotes);

  return (
    <>
      {visibleNotes.map((note) => {
        const isSelected = activeSelectedNoteIds.includes(note.id) || selectedNoteId === note.id;
        const isFlashing = flashNoteId === note.id;
        const isHovered = hoveredNoteId === note.id;
        const isDragging = draggingNoteId === note.id;
        const isPinned = Boolean(note.pinned);
        const isHighlighted = Boolean(note.highlighted);
        const draft = resizingNoteDrafts[note.id];
        const noteView = draft ? { ...note, ...draft } : note;
        const noteCornerRadius = getNoteCornerRadius(noteView);
        const colorWashOpacity = colorWashOpacityByNote[note.id] ?? 0;
        const textSpringFactor = getTextSpringFactor(note.id);

        const openNoteEditor = buildOpenNoteEditor({
          note,
          noteView,
          resolvedAssetRecords,
          isTimeLocked,
          selectSingleNote,
          openEditor,
          openImageInsert,
        });

        const groupProps = buildWallNoteGroupProps({
          note,
          noteView,
          isTimeLocked,
          isPinned,
          activeSelectedNoteIds,
          linkingFromNoteId,
          linkType,
          editingId,
          notesById,
          resizingNoteDrafts,
          noteNodeRefs,
          dragSelectionStartRef,
          dragAnchorRef,
          dragSingleStartRef,
          setHoveredNoteId,
          setDraggingNoteId,
          setGuideLines,
          setResizingNoteDrafts,
          syncPrimarySelection,
          selectSingleNote,
          toggleSelectNote,
          setLinkingFromNote,
          setEditing,
          createLink,
          resolveSnappedPosition,
          runHistoryGroup,
          moveNote,
          updateNote,
          duplicateNoteAt,
          openNoteEditor,
        });

        if (renderDetailLevel !== "full") {
          return (
            <WallCompactNoteRenderer
              key={note.id}
              note={noteView}
              renderDetailLevel={renderDetailLevel}
              groupProps={groupProps}
              cornerRadius={noteCornerRadius}
              isSelected={isSelected}
              isHovered={isHovered}
              isHighlighted={isHighlighted}
              isFlashing={isFlashing}
              isDragging={isDragging}
            />
          );
        }

        const wikiLinks = wikiLinksByNoteId[note.id] ?? [];
        const presentation = buildWallNotePresentation({
          note,
          noteView,
          resolvedAssetRecords,
          wikiLinks,
          playingAudioNoteId,
          playingAudioCurrentTimeSeconds,
          playingAudioDurationSeconds,
          inlinePlayingVideoNoteId,
          getNoteTextStyle,
          getNoteTextFontFamily,
          truncateNoteText,
        });
        const tagPalette = noteTagChipPalette(presentation.resolvedNoteColor);
        const bookmarkImage = presentation.bookmarkImageUrl ? loadedImagesByUrl[presentation.bookmarkImageUrl] : undefined;
        const bookmarkFavicon = presentation.bookmarkFaviconUrl ? loadedImagesByUrl[presentation.bookmarkFaviconUrl] : undefined;
        const noteImage = presentation.imageUrl ? loadedImagesByUrl[presentation.imageUrl] : undefined;
        const loadedVideoPoster = presentation.videoPoster ? loadedImagesByUrl[presentation.videoPoster] : undefined;

        return (
          <WallFullNoteRenderer
            key={note.id}
            note={note}
            noteView={noteView}
            groupProps={groupProps}
            presentation={presentation}
            textSpringFactor={textSpringFactor}
            colorWashOpacity={colorWashOpacity}
            isSelected={isSelected}
            isHovered={isHovered}
            isHighlighted={isHighlighted}
            isFlashing={isFlashing}
            isDragging={isDragging}
            isPinned={isPinned}
            isTimeLocked={isTimeLocked}
            showHeatmap={showHeatmap}
            heatmapReferenceTs={heatmapReferenceTs}
            showNoteTags={showNoteTags}
            bookmarkImage={bookmarkImage}
            bookmarkFavicon={bookmarkFavicon}
            noteImage={noteImage}
            imageLoadFailed={Boolean(presentation.imageUrl && failedImagesByUrl[presentation.imageUrl])}
            loadedVideoPoster={loadedVideoPoster}
            tagPalette={tagPalette}
            selectSingleNote={selectSingleNote}
            openEditor={openEditor}
            openExternalUrl={openExternalUrl}
            onDownloadFileNote={onDownloadFileNote}
            onToggleAudioPlayback={onToggleAudioPlayback}
            playingAudioCurrentTimeSeconds={playingAudioCurrentTimeSeconds}
            onOpenAudioNote={onOpenAudioNote}
            onDownloadAudioNote={onDownloadAudioNote}
            onToggleInlineVideoPlayback={onToggleInlineVideoPlayback}
            onOpenVideoNote={onOpenVideoNote}
            onDownloadVideoNote={onDownloadVideoNote}
            recencyIntensity={recencyIntensity}
            onNavigateWikiLink={onNavigateWikiLink}
          />
        );
      })}
    </>
  );
};
