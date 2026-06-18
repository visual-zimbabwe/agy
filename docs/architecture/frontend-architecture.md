# Frontend Architecture

## Purpose

This document defines the current UI structure and frontend module boundaries for Agy.

## Scope

This document covers route surfaces, workspace ownership, shared UI primitives, and growth guardrails for the frontend codebase.

## Route Surface Architecture

### `src/app/page.tsx`

- Landing page for the product
- Links into wall and decks surfaces
- Uses shared route-shell styling and product framing

### `src/app/login/page.tsx` and `src/app/signup/page.tsx`

- Auth-only forms and account messaging
- Built from shared UI primitives instead of route-local styling systems
- Login posts credentials to the same-origin `src/app/api/auth/login/route.ts` handler so the server can establish Supabase auth cookies before redirecting into authenticated workspaces

### `src/app/wall/page.tsx`

- Auth gate plus wall mount point
- Supports published read-only snapshot mode through query params
- Delegates workspace implementation to `WallCanvas`

### `src/app/page/page.tsx` and `src/app/media/page.tsx`

- Legacy removed-workspace routes
- Server-redirect to `/wall`

### `src/app/decks/page.tsx`

- Auth-gated decks workspace route
- Delegates full decks experience to `DecksWorkspace`

### `src/app/settings/page.tsx`

- Auth-gated settings route
- Delegates settings UI to `SettingsWorkspace`

## Workspace Boundaries

### Wall

Wall UI refactor Phases 0–6 shipped (2026-06-18). See [`wall-ui-refactor-implementation-plan.md`](wall-ui-refactor-implementation-plan.md) for phase history.

#### Composition shell

- `src/components/WallCanvas.tsx`: thin wall composition shell (~75 lines) — mounts `WallSessionProvider`, delegates orchestration to `useWallCanvasOrchestration`, renders `WallSpatialView` + `WallChromeShell`
- `src/components/wall/useWallCanvasOrchestration.ts`: interim orchestration hook — composes domain/`useWall*` hooks and session/spatial binding assembly (exceeds 400 lines; further splits are optional follow-up)

#### Session model

Session contexts live in `src/components/wall/session/` (ADR: [`0003-wall-session-context.md`](../decisions/0003-wall-session-context.md)):

| Module | Role |
|--------|------|
| `WallSessionProvider.tsx` | Composes all session providers |
| `useWallSession.ts` | Composed read API for chrome (`interaction`, `sync`, `layout`, `chrome`, `details`, `modals`) |
| `useWallSessionBindings.ts` | Binds orchestration state/handlers into context values |
| `wall-interaction-context.tsx` | Selection, editing, linking, camera intent |
| `wall-sync-context.tsx` | Cloud id, sync status, pending/error (read-mostly) |
| `wall-layout-context.tsx` | Panel open state, layout prefs, reading/presentation/focus modes |
| `wall-chrome-context.tsx` | Header, toolbar, search dock bindings |
| `wall-details-context.tsx` | Inspector sections, recall, vocabulary, merge wiring |
| `wall-modal-context.tsx` | Modal openers (export, settings/help, media insert) |
| `useWallSpatialBindings.ts` | Spatial + chrome shell prop assembly for Konva/HTML subsystems |

Chrome components (`WallFloatingUi`, `WallDetailsSidebar`, details sections) consume context; no prop firehose from `WallCanvas`.

#### Spatial shell

- `src/components/wall/spatial/WallSpatialView.tsx`: Konva canvas container — `WallStage`, dot matrix, notes, links/zones, overlays, inline video, floating UI
- `src/components/wall/spatial/notes/WallNotesLayer.tsx`: thin notes composer (~226 lines)
- `src/components/wall/spatial/notes/renderers/*`: per-kind Konva renderers + `WallCompactNoteRenderer`, `WallFullNoteRenderer`, `WallNoteChromeOverlays`
- `src/components/wall/spatial/notes/note-layout.ts`, `note-style.ts`, `note-interaction.ts`: shared layout, palette, and interaction wiring
- `src/components/wall/spatial/notes/build-wall-note-presentation.ts`: full-detail canvas presentation derivation (consumes view model)
- `src/components/wall/spatial/notes/useWallNoteAssets.ts`, `useWallNoteStyleAnimations.ts`: asset loading and style animations

#### Chrome shell

- `src/components/wall/chrome/WallChromeShell.tsx`: `WallChromeHeader` (top bar) + `WallInCanvasChrome` (tools panel, timeline stream toggle, search dock, footer, details sidebar, product tour)
- `src/components/wall/WallFloatingUi.tsx`, `WallDetailsSidebar.tsx`: context-only chrome (0 props)
- `src/components/wall/modals/WallExportModals.tsx`, `WallSettingsHelpModals.tsx`, `WallMediaInsertModals.tsx`: domain-split modal clusters (composed by `WallGlobalModals`)

#### Presentation boundary

- `src/features/wall/wall-note-view-model.ts`: `getWallNoteViewModel(note, context)` — shared title/meta/privacy/media metadata for canvas, HTML preview, and timeline stream

#### Keyboard

