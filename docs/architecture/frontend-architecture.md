# Frontend Architecture

## Purpose

This document defines the current UI structure and frontend module boundaries for Agy.

## Scope

This document covers route surfaces, workspace ownership, shared UI primitives, and growth guardrails for the frontend codebase.

## Route Surface Architecture

### `src/app/page.tsx`

- Landing page for the product
- Links into wall, page, and decks surfaces
- Uses shared route-shell styling and product framing

### `src/app/login/page.tsx` and `src/app/signup/page.tsx`

- Auth-only forms and account messaging
- Built from shared UI primitives instead of route-local styling systems

### `src/app/wall/page.tsx`

- Auth gate plus wall mount point
- Supports published read-only snapshot mode through query params
- Delegates workspace implementation to `WallCanvas`

### `src/app/page/page.tsx`

- Page editor mount point
- Suspense-wrapped client workspace
- Delegates interaction model to `PageEditor`

### `src/app/decks/page.tsx`

- Auth-gated decks workspace route
- Delegates full decks experience to `DecksWorkspace`

### `src/app/settings/page.tsx`

- Auth-gated settings route
- Delegates settings UI to `SettingsWorkspace`

## Workspace Boundaries

### Wall

- `src/components/WallCanvas.tsx`: wall composition root and orchestration layer
- `src/components/wall/WallStage.tsx`: Konva stage and camera interaction surface
- `src/components/wall/WallToolbar.tsx`, `WallHeaderBar.tsx`: command surfaces and route-adjacent controls
- `src/components/wall/WallToolsPanel.tsx`, `WallDetailsSidebar.tsx`: left/right contextual panels
- `src/components/wall/WallFloatingUi.tsx`, `WallGlobalModals.tsx`: floating editors, menus, and modal layer
- `src/components/wall/useWall*.ts`: modular wall behavior hooks

### Page

- `src/components/page-editor/PageEditor.tsx`: page editor composition root
- Owns slash commands, canvas behavior, block editing, uploads, comments, embeds, and block menus
- Uses feature-layer page types and storage helpers under `src/features/page/`

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

Avoid:

- route-local color systems that diverge from product tokens
- duplicated style maps inside large workspace files

## Growth Guardrails

- Extract large workspace files by responsibility instead of layering more logic into the root.
- Convert repeated styling patterns into primitives or shared maps.
- Keep route files thin; move UI logic into workspace components.
- Validate meaningful frontend changes with:
  - `npm run lint`
  - `npm run check:regressions`
  - `npm run build`
  - relevant sections in `docs/qa.md`

## Related Docs

- `docs/architecture/overview.md`
- `docs/features/page-editor.md`
- `docs/features/decks.md`
- `docs/features/timeline-view.md`

