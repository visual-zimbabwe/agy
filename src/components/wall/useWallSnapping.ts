"use client";

import { useCallback } from "react";

import type { Note, Zone } from "@/features/wall/types";

type GuideLineState = {
  vertical?: { x: number; y1: number; y2: number; distance?: number };
  horizontal?: { y: number; x1: number; x2: number; distance?: number };
};

type UseWallSnappingOptions = {
  dragSnapThreshold: number;
  cameraZoom: number;
  visibleNotes: Note[];
  visibleZones: Zone[];
  activeSelectedNoteIdSet: Set<string>;
  snapToGuides: boolean;
  snapToGrid: boolean;
  gridSize: number;
  setGuideLines: (guides: GuideLineState) => void;
};

export const useWallSnapping = ({
  dragSnapThreshold,
  cameraZoom,
  visibleNotes,
  visibleZones,
  activeSelectedNoteIdSet,
  snapToGuides,
  snapToGrid,
  gridSize,
  setGuideLines,
}: UseWallSnappingOptions) => {
  const resolveSnappedPosition = useCallback(
    (note: Note, candidateX: number, candidateY: number) => {
      if (!snapToGuides && !snapToGrid) {
        setGuideLines({});
        return { x: candidateX, y: candidateY };
      }

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

      if (snapToGuides) {
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

        for (const zone of visibleZones) {
          const zoneLeft = zone.x;
          const zoneRight = zone.x + zone.w;
          const zoneCenterX = zone.x + zone.w / 2;
          const zoneTop = zone.y;
          const zoneBottom = zone.y + zone.h;
          const zoneCenterY = zone.y + zone.h / 2;

          const xCandidates = [
            { target: zoneLeft, value: zoneLeft, measure: Math.abs(noteLeft - zoneLeft) },
            { target: zoneRight, value: zoneRight - note.w, measure: Math.abs(noteLeft - zoneRight) },
            { target: zoneCenterX, value: zoneCenterX - note.w / 2, measure: Math.abs(noteCenterX - zoneCenterX) },
          ];
          for (const candidate of xCandidates) {
            const dist = Math.abs(candidate.value - candidateX);
            if (dist <= snapThreshold && (!bestX || dist < bestX.dist)) {
              bestX = { value: candidate.value, dist, measure: candidate.measure, target: candidate.target };
            }
          }

          const yCandidates = [
            { target: zoneTop, value: zoneTop, measure: Math.abs(noteTop - zoneTop) },
            { target: zoneBottom, value: zoneBottom - note.h, measure: Math.abs(noteTop - zoneBottom) },
            { target: zoneCenterY, value: zoneCenterY - note.h / 2, measure: Math.abs(noteCenterY - zoneCenterY) },
          ];
          for (const candidate of yCandidates) {
            const dist = Math.abs(candidate.value - candidateY);
            if (dist <= snapThreshold && (!bestY || dist < bestY.dist)) {
              bestY = { value: candidate.value, dist, measure: candidate.measure, target: candidate.target };
            }
          }
        }
      }

      if (snapToGrid && gridSize > 0) {
        const gridX = Math.round(candidateX / gridSize) * gridSize;
        const gridY = Math.round(candidateY / gridSize) * gridSize;
        const gridDistX = Math.abs(gridX - candidateX);
        const gridDistY = Math.abs(gridY - candidateY);
        if (gridDistX <= snapThreshold && (!bestX || gridDistX < bestX.dist)) {
          bestX = { value: gridX, dist: gridDistX, measure: gridDistX, target: gridX };
        }
        if (gridDistY <= snapThreshold && (!bestY || gridDistY < bestY.dist)) {
          bestY = { value: gridY, dist: gridDistY, measure: gridDistY, target: gridY };
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
    [
      activeSelectedNoteIdSet,
      cameraZoom,
      dragSnapThreshold,
      gridSize,
      setGuideLines,
      snapToGrid,
      snapToGuides,
      visibleNotes,
      visibleZones,
    ],
  );

  return { resolveSnappedPosition };
};
