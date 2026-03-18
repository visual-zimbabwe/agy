# Wall Rendering Model

## Purpose

This document describes the current rendering model for the `/wall` workspace.

## Scope

This covers stage/camera behavior, rendering layers, and the high-level responsibilities of the main wall rendering components.

## Design

The wall is rendered on top of `react-konva` and `Konva`.

The wall stage is responsible for:

- viewport-sized rendering
- camera translation and scale
- drag-based panning
- wheel-based pan and zoom
- box-selection initiation on empty canvas

Camera state is represented as:

- `x`
- `y`
- `zoom`

## Stage Behavior

`WallStage` is the main stage wrapper.

Current stage behavior includes:

- panning via drag under the right interaction conditions
- zooming toward the pointer when Ctrl/Cmd + wheel is used
- plain wheel panning when modifier zoom is not active
- world/screen coordinate conversion through helper functions

The stage owns interaction entry points, but rendering is split into separate layers.

## Layer Model

Current wall rendering is conceptually split into several layers.

### Dot Matrix Layer

`WallDotMatrixLayer` renders an optional background dot grid.

Current behavior:

- computes visible world-space dot positions from camera and viewport
- caps total rendered dots to avoid runaway counts

### Links and Zones Layer

`WallLinksZonesLayer` renders:

- directional links
- zone frames
- column zones
- swimlane zones

This layer also owns important selection and drag behavior for zones.

### Notes Layer

`WallNotesLayer` renders note bodies and much of note-adjacent interaction state.

Current responsibilities include:

- note body rendering
- image note layout
- resizing drafts
- hover and selection behavior
- drag interactions
- visual reactions to style changes
- wiki footer rendering
- note previews for specialized note types

This is one of the densest rendering components in the wall codebase.

## Specialized Rendering Behavior

Current specialized note rendering includes:

- image-card layout with automatic height adjustment based on intrinsic image aspect ratio
- journal note treatment
- Eisenhower note rendering
- vocabulary-related preview handling
- quote/canon-specific preview logic

## Constraints

- Rendering must stay coherent under pan and zoom.
- Floating and overlay UI must not be confused with canvas layers.
- Camera and note world coordinates must stay separate.
- Large walls and optional background layers need practical caps and visual discipline.

## Failure Modes

- image notes can cause bad layout if intrinsic image data is missing or unstable
- over-dense grid or layer output can pressure performance
- complex note rendering paths increase regression risk for interaction and sizing behavior

## Related Docs

- `docs/architecture/frontend-architecture.md`
- `docs/features/wall-notes.md`
- `docs/features/published-snapshots.md`
- `docs/qa.md`
