"use client";

import { useCallback, type MutableRefObject } from "react";
import jsPDF from "jspdf";
import type Konva from "konva";

import type { ExportScope } from "@/components/ExportModal";
import type { Note, Zone } from "@/features/wall/types";

type Bounds = { x: number; y: number; w: number; h: number };
type Camera = { x: number; y: number; zoom: number };
type Viewport = { w: number; h: number };

type UseWallExportOptions = {
  stageRef: MutableRefObject<Konva.Stage | null>;
  camera: Camera;
  viewport: Viewport;
  visibleNotes: Note[];
  visibleZones: Zone[];
  activeSelectedNoteIds: string[];
  selectedZoneId?: string;
  zonesById: Record<string, Zone>;
  selectedNoteId?: string;
  allZones: Zone[];
  setCamera: (camera: Camera) => void;
  setExportOpen: (open: boolean) => void;
  computeContentBounds: (notes: Note[], zones: Zone[]) => Bounds | null;
  fitBoundsCamera: (bounds: Bounds, viewport: Viewport) => Camera;
  waitForPaint: () => Promise<void>;
  makeDownloadId: () => string;
  downloadDataUrl: (filename: string, dataUrl: string) => void;
  downloadTextFile: (filename: string, content: string) => void;
  notesToMarkdown: (notes: Note[], zones: Zone[]) => string;
  zoneContainsNote: (zone: Zone, note: Note) => boolean;
};

export const useWallExport = ({
  stageRef,
  camera,
  viewport,
  visibleNotes,
  visibleZones,
  activeSelectedNoteIds,
  selectedZoneId,
  zonesById,
  selectedNoteId,
  allZones,
  setCamera,
  setExportOpen,
  computeContentBounds,
  fitBoundsCamera,
  waitForPaint,
  makeDownloadId,
  downloadDataUrl,
  downloadTextFile,
  notesToMarkdown,
  zoneContainsNote,
}: UseWallExportOptions) => {
  const resolveBoundsForScope = useCallback(
    (scope: ExportScope): Bounds | null => {
      if (scope === "whole") {
        return computeContentBounds(visibleNotes, visibleZones);
      }
      if (scope === "selection") {
        const selected = visibleNotes.filter((note) => activeSelectedNoteIds.includes(note.id));
        return computeContentBounds(selected, []);
      }
      if (scope === "zone" && selectedZoneId) {
        const zone = zonesById[selectedZoneId];
        if (zone) {
          return { x: zone.x, y: zone.y, w: zone.w, h: zone.h };
        }
      }
      return null;
    },
    [activeSelectedNoteIds, computeContentBounds, selectedZoneId, visibleNotes, visibleZones, zonesById],
  );

  const exportPng = useCallback(
    async (scope: ExportScope, pixelRatio: number) => {
      if (!stageRef.current) {
        return;
      }

      if (scope === "view") {
        const dataUrl = stageRef.current.toDataURL({ pixelRatio });
        downloadDataUrl(`agy-view-${makeDownloadId()}.png`, dataUrl);
        return;
      }

      const bounds = resolveBoundsForScope(scope);
      if (!bounds) {
        window.alert("No target content selected for export.");
        return;
      }

      const previousCamera = camera;
      try {
        setCamera(fitBoundsCamera(bounds, viewport));
        await waitForPaint();
        const dataUrl = stageRef.current.toDataURL({ pixelRatio });
        downloadDataUrl(`agy-${scope}-${makeDownloadId()}.png`, dataUrl);
      } finally {
        setCamera(previousCamera);
      }
    },
    [camera, downloadDataUrl, fitBoundsCamera, makeDownloadId, resolveBoundsForScope, setCamera, stageRef, viewport, waitForPaint],
  );

  const exportPdf = useCallback(
    async (scope: ExportScope) => {
      if (!stageRef.current) {
        return;
      }

      let dataUrl = "";
      if (scope === "view") {
        dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
      } else {
        const bounds = resolveBoundsForScope(scope);
        if (!bounds) {
          window.alert("No target content selected for export.");
          return;
        }

        const previousCamera = camera;
        try {
          setCamera(fitBoundsCamera(bounds, viewport));
          await waitForPaint();
          dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
        } finally {
          setCamera(previousCamera);
        }
      }

      const image = new Image();
      image.src = dataUrl;
      await new Promise<void>((resolve) => {
        image.onload = () => resolve();
      });

      const orientation = image.width >= image.height ? "landscape" : "portrait";
      const pdf = new jsPDF({
        orientation,
        unit: "pt",
        format: [image.width, image.height],
      });
      pdf.addImage(dataUrl, "PNG", 0, 0, image.width, image.height);
      pdf.save(`agy-${scope}-${makeDownloadId()}.pdf`);
    },
    [camera, fitBoundsCamera, makeDownloadId, resolveBoundsForScope, setCamera, stageRef, viewport, waitForPaint],
  );

  const exportMarkdown = useCallback(() => {
    const selectedZone = selectedZoneId ? zonesById[selectedZoneId] : undefined;
    const selectedNotes =
      activeSelectedNoteIds.length > 0
        ? visibleNotes.filter((note) => activeSelectedNoteIds.includes(note.id))
        : selectedNoteId
          ? visibleNotes.filter((note) => note.id === selectedNoteId)
          : selectedZone
            ? visibleNotes.filter((note) => zoneContainsNote(selectedZone, note))
            : visibleNotes;

    const content = notesToMarkdown(selectedNotes, allZones);
    downloadTextFile(`agy-${makeDownloadId()}.md`, content);
    setExportOpen(false);
  }, [
    activeSelectedNoteIds,
    allZones,
    downloadTextFile,
    makeDownloadId,
    notesToMarkdown,
    selectedNoteId,
    selectedZoneId,
    setExportOpen,
    visibleNotes,
    zoneContainsNote,
    zonesById,
  ]);

  return {
    exportPng,
    exportPdf,
    exportMarkdown,
  };
};



