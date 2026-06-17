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

- `src/components/WallCanvas.tsx`: wall composition root and orchestration layer
- `src/components/wall/session/`: wall session context scaffold (`WallSessionProvider`, interaction/sync/layout contexts) — see [`wall-ui-refactor-implementation-plan.md`](wall-ui-refactor-implementation-plan.md)
- `src/components/wall/WallStage.tsx`: Konva stage and camera interaction surface
- `src/components/wall/WallToolbar.tsx`, `WallHeaderBar.tsx`: command surfaces and route-adjacent controls
- `src/components/wall/WallToolsPanel.tsx`, `WallDetailsSidebar.tsx`: left/right contextual panels
- `src/components/wall/WallFloatingUi.tsx`, `WallGlobalModals.tsx`: floating editors, menus, and modal layer
- `src/components/wall/useWall*.ts`: modular wall behavior hooks
- Timeline stream (`V`):
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

Avoid:

- route-local color systems that diverge from product tokens
- duplicated style maps inside large workspace files

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
- `docs/architecture/wall-ui-refactor-implementation-plan.md` (active structural refactor for wall UI; Phase 0 shipped)
- `docs/features/decks.md`
- `docs/features/timeline-view.md`