- `src/components/wall/keyboard/useWallKeyboardNavigation.ts`, `useWallKeyboardEditing.ts`, `useWallKeyboardSelection.ts`: scoped keyboard handlers
- `src/components/wall/useWallKeyboard.ts`: composer re-export

#### Orchestration hooks (selected)

- `useWallCloudSync.ts`: cloud sync scheduling, delta push, rebase
- `useWallPersistenceEffects.ts`: local + cloud bootstrap
- `useWallPrivateNotes.ts`, `useWallBookmarkOrchestration.ts`, `useWallNoteCreation.ts`, `useWallMediaNoteHandlers.ts`, `useWallImageInsert.ts`, `useWallPresentationPaths.ts`, `useWallCommandPalette.ts`, `useWallClientPrefs.ts`, and other focused `useWall*` slices

#### Helper modules

- `src/components/wall/wall-coordinates.ts`, `wall-links-geometry.ts`, `wall-download.ts`, `wall-storage-keys.ts`, `wall-canvas-helpers.ts`
- `src/components/wall/atelier-palette.ts`: Digital Atelier palette for HTML stream/preview surfaces (see `docs/product/ux-rules.md`)

#### File tree (wall components)

```text
src/components/wall/
  session/           # WallSessionProvider + split contexts + bindings
  spatial/
    WallSpatialView.tsx
    notes/
      WallNotesLayer.tsx
      renderers/       # per-kind Konva renderers
      note-layout.ts, note-style.ts, note-interaction.ts
      build-wall-note-presentation.ts
  chrome/
    WallChromeShell.tsx
  modals/            # export, settings/help, media insert clusters
  keyboard/          # scoped keyboard sub-hooks
  details/           # inspector section components
  atelier-palette.ts # HTML stream/preview palette
  useWall*.ts        # orchestration and behavior hooks
```

#### Timeline stream (`V`)

- `src/components/wall/WallTimelineView.tsx`: vertical stream composition root with `@tanstack/react-virtual` list virtualization
- `src/components/wall/WallTimelineVirtualRow.tsx`: virtual row renderer for day headers and note entries (single preview path per entry)
- `src/components/wall/WallTimelineStreamHeader.tsx`: search, day jump, sort, and prev/next controls
- `src/components/wall/useWallTimelineStream.ts`: stream filter/sort/selection state and flattened virtual item list
- `src/components/wall/useIsDesktopTimelineLayout.ts`: breakpoint hook for desktop vs mobile stream layout
- `src/components/wall/wallTimelineStreamHelpers.ts`: grouping, search predicates, selection helpers, and row-height estimation
- `src/components/wall/WallTimelineDetailPanel.tsx`: read-only selected-note detail rail on `xl+` stream viewports
- `src/components/wall/wallTimelineViewHelpers.ts`: shared date formatting helpers
- `src/components/wall/wallTimelineViewLayout.ts`: legacy horizontal canvas layout engine retained for tests only

### Decks

- `src/components/decks/DecksWorkspace.tsx`: decks workspace composition root
- Owns decks, browse, stats, and study views
- Talks to deck APIs for deck management, study, tags, browse, note types, import presets, and scheduling

### Settings

- `src/components/settings/SettingsWorkspace.tsx`: settings UI and preference flows
- Owns account settings, appearance, startup behavior, keyboard slots, and workspace chrome preferences

## Shared UI Primitive Rules

Primary shared primitives live under `src/components/ui/`.

- `Button.tsx`
- `Panel.tsx`
- `Field.tsx`
- `ModalShell.tsx`
- `Badge.tsx`

New surfaces should prefer composing from these primitives before introducing one-off variants.

## Token Usage Rules

Source of truth for shared design tokens is `src/app/globals.css`.

Use:

- CSS variables for colors, radii, shadows, and motion
- shared wall chrome classes where those abstractions already exist
- `src/components/wall/atelier-palette.ts` and `.wall-atelier-shell` CSS vars for wall HTML preview and timeline stream surfaces (see `docs/product/ux-rules.md`)

Avoid:

- route-local color systems that diverge from product tokens
- duplicated style maps inside large workspace files
- reintroducing prop drilling into context-migrated wall chrome components

## Growth Guardrails

- Extract large workspace files by responsibility instead of layering more logic into the root.
- Convert repeated styling patterns into primitives or shared maps.
- Keep route files thin; move UI logic into workspace components.
- During the wall UI refactor, follow the guardrails in [`docs/contributing/development-workflow.md`](../contributing/development-workflow.md#wall-ui-refactor-guardrails) and [`wall-ui-refactor-implementation-plan.md`](wall-ui-refactor-implementation-plan.md).
- Validate meaningful frontend changes with:
  - `npm run lint`
  - `npm run check:regressions`
  - `npm run build`
  - relevant sections in `docs/qa.md`

## Related Docs

- `docs/architecture/overview.md`
- `docs/architecture/wall-ui-refactor-implementation-plan.md` (wall UI refactor — Phases 0–6 shipped)
- `docs/decisions/0003-wall-session-context.md`
- `docs/product/ux-rules.md`
- `docs/features/decks.md`
- `docs/features/timeline-view.md`

