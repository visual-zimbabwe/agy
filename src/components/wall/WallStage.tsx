"use client";

import { type Dispatch, type MutableRefObject, type ReactNode, type SetStateAction } from "react";
import { Stage } from "react-konva";
import type Konva from "konva";

import { clamp } from "@/lib/wall-utils";

type CameraState = {
  x: number;
  y: number;
  zoom: number;
};

type SelectionBox = {
  startX: number;
  startY: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

type WallStageProps = {
  stageRef: MutableRefObject<Konva.Stage | null>;
  viewport: { w: number; h: number };
  camera: CameraState;
  setCamera: (camera: CameraState) => void;
  isSpaceDown: boolean;
  isMiddleDragging: boolean;
  isLeftCanvasDragging: boolean;
  setIsMiddleDragging: Dispatch<SetStateAction<boolean>>;
  setIsLeftCanvasDragging: Dispatch<SetStateAction<boolean>>;
  boxSelectMode: boolean;
  isTimeLocked: boolean;
  selectionBox: SelectionBox | null;
  setSelectionBox: Dispatch<SetStateAction<SelectionBox | null>>;
  toWorldPoint: (screenX: number, screenY: number, camera: CameraState) => { x: number; y: number };
  onEmptyCanvasClick: () => void;
  onUserCameraIntent?: () => void;
  children: ReactNode;
};

export const WallStage = ({
  stageRef,
  viewport,
  camera,
  setCamera,
  isSpaceDown,
  isMiddleDragging,
  isLeftCanvasDragging,
  setIsMiddleDragging,
  setIsLeftCanvasDragging,
  boxSelectMode,
  isTimeLocked,
  selectionBox,
  setSelectionBox,
  toWorldPoint,
  onEmptyCanvasClick,
  onUserCameraIntent,
  children,
}: WallStageProps) => {
  return (
    <Stage
      ref={(node) => {
        stageRef.current = node;
      }}
      width={viewport.w}
      height={viewport.h}
      x={camera.x}
      y={camera.y}
      scaleX={camera.zoom}
      scaleY={camera.zoom}
      draggable={isSpaceDown || isMiddleDragging || (isLeftCanvasDragging && !boxSelectMode)}
      onMouseDown={(event) => {
        const stage = event.target.getStage();
        if (event.evt.button === 1) {
          onUserCameraIntent?.();
          setIsMiddleDragging(true);
        }

        const clickedOnEmpty = event.target === stage;
        if (clickedOnEmpty) {
          onUserCameraIntent?.();
          if (event.evt.button === 0) {
            if (boxSelectMode && !isTimeLocked) {
              const pointer = stage?.getPointerPosition();
              if (pointer) {
                const start = toWorldPoint(pointer.x, pointer.y, camera);
                setSelectionBox({
                  startX: start.x,
                  startY: start.y,
                  x: start.x,
                  y: start.y,
                  w: 0,
                  h: 0,
                });
              }
            } else {
              setIsLeftCanvasDragging(true);
              stage?.startDrag();
            }
          }
          onEmptyCanvasClick();
        }
      }}
      onMouseMove={(event) => {
        if (!selectionBox) {
          return;
        }
        const stage = event.target.getStage();
        const pointer = stage?.getPointerPosition();
        if (!pointer) {
          return;
        }
        const current = toWorldPoint(pointer.x, pointer.y, camera);
        setSelectionBox((previous) =>
          previous
            ? {
                ...previous,
                x: current.x,
                y: current.y,
                w: current.x - previous.startX,
                h: current.y - previous.startY,
              }
            : previous,
        );
      }}
      onDragEnd={(event) => {
        const stage = event.target.getStage();
        if (!stage || event.target !== stage) {
          return;
        }
        setCamera({ ...camera, x: stage.x(), y: stage.y() });
        setIsLeftCanvasDragging(false);
        setIsMiddleDragging(false);
      }}
      onWheel={(event) => {
        event.evt.preventDefault();
        onUserCameraIntent?.();

        const stage = event.target.getStage();
        if (!stage) {
          return;
        }

        const pointer = stage.getPointerPosition();
        if (!pointer) {
          return;
        }

        if (event.evt.ctrlKey || event.evt.metaKey) {
          const oldScale = camera.zoom;
          const scaleBy = 1.06;
          const direction = event.evt.deltaY > 0 ? -1 : 1;
          const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
          const zoom = clamp(newScale, 0.2, 2.8);

          const mousePoint = {
            x: (pointer.x - camera.x) / oldScale,
            y: (pointer.y - camera.y) / oldScale,
          };

          setCamera({
            zoom,
            x: pointer.x - mousePoint.x * zoom,
            y: pointer.y - mousePoint.y * zoom,
          });
        } else {
          setCamera({
            ...camera,
            x: camera.x - event.evt.deltaX,
            y: camera.y - event.evt.deltaY,
          });
        }
      }}
    >
      {children}
    </Stage>
  );
};
