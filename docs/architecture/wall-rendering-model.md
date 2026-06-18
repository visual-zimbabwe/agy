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
- resizing drafts
- hover and selection behavior
- drag interactions
- visual reactions to style changes
- wiki footer rendering
- note previews for specialized note types

This is one of the densest rendering components in the wall codebase.

Shared note presentation policy is beginning to move out of the layer as part of the Phase 3 refactor:

- `src/components/wall/spatial/notes/note-layout.ts` owns image-note caption sizing, automatic image-card height, and contained image layout.
- `src/components/wall/spatial/notes/note-style.ts` owns shared canvas note palette, contrast, stroke, fill, and corner-radius helpers.
- `src/components/wall/spatial/notes/note-interaction.ts` owns shared drag, resize, select, and link-create wiring for Konva note groups.
- `src/components/wall/spatial/notes/renderers/WallCompactNoteRenderer.tsx` owns compact and ambient canvas cards used when viewport windowing lowers note detail.
- `src/components/wall/spatial/notes/renderers/WallImageNoteRenderer.tsx` owns the full-detail canvas image card, including loading/error placeholders and caption editing.
- `src/components/wall/spatial/notes/renderers/WallBookmarkNoteRenderer.tsx` owns the full-detail canvas web-bookmark card, including preview thumbnail, favicon/source footer, and open-link affordance.
- `src/components/wall/spatial/notes/renderers/WallFileNoteRenderer.tsx` owns the full-detail canvas file/document card and its download affordance.
- `src/components/wall/spatial/notes/renderers/WallAudioNoteRenderer.tsx` owns the full-detail canvas audio card, including playback, open/download controls, and waveform display.
- `src/components/wall/spatial/notes/renderers/WallVideoNoteRenderer.tsx` owns the full-detail canvas video card, including inline playback controls and poster frame.
- `src/components/wall/spatial/notes/renderers/WallPrivateNoteRenderer.tsx` owns the secured-node canvas card and decrypt affordance.
- `src/components/wall/spatial/notes/renderers/WallJournalNoteRenderer.tsx` owns the full-detail journal canvas card shell and date/title/body layout.
- `src/components/wall/spatial/notes/renderers/WallCodeNoteRenderer.tsx` owns the syntax-highlighted code-note canvas card.
- `src/components/wall/spatial/notes/renderers/WallQuoteNoteRenderer.tsx` owns quote body and attribution/source footer rendering.
- `src/components/wall/spatial/notes/renderers/WallStandardNoteRenderer.tsx` owns the title/body layout for standard text notes.
- `src/components/wall/spatial/notes/renderers/WallNoteChromeOverlays.tsx` owns shared pin, heatmap, highlight, tag, wiki-link, and vocabulary-flip overlays.
- `src/features/wall/wall-note-view-model.ts` owns the first pure title/meta/privacy-mask view model used by compact canvas previews.

`WallNotesLayer` remains the composer: it loads media assets, derives per-note presentation state, and dispatches the renderer components above. Eisenhower matrix notes still render through `EisenhowerMatrixNote`.

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
- canvas and HTML preview labels can drift until the shared view model is adopted by `WallNotePreview` in a later phase

## Related Docs

- `docs/architecture/frontend-architecture.md`
- `docs/features/wall-notes.md`
- `docs/features/published-snapshots.md`
- `docs/qa.md`
