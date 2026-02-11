"use client";

import { useCallback } from "react";

import type { Note } from "@/features/wall/types";

type GuideLineState = {
  vertical?: { x: number; y1: number; y2: number; distance?: number };
  horizontal?: { y: number; x1: number; x2: number; distance?: number };
};

type UseWallSnappingOptions = {
  dragSnapThreshold: number;
  cameraZoom: number;
  visibleNotes: Note[];
  activeSelectedNoteIdSet: Set<string>;
  setGuideLines: (guides: GuideLineState) => void;
};

export const useWallSnapping = ({
  dragSnapThreshold,
  cameraZoom,
  visibleNotes,
  activeSelectedNoteIdSet,
  setGuideLines,
}: UseWallSnappingOptions) => {
  const resolveSnappedPosition = useCallback(
    (note: Note, candidateX: number, candidateY: number) => {
      const snapThreshold = dragSnapThreshold / Math.max(0.35, cameraZoom);
      const noteLeft = candidateX;
      const noteRight = candidateX + note.w;
      const noteCenterX = candidateX + note.w / 2;
      const noteTop = candidateY;
      const noteBottom = candidateY + note.h;
      const noteCenterY = candidateY + note.h / 2;
      const boundsY1 = Math.min(noteTop, noteBottom) - 240;
      const boundsY2 = Math.max(noteTop, noteBottom) + 240;
      const boundsX1 = Math.min(noteLeft, noteRight) - 280;
      const boundsX2 = Math.max(noteLeft, noteRight) + 280;

      let bestX: { value: number; dist: number; measure?: number; target?: number } | undefined;
      let bestY: { value: number; dist: number; measure?: number; target?: number } | undefined;

      for (const peer of visibleNotes) {
        if (peer.id === note.id || activeSelectedNoteIdSet.has(peer.id)) {
          continue;
        }

        const peerLeft = peer.x;
        const peerRight = peer.x + peer.w;
        const peerCenterX = peer.x + peer.w / 2;
        const peerTop = peer.y;
        const peerBottom = peer.y + peer.h;
        const peerCenterY = peer.y + peer.h / 2;

        const xCandidates = [
          { target: peerLeft, value: peerLeft, measure: Math.abs(noteLeft - peerLeft) },
          { target: peerRight, value: peerRight - note.w, measure: Math.abs(noteLeft - peerRight) },
          { target: peerCenterX, value: peerCenterX - note.w / 2, measure: Math.abs(noteCenterX - peerCenterX) },
        ];
        for (const candidate of xCandidates) {
          const dist = Math.abs(candidate.value - candidateX);
          if (dist <= snapThreshold && (!bestX || dist < bestX.dist)) {
            bestX = { value: candidate.value, dist, measure: candidate.measure, target: candidate.target };
          }
        }

        const yCandidates = [
          { target: peerTop, value: peerTop, measure: Math.abs(noteTop - peerTop) },
          { target: peerBottom, value: peerBottom - note.h, measure: Math.abs(noteTop - peerBottom) },
          { target: peerCenterY, value: peerCenterY - note.h / 2, measure: Math.abs(noteCenterY - peerCenterY) },
        ];
        for (const candidate of yCandidates) {
          const dist = Math.abs(candidate.value - candidateY);
          if (dist <= snapThreshold && (!bestY || dist < bestY.dist)) {
            bestY = { value: candidate.value, dist, measure: candidate.measure, target: candidate.target };
          }
        }
      }

      const snappedX = bestX ? bestX.value : candidateX;
      const snappedY = bestY ? bestY.value : candidateY;
      setGuideLines({
        vertical: bestX
          ? {
              x: snappedX + note.w / 2,
              y1: boundsY1,
              y2: boundsY2,
              distance: bestX.measure,
            }
          : undefined,
        horizontal: bestY
          ? {
              y: snappedY + note.h / 2,
              x1: boundsX1,
              x2: boundsX2,
              distance: bestY.measure,
            }
          : undefined,
      });

      return { x: snappedX, y: snappedY };
    },
    [activeSelectedNoteIdSet, cameraZoom, dragSnapThreshold, setGuideLines, visibleNotes],
  );

  return { resolveSnappedPosition };
};
