import type { ComponentProps } from "react";
import { Group, Rect, Text } from "react-konva";

import { EisenhowerMatrixNote } from "@/components/wall/EisenhowerMatrixNote";
import type { WallNotePresentation } from "@/components/wall/spatial/notes/build-wall-note-presentation";
import { atelierPalette, getNoteStrokeColor } from "@/components/wall/spatial/notes/note-style";
import { WallAudioNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallAudioNoteRenderer";
import { WallBookmarkNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallBookmarkNoteRenderer";
import { WallCodeNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallCodeNoteRenderer";
import { WallFileNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallFileNoteRenderer";
import { WallImageNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallImageNoteRenderer";
import { WallJournalNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallJournalNoteRenderer";
import { WallNoteChromeOverlays } from "@/components/wall/spatial/notes/renderers/WallNoteChromeOverlays";
import { WallPrivateNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallPrivateNoteRenderer";
import { WallQuoteNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallQuoteNoteRenderer";
import { WallStandardNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallStandardNoteRenderer";
import { WallVideoNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallVideoNoteRenderer";
import { NOTE_DEFAULTS } from "@/features/wall/constants";
import type { Note } from "@/features/wall/types";

type WallFullNoteRendererProps = {
  note: Note;
  noteView: Note;
  groupProps: ComponentProps<typeof Group>;
  presentation: WallNotePresentation;
  textSpringFactor: number;
  colorWashOpacity: number;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  isFlashing: boolean;
  isDragging: boolean;
  isPinned: boolean;
  isTimeLocked: boolean;
  showHeatmap: boolean;
  heatmapReferenceTs: number;
  showNoteTags: boolean;
  bookmarkImage?: HTMLImageElement;
  bookmarkFavicon?: HTMLImageElement;
  noteImage?: HTMLImageElement;
  imageLoadFailed: boolean;
  loadedVideoPoster?: HTMLImageElement;
  tagPalette: { bg: string; border: string; text: string };
  selectSingleNote: (noteId: string) => void;
  openEditor: (noteId: string, text: string, focusField?: string) => void;
  openExternalUrl: (url: string) => void;
  onDownloadFileNote: (noteId: string) => void;
  onToggleAudioPlayback: (noteId: string) => void;
  playingAudioCurrentTimeSeconds?: number;
  onOpenAudioNote: (noteId: string) => void;
  onDownloadAudioNote: (noteId: string) => void;
  onToggleInlineVideoPlayback: (noteId: string) => void;
  onOpenVideoNote: (noteId: string) => void;
  onDownloadVideoNote: (noteId: string) => void;
  recencyIntensity: (updatedAt: number, referenceTs: number, windowMs?: number) => number;
  onNavigateWikiLink: (noteId: string) => void;
};

export const WallFullNoteRenderer = ({
  note,
  noteView,
  groupProps,
  presentation,
  textSpringFactor,
  colorWashOpacity,
  isSelected,
  isHovered,
  isHighlighted,
  isFlashing,
  isDragging,
  isPinned,
  isTimeLocked,
  showHeatmap,
  heatmapReferenceTs,
  showNoteTags,
  bookmarkImage,
  bookmarkFavicon,
  noteImage,
  imageLoadFailed,
  loadedVideoPoster,
  tagPalette,
  selectSingleNote,
  openEditor,
  openExternalUrl,
  onDownloadFileNote,
  onToggleAudioPlayback,
  playingAudioCurrentTimeSeconds,
  onOpenAudioNote,
  onDownloadAudioNote,
  onToggleInlineVideoPlayback,
  onOpenVideoNote,
  onDownloadVideoNote,
  recencyIntensity,
  onNavigateWikiLink,
}: WallFullNoteRendererProps) => {
  const {
    resolvedNoteColor,
    noteCornerRadius,
    noteTextStyle,
    noteTextFontFamily,
    isQuote,
    isCanon,
    isJournal,
    isEisenhower,
    isPrivate,
    isBookmark,
    isAudio,
    isVideo,
    isStandardNote,
    canonTitle,
    quoteAttribution,
    quoteSource,
    quoteFooterLines,
    textX,
    textWidth,
    imageUrl,
    isImageNote,
    baseShellFill,
    resolvedTextColor,
    paperTintOpacity,
    standardTitle,
    standardBody,
    looksLikeCode,
    looksLikeFile,
    fileLabel,
    fileMeta,
    audioTitle,
    audioMeta,
    isAudioPlaying,
    audioCurrentTime,
    audioDuration,
    isInlineVideoPlaying,
    videoTitle,
    videoMeta,
    videoDuration,
    videoCurrentTime,
    journalTitle,
    journalBody,
    journalDateLabel,
    showStandardTextCard,
    wikiLinks,
    wikiFooterHeight,
    quoteBodyText,
    noteTextContent,
    noteTags,
    overflowTags,
    textY,
    textHeight,
  } = presentation;

  return (
    <Group {...groupProps}>
      {isJournal ? (
        <WallJournalNoteRenderer
          note={noteView}
          cornerRadius={noteCornerRadius}
          dateLabel={journalDateLabel}
          title={journalTitle}
          body={journalBody}
          isSelected={isSelected}
          isHovered={isHovered}
          isHighlighted={isHighlighted}
          isFlashing={isFlashing}
          isDragging={isDragging}
        />
      ) : isBookmark ? (
        <WallBookmarkNoteRenderer
          note={noteView}
          bookmarkImage={bookmarkImage}
          bookmarkFavicon={bookmarkFavicon}
          isSelected={isSelected}
          isHovered={isHovered}
          isHighlighted={isHighlighted}
          isFlashing={isFlashing}
          isDragging={isDragging}
          isTimeLocked={isTimeLocked}
          openExternalUrl={openExternalUrl}
        />
      ) : isImageNote ? (
        <WallImageNoteRenderer
          note={noteView}
          imageUrl={imageUrl}
          image={noteImage}
          imageLoadFailed={imageLoadFailed}
          captionFontFamily={isQuote ? "Newsreader" : noteTextFontFamily}
          accentColor={resolvedNoteColor}
          isSelected={isSelected}
          isHovered={isHovered}
          isHighlighted={isHighlighted}
          isFlashing={isFlashing}
          isDragging={isDragging}
          isTimeLocked={isTimeLocked}
          selectSingleNote={selectSingleNote}
          openEditor={openEditor}
        />
      ) : isEisenhower ? (
        <EisenhowerMatrixNote
          note={noteView}
          isSelected={isSelected}
          isHovered={isHovered}
          isDragging={isDragging}
          isFlashing={isFlashing}
          isHighlighted={isHighlighted}
          colorWashOpacity={colorWashOpacity}
          textSpringFactor={textSpringFactor}
          openEditor={openEditor}
          selectSingleNote={selectSingleNote}
          isTimeLocked={isTimeLocked}
        />
      ) : isPrivate ? (
        <WallPrivateNoteRenderer
          note={noteView}
          cornerRadius={noteCornerRadius}
          isSelected={isSelected}
          isHovered={isHovered}
          isHighlighted={isHighlighted}
          isFlashing={isFlashing}
          isDragging={isDragging}
          isTimeLocked={isTimeLocked}
          selectSingleNote={selectSingleNote}
          openEditor={openEditor}
        />
      ) : (
        <>
          <Rect
            width={noteView.w}
            height={noteView.h}
            cornerRadius={noteCornerRadius}
            fill={baseShellFill}
            stroke={getNoteStrokeColor({ isSelected, isHovered, isHighlighted, accent: resolvedNoteColor })}
            strokeWidth={isHighlighted ? 2.4 : isSelected ? 2 : isHovered ? 1.3 : 0.9}
            shadowColor={atelierPalette.paperShadow}
            shadowBlur={isFlashing ? 28 : isDragging ? 24 : 16}
            shadowOpacity={isFlashing ? 0.18 : isDragging ? 0.14 : 0.08}
            shadowOffsetY={isDragging ? 7 : 3}
          />
          <Rect width={noteView.w} height={noteView.h} cornerRadius={noteCornerRadius} fill={resolvedNoteColor} opacity={paperTintOpacity} listening={false} />
          {(isQuote || isStandardNote) && (
            <Rect x={0} y={0} width={3} height={noteView.h} cornerRadius={[noteCornerRadius, 0, 0, noteCornerRadius]} fill={resolvedNoteColor} listening={false} />
          )}
        </>
      )}
      <WallNoteChromeOverlays
        note={noteView}
        cornerRadius={noteCornerRadius}
        isHighlighted={isHighlighted}
        isPinned={isPinned}
        showHeatmap={showHeatmap}
        heatmapReferenceTs={heatmapReferenceTs}
        colorWashOpacity={colorWashOpacity}
        showNoteTags={showNoteTags}
        isPrivate={isPrivate}
        isImageNote={isImageNote}
        isEisenhower={isEisenhower}
        isVideo={isVideo}
        isBookmark={isBookmark}
        wikiLinks={wikiLinks}
        noteTags={noteTags}
        overflowTags={overflowTags}
        tagPalette={tagPalette}
        isTimeLocked={isTimeLocked}
        recencyIntensity={recencyIntensity}
        onNavigateWikiLink={onNavigateWikiLink}
      />
      {!isPrivate && !isImageNote && !isEisenhower && !isBookmark && !isJournal && !isQuote && !isAudio && !isVideo && !looksLikeCode && !looksLikeFile && !isStandardNote && (
        <Text
          x={textX}
          y={textY}
          width={textWidth}
          height={textHeight}
          fontSize={noteTextStyle.fontSize * textSpringFactor}
          fontFamily={noteTextFontFamily}
          fontStyle={isCanon ? "bold" : "normal"}
          fill={resolvedTextColor}
          lineHeight={noteTextStyle.lineHeight}
          align={noteView.textAlign ?? "left"}
          verticalAlign={noteView.textVAlign ?? NOTE_DEFAULTS.textVAlign}
          text={noteTextContent}
          onClick={(event) => {
            if (isTimeLocked) {
              return;
            }
            event.cancelBubble = true;
            selectSingleNote(note.id);
            openEditor(note.id, noteView.text);
          }}
        />
      )}
      {isQuote && !isEisenhower ? (
        <WallQuoteNoteRenderer
          note={noteView}
          body={quoteBodyText}
          attribution={quoteAttribution}
          source={quoteSource}
          footerLines={quoteFooterLines}
          textColor={resolvedTextColor}
        />
      ) : null}
      {isCanon && canonTitle && !isEisenhower && (
        <Text
          x={12}
          y={13}
          width={Math.max(0, noteView.w - 24)}
          fontSize={11}
          fontStyle="bold"
          fill={resolvedTextColor}
          text={canonTitle}
          wrap="none"
          ellipsis
          listening={false}
        />
      )}
      {looksLikeCode ? <WallCodeNoteRenderer note={noteView} text={noteView.text} /> : null}
      {isAudio && (
        <WallAudioNoteRenderer
          note={noteView}
          title={audioTitle}
          meta={audioMeta}
          currentTime={audioCurrentTime}
          duration={audioDuration}
          isPlaying={isAudioPlaying}
          playingCurrentTimeSeconds={playingAudioCurrentTimeSeconds}
          isTimeLocked={isTimeLocked}
          onToggleAudioPlayback={onToggleAudioPlayback}
          onOpenAudioNote={onOpenAudioNote}
          onDownloadAudioNote={onDownloadAudioNote}
        />
      )}
      {isVideo ? (
        <WallVideoNoteRenderer
          note={noteView}
          title={videoTitle}
          meta={videoMeta}
          currentTime={videoCurrentTime}
          duration={videoDuration}
          poster={loadedVideoPoster}
          isPlaying={isInlineVideoPlaying}
          isTimeLocked={isTimeLocked}
          onToggleInlineVideoPlayback={onToggleInlineVideoPlayback}
          onOpenVideoNote={onOpenVideoNote}
          onDownloadVideoNote={onDownloadVideoNote}
        />
      ) : null}
      {looksLikeFile && (
        <WallFileNoteRenderer
          note={noteView}
          label={fileLabel}
          meta={fileMeta}
          isTimeLocked={isTimeLocked}
          onDownloadFileNote={onDownloadFileNote}
        />
      )}
      {showStandardTextCard ? (
        <WallStandardNoteRenderer
          note={noteView}
          title={standardTitle}
          body={standardBody}
          fontFamily={noteTextFontFamily}
          wikiFooterHeight={wikiFooterHeight}
        />
      ) : null}
    </Group>
  );
};
