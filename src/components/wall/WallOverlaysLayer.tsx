"use client";

import { type MutableRefObject } from "react";
import { Group, Line, Rect, Text, Transformer } from "react-konva";
import type Konva from "konva";

type Bounds = { x: number; y: number; w: number; h: number };
type SelectionBox = { startX: number; startY: number; x: number; y: number; w: number; h: number };
type GuideLineState = {
  vertical?: { x: number; y1: number; y2: number; distance?: number };
  horizontal?: { y: number; x1: number; x2: number; distance?: number };
};
type TagGroup = { tag: string; noteIds: string[]; bounds: Bounds };
type TagLabelLayout = Record<string, { x: number; y: number }>;

type WallOverlaysLayerProps = {
  showClusters: boolean;
  clusterBounds: Bounds[];
  showAutoTagGroups: boolean;
  autoTagGroups: TagGroup[];
  autoTagLabelLayout: TagLabelLayout;
  tagGroupColor: (tag: string) => string;
  selectionBox: SelectionBox | null;
  guideLines: GuideLineState;
  noteTransformerRef: MutableRefObject<Konva.Transformer | null>;
  zoneTransformerRef: MutableRefObject<Konva.Transformer | null>;
  isCompactLayout: boolean;
  noteMinWidth: number;
  noteMinHeight: number;
  zoneMinWidth: number;
  zoneMinHeight: number;
};

export const WallOverlaysLayer = ({
  showClusters,
  clusterBounds,
  showAutoTagGroups,
  autoTagGroups,
  autoTagLabelLayout,
  tagGroupColor,
  selectionBox,
  guideLines,
  noteTransformerRef,
  zoneTransformerRef,
  isCompactLayout,
  noteMinWidth,
  noteMinHeight,
  zoneMinWidth,
  zoneMinHeight,
}: WallOverlaysLayerProps) => {
  return (
    <>
      {showClusters &&
        clusterBounds.map((cluster, index) => (
          <Rect
            key={`cluster-${index}`}
            x={cluster.x}
            y={cluster.y}
            width={cluster.w}
            height={cluster.h}
            cornerRadius={20}
            stroke="#fb923c"
            strokeWidth={2}
            dash={[10, 8]}
          />
        ))}

      {showAutoTagGroups &&
        autoTagGroups.map((group) => {
          const color = tagGroupColor(group.tag);
          const label = autoTagLabelLayout[group.tag] ?? { x: group.bounds.x + 10, y: group.bounds.y + 8 };
          return (
            <Group key={`tag-group-${group.tag}`}>
              <Rect
                x={group.bounds.x}
                y={group.bounds.y}
                width={group.bounds.w}
                height={group.bounds.h}
                cornerRadius={18}
                stroke={color}
                strokeWidth={1.8}
                dash={[6, 5]}
                opacity={0.55}
              />
              <Text
                x={label.x}
                y={label.y}
                fontSize={11}
                fontStyle="bold"
                fill={color}
                text={`#${group.tag} (${group.noteIds.length})`}
              />
            </Group>
          );
        })}

      {selectionBox && (
        <Rect
          x={Math.min(selectionBox.startX, selectionBox.x)}
          y={Math.min(selectionBox.startY, selectionBox.y)}
          width={Math.abs(selectionBox.w)}
          height={Math.abs(selectionBox.h)}
          fill="rgba(37,99,235,0.15)"
          stroke="#2563eb"
          strokeWidth={1.2}
          dash={[4, 3]}
        />
      )}

      {guideLines.vertical && (
        <Group>
          <Line
            points={[guideLines.vertical.x, guideLines.vertical.y1, guideLines.vertical.x, guideLines.vertical.y2]}
            stroke="#0ea5e9"
            strokeWidth={1.2}
            dash={[6, 4]}
          />
          {typeof guideLines.vertical.distance === "number" && (
            <Text
              x={guideLines.vertical.x + 6}
              y={guideLines.vertical.y1 + 14}
              fontSize={10}
              fill="#0369a1"
              text={`${Math.round(guideLines.vertical.distance)}px`}
            />
          )}
        </Group>
      )}

      {guideLines.horizontal && (
        <Group>
          <Line
            points={[guideLines.horizontal.x1, guideLines.horizontal.y, guideLines.horizontal.x2, guideLines.horizontal.y]}
            stroke="#0ea5e9"
            strokeWidth={1.2}
            dash={[6, 4]}
          />
          {typeof guideLines.horizontal.distance === "number" && (
            <Text
              x={guideLines.horizontal.x1 + 10}
              y={guideLines.horizontal.y + 6}
              fontSize={10}
              fill="#0369a1"
              text={`${Math.round(guideLines.horizontal.distance)}px`}
            />
          )}
        </Group>
      )}

      <Transformer
        ref={(node) => {
          noteTransformerRef.current = node;
        }}
        rotateEnabled={false}
        borderStroke="#111827"
        anchorFill="#111827"
        anchorSize={isCompactLayout ? 11 : 9}
        enabledAnchors={[
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
          "middle-left",
          "middle-right",
          "top-center",
          "bottom-center",
        ]}
        boundBoxFunc={(oldBox, newBox) => {
          if (newBox.width < noteMinWidth || newBox.height < noteMinHeight) {
            return oldBox;
          }
          return newBox;
        }}
      />

      <Transformer
        ref={(node) => {
          zoneTransformerRef.current = node;
        }}
        rotateEnabled={false}
        borderStroke="#334155"
        anchorFill="#334155"
        anchorSize={isCompactLayout ? 11 : 9}
        enabledAnchors={[
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
          "middle-left",
          "middle-right",
          "top-center",
          "bottom-center",
        ]}
        boundBoxFunc={(oldBox, newBox) => {
          if (newBox.width < zoneMinWidth || newBox.height < zoneMinHeight) {
            return oldBox;
          }
          return newBox;
        }}
      />
    </>
  );
};
