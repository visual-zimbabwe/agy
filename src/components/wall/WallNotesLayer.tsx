"use client";

import { useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { Group, Image as KonvaImage, Rect, Text } from "react-konva";
import type Konva from "konva";

import { NOTE_DEFAULTS } from "@/features/wall/constants";
import type { LinkType, Note } from "@/features/wall/types";

type GuideLineState = {
  vertical?: { x: number; y1: number; y2: number; distance?: number };
  horizontal?: { y: number; x1: number; x2: number; distance?: number };
};

type ResizeDraft = { x: number; y: number; w: number; h: number };

type WallNotesLayerProps = {
  visibleNotes: Note[];
  activeSelectedNoteIds: string[];
  selectedNoteId?: string;
  flashNoteId?: string;
  hoveredNoteId?: string;
  draggingNoteId?: string;
  resizingNoteDrafts: Record<string, ResizeDraft>;
  notesById: Record<string, Note>;
  linkingFromNoteId?: string;
  linkType: LinkType;
  isTimeLocked: boolean;
  showHeatmap: boolean;
  heatmapReferenceTs: number;
  showNoteTags: boolean;
  noteNodeRefs: MutableRefObject<Record<string, Konva.Group | null>>;
  dragSelectionStartRef: MutableRefObject<Record<string, { x: number; y: number }> | null>;
  dragAnchorRef: MutableRefObject<{ id: string; x: number; y: number } | null>;
  dragSingleStartRef: MutableRefObject<{ id: string; x: number; y: number; altClone: boolean } | null>;
  setHoveredNoteId: Dispatch<SetStateAction<string | undefined>>;
  setDraggingNoteId: Dispatch<SetStateAction<string | undefined>>;
  onLongPressNote: (noteId: string) => void;
  setGuideLines: Dispatch<SetStateAction<GuideLineState>>;
  setResizingNoteDrafts: Dispatch<SetStateAction<Record<string, ResizeDraft>>>;
  syncPrimarySelection: (noteIds: string[]) => void;
  selectSingleNote: (noteId: string) => void;
  toggleSelectNote: (noteId: string) => void;
  setLinkingFromNote: (noteId?: string) => void;
  setEditing: Dispatch<SetStateAction<{ id: string; text: string } | null>>;
  openEditor: (noteId: string, text: string) => void;
  createLink: (fromNoteId: string, toNoteId: string, linkType: LinkType) => void;
  resolveSnappedPosition: (note: Note, candidateX: number, candidateY: number) => { x: number; y: number };
  runHistoryGroup: (action: () => void) => void;
  moveNote: (noteId: string, x: number, y: number) => void;
  updateNote: (noteId: string, patch: Partial<Note>) => void;
  toggleVocabularyFlip: (noteId: string) => void;
  duplicateNoteAt: (noteId: string, x: number, y: number) => void;
  getNoteTextStyle: (size?: Note["textSize"], textSizePx?: number) => { fontSize: number; lineHeight: number };
  getNoteTextFontFamily: (font?: Note["textFont"]) => string;
  truncateNoteText: (text: string, note: Note) => string;
  noteTagChipPalette: (noteColor: string) => { bg: string; border: string; text: string };
  recencyIntensity: (updatedAt: number, referenceTs: number, windowMs?: number) => number;
  editingId?: string;
};

export const WallNotesLayer = ({
  visibleNotes,
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
  onLongPressNote,
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
  toggleVocabularyFlip,
  duplicateNoteAt,
  getNoteTextStyle,
  getNoteTextFontFamily,
  truncateNoteText,
  noteTagChipPalette,
  recencyIntensity,
  editingId,
}: WallNotesLayerProps) => {
  const previousColorRef = useRef<Record<string, string>>({});
  const previousTextSizeRef = useRef<Record<string, string>>({});
  const [colorWashOpacityByNote, setColorWashOpacityByNote] = useState<Record<string, number>>({});
  const [sizePulseScaleByNote, setSizePulseScaleByNote] = useState<Record<string, number>>({});
  const [loadedImagesByUrl, setLoadedImagesByUrl] = useState<Record<string, HTMLImageElement>>({});
  const [failedImagesByUrl, setFailedImagesByUrl] = useState<Record<string, true>>({});
  const colorWashTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>[]>>({});
  const sizePulseTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>[]>>({});
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const reducedMotion = typeof document !== "undefined" && document.documentElement.classList.contains("motion-reduce");

    const runColorWash = (noteId: string) => {
      colorWashTimersRef.current[noteId]?.forEach((timer) => clearTimeout(timer));
      if (reducedMotion) {
        return;
      }
      setColorWashOpacityByNote((previous) => ({ ...previous, [noteId]: 0.24 }));
      const fadeTimer = setTimeout(() => {
        setColorWashOpacityByNote((previous) => ({ ...previous, [noteId]: 0.1 }));
      }, 90);
      const clearTimer = setTimeout(() => {
        setColorWashOpacityByNote((previous) => {
          if (previous[noteId] == null) {
            return previous;
          }
          const next = { ...previous };
          delete next[noteId];
          return next;
        });
      }, 180);
      colorWashTimersRef.current[noteId] = [fadeTimer, clearTimer];
    };

    const runSizePulse = (noteId: string) => {
      sizePulseTimersRef.current[noteId]?.forEach((timer) => clearTimeout(timer));
      if (reducedMotion) {
        return;
      }
      setSizePulseScaleByNote((previous) => ({ ...previous, [noteId]: 1.035 }));
      const settleTimer = setTimeout(() => {
        setSizePulseScaleByNote((previous) => ({ ...previous, [noteId]: 1.01 }));
      }, 95);
      const clearTimer = setTimeout(() => {
        setSizePulseScaleByNote((previous) => {
          if (previous[noteId] == null) {
            return previous;
          }
          const next = { ...previous };
          delete next[noteId];
          return next;
        });
      }, 210);
      sizePulseTimersRef.current[noteId] = [settleTimer, clearTimer];
    };

    const nextColorMap: Record<string, string> = {};
    const nextTextSizeMap: Record<string, string> = {};
    for (const note of visibleNotes) {
      nextColorMap[note.id] = note.color;
      nextTextSizeMap[note.id] = `${note.textSize ?? "md"}:${note.textSizePx ?? NOTE_DEFAULTS.textSizePx}`;
      const previousColor = previousColorRef.current[note.id];
      const previousTextSize = previousTextSizeRef.current[note.id];
      if (previousColor && previousColor !== note.color) {
        runColorWash(note.id);
      }
      if (previousTextSize && previousTextSize !== nextTextSizeMap[note.id]) {
        runSizePulse(note.id);
      }
    }
    previousColorRef.current = nextColorMap;
    previousTextSizeRef.current = nextTextSizeMap;
  }, [visibleNotes]);

  useEffect(() => {
    let cancelled = false;
    const urls = [...new Set(visibleNotes.map((note) => note.imageUrl?.trim()).filter((url): url is string => Boolean(url)))];
    const nextLoads = urls.filter((url) => !loadedImagesByUrl[url] && !failedImagesByUrl[url]);
    for (const url of nextLoads) {
      const image = new window.Image();
      image.decoding = "async";
      image.onload = () => {
        if (cancelled) {
          return;
        }
        setLoadedImagesByUrl((previous) => {
          if (previous[url] === image) {
            return previous;
          }
          return { ...previous, [url]: image };
        });
      };
      image.onerror = () => {
        if (cancelled) {
          return;
        }
        setFailedImagesByUrl((previous) => {
          if (previous[url]) {
            return previous;
          }
          return { ...previous, [url]: true };
        });
      };
      image.src = url;
    }
    return () => {
      cancelled = true;
    };
  }, [failedImagesByUrl, loadedImagesByUrl, visibleNotes]);

  useEffect(() => {
    const colorWashTimers = colorWashTimersRef.current;
    const sizePulseTimers = sizePulseTimersRef.current;
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      Object.values(colorWashTimers).forEach((timers) => timers.forEach((timer) => clearTimeout(timer)));
      Object.values(sizePulseTimers).forEach((timers) => timers.forEach((timer) => clearTimeout(timer)));
    };
  }, []);

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
        const pulseScale = sizePulseScaleByNote[note.id] ?? 1;
        const textSpringFactor = 1 + (pulseScale - 1) * 0.7;
        const colorWashOpacity = colorWashOpacityByNote[note.id] ?? 0;
        const noteTextStyle = getNoteTextStyle(noteView.textSize, noteView.textSizePx);
        const noteTextFontFamily = getNoteTextFontFamily(noteView.textFont);
        const vocabulary = noteView.vocabulary;
        const isVocabulary = Boolean(vocabulary);
        const isVocabularyBack = Boolean(vocabulary?.flipped);
        const noteTextContent = isVocabulary
          ? isVocabularyBack
            ? vocabulary?.meaning?.trim() || "Add meaning in Word Review"
            : vocabulary?.word?.trim() || "Add word in Word Review"
          : truncateNoteText(noteView.text, noteView) || "Double-click or press Enter to edit";
        const visibleTagCount = noteView.w < 180 ? 1 : noteView.w < 240 ? 2 : 3;
        const noteTags = noteView.tags.slice(0, visibleTagCount);
        const overflowTags = Math.max(0, note.tags.length - noteTags.length);
        const tagPalette = noteTagChipPalette(noteView.color);
        const imageUrl = noteView.imageUrl?.trim();
        const noteImage = imageUrl ? loadedImagesByUrl[imageUrl] : undefined;
        const imageFrameHeight = imageUrl
          ? Math.max(44, Math.min(noteView.h * 0.58, Math.max(44, noteView.h - 70)))
          : 0;
        const textY = 12 + (imageUrl ? imageFrameHeight + 8 : 0);
        const textHeight = Math.max(0, noteView.h - 56 - (imageUrl ? imageFrameHeight + 8 : 0));

        return (
          <Group
            key={note.id}
            ref={(node) => {
              noteNodeRefs.current[note.id] = node;
            }}
            x={noteView.x}
            y={noteView.y}
            width={noteView.w}
            height={noteView.h}
            draggable={!isTimeLocked && !isPinned}
            onMouseEnter={() => setHoveredNoteId(note.id)}
            onMouseLeave={() => setHoveredNoteId((previous) => (previous === note.id ? undefined : previous))}
            onClick={(event) => {
              if (isTimeLocked) {
                selectSingleNote(note.id);
                return;
              }
              if (linkingFromNoteId && linkingFromNoteId !== note.id) {
                createLink(linkingFromNoteId, note.id, linkType);
                setLinkingFromNote(undefined);
                return;
              }
              if (event.evt.shiftKey || event.evt.ctrlKey || event.evt.metaKey) {
                toggleSelectNote(note.id);
              } else {
                selectSingleNote(note.id);
              }
              if (editingId !== note.id) {
                setEditing(null);
              }
            }}
            onTap={(event) => {
              if (isTimeLocked) {
                selectSingleNote(note.id);
                return;
              }
              if (linkingFromNoteId && linkingFromNoteId !== note.id) {
                createLink(linkingFromNoteId, note.id, linkType);
                setLinkingFromNote(undefined);
                return;
              }
              if (event.evt.shiftKey || event.evt.ctrlKey || event.evt.metaKey) {
                toggleSelectNote(note.id);
              } else {
                selectSingleNote(note.id);
              }
            }}
            onDblClick={() => {
              if (isTimeLocked) {
                return;
              }
              selectSingleNote(note.id);
              openEditor(note.id, note.text);
            }}
            onTouchStart={() => {
              if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
              }
              longPressTimerRef.current = setTimeout(() => {
                onLongPressNote(note.id);
              }, 420);
            }}
            onTouchEnd={() => {
              if (!longPressTimerRef.current) {
                return;
              }
              clearTimeout(longPressTimerRef.current);
              longPressTimerRef.current = null;
            }}
            onTouchCancel={() => {
              if (!longPressTimerRef.current) {
                return;
              }
              clearTimeout(longPressTimerRef.current);
              longPressTimerRef.current = null;
            }}
            onDragStart={(event) => {
              if (isTimeLocked || isPinned) {
                return;
              }
              setDraggingNoteId(note.id);
              setGuideLines({});
              if (!activeSelectedNoteIds.includes(note.id)) {
                syncPrimarySelection([note.id]);
              }
              const activeIds = activeSelectedNoteIds.includes(note.id) ? activeSelectedNoteIds : [note.id];
              dragSingleStartRef.current = {
                id: note.id,
                x: note.x,
                y: note.y,
                altClone: event.evt.altKey,
              };
              if (activeIds.length > 1) {
                dragSelectionStartRef.current = Object.fromEntries(
                  activeIds
                    .map((id) => notesById[id])
                    .filter((entry): entry is Note => {
                      if (!entry) {
                        return false;
                      }
                      return !entry.pinned;
                    })
                    .map((entry) => [entry.id, { x: entry.x, y: entry.y }]),
                );
                dragAnchorRef.current = { id: note.id, x: event.target.x(), y: event.target.y() };
              }
            }}
            onDragMove={(event) => {
              if (isTimeLocked || isPinned) {
                return;
              }
              const start = dragSingleStartRef.current;
              const pointerX = event.target.x();
              const pointerY = event.target.y();
              let candidateX = pointerX;
              let candidateY = pointerY;
              if (start && event.evt.shiftKey) {
                const dx = Math.abs(pointerX - start.x);
                const dy = Math.abs(pointerY - start.y);
                if (dx > dy) {
                  candidateY = start.y;
                } else {
                  candidateX = start.x;
                }
              }
              const snapped = resolveSnappedPosition(note, candidateX, candidateY);
              event.target.position(snapped);

              const anchor = dragAnchorRef.current;
              const startMap = dragSelectionStartRef.current;
              if (!anchor || !startMap) {
                return;
              }
              const dx = snapped.x - anchor.x;
              const dy = snapped.y - anchor.y;
              let movedPeers = false;
              for (const [id, startPos] of Object.entries(startMap)) {
                if (id === note.id) {
                  continue;
                }
                if (notesById[id]?.pinned) {
                  continue;
                }
                const peerNode = noteNodeRefs.current[id];
                if (!peerNode) {
                  continue;
                }
                peerNode.position({ x: startPos.x + dx, y: startPos.y + dy });
                movedPeers = true;
              }
              if (movedPeers) {
                event.target.getLayer()?.batchDraw();
              }
            }}
            onDragEnd={(event) => {
              if (isTimeLocked || isPinned) {
                return;
              }
              const snapped = resolveSnappedPosition(note, event.target.x(), event.target.y());
              event.target.position(snapped);
              const anchor = dragAnchorRef.current;
              const startMap = dragSelectionStartRef.current;
              if (anchor && startMap) {
                runHistoryGroup(() => {
                  moveNote(note.id, snapped.x, snapped.y);
                  const dx = snapped.x - anchor.x;
                  const dy = snapped.y - anchor.y;
                  for (const [id, startPos] of Object.entries(startMap)) {
                    if (id === note.id) {
                      continue;
                    }
                    if (notesById[id]?.pinned) {
                      continue;
                    }
                    updateNote(id, { x: startPos.x + dx, y: startPos.y + dy });
                  }
                });
              } else {
                moveNote(note.id, snapped.x, snapped.y);
              }
              const dragStart = dragSingleStartRef.current;
              if (dragStart?.id === note.id && dragStart.altClone) {
                updateNote(note.id, { x: dragStart.x, y: dragStart.y });
                duplicateNoteAt(note.id, snapped.x, snapped.y);
                syncPrimarySelection([note.id]);
              }
              setDraggingNoteId(undefined);
              setGuideLines({});
              dragSelectionStartRef.current = null;
              dragAnchorRef.current = null;
              dragSingleStartRef.current = null;
            }}
            onTransform={(event) => {
              if (isTimeLocked || isPinned) {
                return;
              }
              const node = event.target;
              const width = Math.max(NOTE_DEFAULTS.minWidth, node.width() * node.scaleX());
              const height = Math.max(NOTE_DEFAULTS.minHeight, node.height() * node.scaleY());
              node.scaleX(1);
              node.scaleY(1);
              setResizingNoteDrafts((previous) => ({
                ...previous,
                [note.id]: {
                  x: node.x(),
                  y: node.y(),
                  w: width,
                  h: height,
                },
              }));
            }}
            onTransformEnd={(event) => {
              if (isTimeLocked || isPinned) {
                return;
              }
              const node = event.target;
              const draftEntry = resizingNoteDrafts[note.id];
              const width = draftEntry?.w ?? Math.max(NOTE_DEFAULTS.minWidth, node.width() * node.scaleX());
              const height = draftEntry?.h ?? Math.max(NOTE_DEFAULTS.minHeight, node.height() * node.scaleY());
              const x = draftEntry?.x ?? node.x();
              const y = draftEntry?.y ?? node.y();
              node.scaleX(1);
              node.scaleY(1);
              updateNote(note.id, { x, y, w: width, h: height });
              setResizingNoteDrafts((previous) => {
                if (!previous[note.id]) {
                  return previous;
                }
                const next = { ...previous };
                delete next[note.id];
                return next;
              });
            }}
          >
            <Rect
              width={noteView.w}
              height={noteView.h}
              cornerRadius={14}
              fill={note.color}
              stroke={isHighlighted ? "#f59e0b" : isSelected ? "#0f172a" : isHovered ? "#52525b" : "#d4d4d8"}
              strokeWidth={isHighlighted ? 2.6 : isSelected ? 2.4 : isHovered ? 1.4 : 1}
              shadowColor="#101010"
              shadowBlur={isFlashing ? 30 : isDragging ? 26 : 12}
              shadowOpacity={isFlashing ? 0.36 : isDragging ? 0.28 : 0.14}
              shadowOffsetY={isDragging ? 7 : 3}
            />
            {isHighlighted && (
              <Rect
                width={noteView.w}
                height={noteView.h}
                cornerRadius={14}
                stroke="#fbbf24"
                strokeWidth={1.2}
                opacity={0.8}
                dash={[7, 4]}
              />
            )}
            {isPinned && (
              <Text
                x={Math.max(12, noteView.w - 42)}
                y={10}
                width={30}
                align="right"
                fontSize={10}
                fontStyle="bold"
                fill="#334155"
                text="PIN"
              />
            )}
            {showHeatmap && (
              <Rect
                width={noteView.w}
                height={noteView.h}
                cornerRadius={14}
                fill="#ef4444"
                opacity={0.08 + recencyIntensity(noteView.updatedAt, heatmapReferenceTs) * 0.35}
              />
            )}
            {colorWashOpacity > 0 && (
              <Rect
                width={noteView.w}
                height={noteView.h}
                cornerRadius={14}
                fill="#ffffff"
                opacity={colorWashOpacity}
              />
            )}
            {imageUrl && (
              <>
                <Rect
                  x={12}
                  y={12}
                  width={Math.max(0, noteView.w - 24)}
                  height={imageFrameHeight}
                  cornerRadius={10}
                  fill="#ffffff"
                  opacity={0.4}
                  stroke="#1f2937"
                  strokeWidth={0.5}
                />
                {noteImage ? (
                  <KonvaImage
                    x={12}
                    y={12}
                    width={Math.max(0, noteView.w - 24)}
                    height={imageFrameHeight}
                    image={noteImage}
                    cornerRadius={10}
                    listening={false}
                  />
                ) : (
                  <Text
                    x={18}
                    y={12 + imageFrameHeight / 2 - 6}
                    width={Math.max(0, noteView.w - 36)}
                    align="center"
                    fontSize={10}
                    fill="#334155"
                    text={failedImagesByUrl[imageUrl] ? "Image failed to load" : "Loading image..."}
                  />
                )}
              </>
            )}
            <Text
              x={12}
              y={textY}
              width={Math.max(0, noteView.w - 24)}
              height={textHeight}
              fontSize={noteTextStyle.fontSize * textSpringFactor}
              fontFamily={noteTextFontFamily}
              fill={noteView.textColor ?? NOTE_DEFAULTS.textColor}
              lineHeight={noteTextStyle.lineHeight}
              align={isVocabulary ? "center" : (noteView.textAlign ?? "left")}
              verticalAlign={noteView.textVAlign ?? NOTE_DEFAULTS.textVAlign}
              text={noteTextContent}
              onClick={(event) => {
                if (isTimeLocked) {
                  return;
                }
                event.cancelBubble = true;
                selectSingleNote(note.id);
                if (isVocabulary) {
                  toggleVocabularyFlip(note.id);
                } else {
                  openEditor(note.id, noteView.text);
                }
              }}
            />
            {isVocabulary && (
              <Text
                x={12}
                y={Math.max(10, noteView.h - 23)}
                width={Math.max(0, noteView.w - 24)}
                align="center"
                fontSize={10}
                fontStyle="bold"
                fill="#334155"
                text={isVocabularyBack ? "Back • Tap to flip" : "Front • Tap to flip"}
                onClick={(event) => {
                  if (isTimeLocked) {
                    return;
                  }
                  event.cancelBubble = true;
                  toggleVocabularyFlip(note.id);
                }}
              />
            )}
            {showNoteTags &&
              noteTags.map((tag, index) => (
                <Group key={`${note.id}-tag-${tag}`}>
                  <Rect
                    x={12 + index * 64}
                    y={Math.max(10, noteView.h - 25)}
                    width={60}
                    height={16}
                    cornerRadius={8}
                    fill={tagPalette.bg}
                    stroke={tagPalette.border}
                    strokeWidth={0.8}
                  />
                  <Text
                    x={16 + index * 64}
                    y={Math.max(12, noteView.h - 23)}
                    width={52}
                    fontSize={10}
                    fill={tagPalette.text}
                    text={`#${tag}`}
                    wrap="none"
                    ellipsis
                  />
                </Group>
              ))}
            {showNoteTags && overflowTags > 0 && (
              <Text
                x={Math.max(12, noteView.w - 36)}
                y={Math.max(12, noteView.h - 23)}
                width={24}
                align="right"
                fontSize={10}
                fill={tagPalette.text}
                text={`+${overflowTags}`}
              />
            )}
          </Group>
        );
      })}
    </>
  );
};
