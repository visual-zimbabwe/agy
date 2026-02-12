"use client";

import type { MutableRefObject } from "react";
import { Arrow, Group, Rect, Text } from "react-konva";
import type Konva from "konva";

import { ZONE_DEFAULTS } from "@/features/wall/constants";
import type { Link, LinkType, Note, Zone } from "@/features/wall/types";

type WallLinksZonesLayerProps = {
  visibleLinks: Link[];
  visibleZones: Zone[];
  notesById: Record<string, Note>;
  selectedLinkId?: string;
  selectedNoteId?: string;
  selectedZoneId?: string;
  pathLinkIds: Set<string>;
  linkColorByType: Record<LinkType, string>;
  linkStrokeByType: Record<LinkType, number[]>;
  linkPoints: (from: Note, to: Note) => { points: number[]; mid: { x: number; y: number } };
  zoneNodeRefs: MutableRefObject<Record<string, Konva.Group | null>>;
  isTimeLocked: boolean;
  onSelectLink: (linkId: string) => void;
  onOpenLinkMenu: (x: number, y: number, linkId: string) => void;
  onSelectZone: (zoneId: string, groupId?: string) => void;
  onMoveZone: (zoneId: string, x: number, y: number) => void;
  onResizeZone: (zoneId: string, payload: { x: number; y: number; w: number; h: number }) => void;
};

export const WallLinksZonesLayer = ({
  visibleLinks,
  visibleZones,
  notesById,
  selectedLinkId,
  selectedNoteId,
  selectedZoneId,
  pathLinkIds,
  linkColorByType,
  linkStrokeByType,
  linkPoints,
  zoneNodeRefs,
  isTimeLocked,
  onSelectLink,
  onOpenLinkMenu,
  onSelectZone,
  onMoveZone,
  onResizeZone,
}: WallLinksZonesLayerProps) => {
  const zoneStyle = (zone: Zone, isSelected: boolean) => {
    const kind = zone.kind ?? "frame";
    if (kind === "column") {
      return {
        cornerRadius: 12,
        opacity: 0.32,
        dash: [5, 5] as number[],
        headerHeight: 30,
        headerFill: "rgba(255,255,255,0.72)",
        stroke: isSelected ? "#0f172a" : "#64748b",
      };
    }
    if (kind === "swimlane") {
      return {
        cornerRadius: 10,
        opacity: 0.3,
        dash: [10, 6] as number[],
        headerHeight: 34,
        headerFill: "rgba(255,255,255,0.78)",
        stroke: isSelected ? "#0f172a" : "#64748b",
      };
    }
    return {
      cornerRadius: 18,
      opacity: 0.38,
      dash: [8, 6] as number[],
      headerHeight: 34,
      headerFill: "rgba(255,255,255,0.6)",
      stroke: isSelected ? "#111827" : "#a1a1aa",
    };
  };

  return (
    <>
      {visibleLinks.map((link) => {
        const from = notesById[link.fromNoteId];
        const to = notesById[link.toNoteId];
        if (!from || !to) {
          return null;
        }

        const geometry = linkPoints(from, to);
        const isSelected = selectedLinkId === link.id;
        const inPath = pathLinkIds.has(link.id);
        const showDimmed = Boolean(selectedNoteId) && !inPath;
        const stroke = linkColorByType[link.type];
        const opacity = isSelected ? 1 : showDimmed ? 0.15 : 0.78;

        return (
          <Group
            key={link.id}
            onClick={(event) => {
              event.cancelBubble = true;
              onSelectLink(link.id);
            }}
            onTap={(event) => {
              event.cancelBubble = true;
              onSelectLink(link.id);
            }}
            onContextMenu={(event) => {
              event.evt.preventDefault();
              event.cancelBubble = true;
              onOpenLinkMenu(event.evt.clientX, event.evt.clientY, link.id);
            }}
          >
            <Arrow
              points={geometry.points}
              pointerLength={11}
              pointerWidth={10}
              stroke={stroke}
              fill={stroke}
              dash={linkStrokeByType[link.type]}
              strokeWidth={isSelected ? 3.2 : inPath ? 2.6 : 2}
              opacity={opacity}
              lineCap="round"
              lineJoin="round"
            />
            <Text
              x={geometry.mid.x - 48}
              y={geometry.mid.y - 16}
              width={96}
              align="center"
              fontSize={11}
              fontStyle="bold"
              fill={stroke}
              text={link.label}
              opacity={opacity}
            />
          </Group>
        );
      })}

      {visibleZones.map((zone) => {
        const isSelected = selectedZoneId === zone.id;
        const style = zoneStyle(zone, isSelected);
        const isSwimlane = (zone.kind ?? "frame") === "swimlane";
        return (
          <Group
            key={zone.id}
            ref={(node) => {
              zoneNodeRefs.current[zone.id] = node;
            }}
            x={zone.x}
            y={zone.y}
            width={zone.w}
            height={zone.h}
            draggable={!isTimeLocked}
            onClick={() => {
              onSelectZone(zone.id, zone.groupId);
            }}
            onTap={() => {
              onSelectZone(zone.id, zone.groupId);
            }}
            onDragEnd={(event) => {
              if (isTimeLocked) {
                return;
              }
              onMoveZone(zone.id, event.target.x(), event.target.y());
            }}
            onTransformEnd={(event) => {
              if (isTimeLocked) {
                return;
              }
              const node = event.target;
              const width = Math.max(ZONE_DEFAULTS.minWidth, node.width() * node.scaleX());
              const height = Math.max(ZONE_DEFAULTS.minHeight, node.height() * node.scaleY());
              node.scaleX(1);
              node.scaleY(1);
              onResizeZone(zone.id, { x: node.x(), y: node.y(), w: width, h: height });
            }}
          >
            <Rect
              width={zone.w}
              height={zone.h}
              cornerRadius={style.cornerRadius}
              fill={zone.color}
              opacity={style.opacity}
              stroke={style.stroke}
              strokeWidth={isSelected ? 2 : 1}
              dash={style.dash}
            />
            <Rect width={zone.w} height={style.headerHeight} cornerRadius={style.cornerRadius} fill={style.headerFill} />
            <Text x={12} y={8} fontSize={14} fontStyle="bold" text={zone.label || "Zone"} fill="#1f2937" />
            {isSwimlane && (
              <>
                <Rect x={0} y={Math.max(54, zone.h / 3)} width={zone.w} height={1.2} fill="rgba(15,23,42,0.22)" />
                <Rect x={0} y={Math.max(72, (zone.h * 2) / 3)} width={zone.w} height={1.2} fill="rgba(15,23,42,0.22)" />
              </>
            )}
          </Group>
        );
      })}
    </>
  );
};
