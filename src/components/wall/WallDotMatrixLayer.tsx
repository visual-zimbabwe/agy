"use client";

import { useMemo } from "react";
import { Circle } from "react-konva";

type WallDotMatrixLayerProps = {
  showDotMatrix: boolean;
  dotGridSpacing: number;
  camera: { x: number; y: number; zoom: number };
  viewport: { w: number; h: number };
};

export const WallDotMatrixLayer = ({ showDotMatrix, dotGridSpacing, camera, viewport }: WallDotMatrixLayerProps) => {
  const visibleDots = useMemo(() => {
    if (!showDotMatrix || dotGridSpacing <= 0) {
      return [];
    }

    const spacing = dotGridSpacing;
    const worldX1 = (-camera.x / camera.zoom) - spacing;
    const worldY1 = (-camera.y / camera.zoom) - spacing;
    const worldX2 = (viewport.w - camera.x) / camera.zoom + spacing;
    const worldY2 = (viewport.h - camera.y) / camera.zoom + spacing;

    const startX = Math.floor(worldX1 / spacing) * spacing;
    const endX = Math.ceil(worldX2 / spacing) * spacing;
    const startY = Math.floor(worldY1 / spacing) * spacing;
    const endY = Math.ceil(worldY2 / spacing) * spacing;

    const maxDots = 2200;
    const dots: Array<{ x: number; y: number }> = [];
    for (let x = startX; x <= endX; x += spacing) {
      for (let y = startY; y <= endY; y += spacing) {
        dots.push({ x, y });
        if (dots.length >= maxDots) {
          return dots;
        }
      }
    }
    return dots;
  }, [camera.x, camera.y, camera.zoom, dotGridSpacing, showDotMatrix, viewport.h, viewport.w]);

  return (
    <>
      {showDotMatrix &&
        visibleDots.map((dot) => (
          <Circle key={`dot-${dot.x}-${dot.y}`} x={dot.x} y={dot.y} radius={0.9} fill="rgba(15,23,42,0.13)" />
        ))}
    </>
  );
};

