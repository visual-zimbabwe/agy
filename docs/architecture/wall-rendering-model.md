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

`WallNotesLayer` is a thin composer (~226 lines) that maps visible notes, builds interaction group props, and dispatches compact or full-detail renderers. Eisenhower matrix notes still render through `EisenhowerMatrixNote`.

Per-kind and shared rendering modules under `src/components/wall/spatial/notes/`:

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
- `src/components/wall/spatial/notes/renderers/WallFullNoteRenderer.tsx` owns full-detail note dispatch and composes the per-kind renderers above for viewport-full detail.
- `src/components/wall/spatial/notes/build-wall-note-presentation.ts` owns pure per-note presentation derivation (text labels, media metadata, layout insets) for full-detail canvas rendering.
- `src/components/wall/spatial/notes/useWallNoteAssets.ts` owns decoded image loading, LRU eviction, and automatic image-note height adjustment.
- `src/components/wall/spatial/notes/useWallNoteStyleAnimations.ts` owns color-wash and text-size pulse reactions when note style changes.
- `src/components/wall/spatial/notes/open-note-editor.ts` owns double-click / open-editor routing by note kind.
- `src/features/wall/wall-note-view-model.ts`: `getWallNoteViewModel(note, context)` — shared title/meta/privacy-mask view model for compact canvas previews, full-detail canvas derivation, HTML previews, and timeline stream labels

**Phase 4 (2026-06-18):** `getWallNoteViewModel(note, context)` is the single presentation boundary for note titles, subtitles, privacy masking, and media metadata. See [View model field mapping](#view-model-field-mapping).

**Phase 3 (2026-06-18):** Note rendering split by kind under `wall/spatial/notes/renderers/`; interaction wiring in `note-interaction.ts`; keyboard handlers split under `wall/keyboard/`.

## View model field mapping

| View model field | Konva consumer | HTML / timeline consumer |
|------------------|----------------|---------------------------|
| `title` | `WallCompactNoteRenderer` title `Text`; full-detail audio/video/file/private renderers | `WallNotePreview` media/private/file title rows; `getTimelineNoteLabel` |
| `meta` / `metaDisplay` | `WallCompactNoteRenderer` footer `Text`; `buildWallNotePresentation` media meta passed to full renderers | `WallNotePreview` media meta rows; timeline file/bookmark subtitles via `getTimelineNoteSubtitle` |
| `privacyMaskLabel` / `privacyMetaLabel` | `WallPrivateNoteRenderer` secured label | `WallNotePreview` private card |
| `standardTitle` / `standardBody` | `buildWallNotePresentation` → `WallStandardNoteRenderer` | `WallNotePreview` standard card |
| `journalTitle` / `journalBody` | `buildWallNotePresentation` → `WallJournalNoteRenderer` | `WallNotePreview` journal card |
| `imageCaption` / `imageMeta` | `buildWallNotePresentation` image caption + `WallImageNoteRenderer` | `WallNotePreview` image card |
| `badge` | `WallCompactNoteRenderer` kind pill | — |

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
- specialized layout (code syntax tinting, Eisenhower quadrants, quote typography) can still drift between surfaces if changed without checking all three consumers (Konva renderer, `WallNotePreview`, timeline stream)

Canvas compact/full-detail renderers, `WallNotePreview`, and timeline stream labels consume `getWallNoteViewModel` for shared title/meta/privacy presentation (Phase 4, 2026-06-18).

## Related Docs

- `docs/architecture/frontend-architecture.md`
- `docs/architecture/wall-ui-refactor-implementation-plan.md`
- `docs/features/wall-notes.md`
- `docs/features/published-snapshots.md`
- `docs/product/ux-rules.md`
- `docs/qa.md`
