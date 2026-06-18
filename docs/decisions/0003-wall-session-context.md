# 0003 Wall Session Context

## Status
Accepted

## Context

During the wall UI refactor (Phases 0–2), `WallCanvas` and chrome components (`WallFloatingUi`, `WallDetailsSidebar`) accumulated 85–100 prop interfaces that merely forwarded orchestration state from the canvas root. This made chrome changes brittle and obscured ownership boundaries.

The domain store (`useWallStore` in `src/features/wall/store.ts`) already owns note/zone/link/camera data. Session context was needed for **UI coordination state** — selection, editing, panel layout, sync chrome, modal openers, and bound command handlers — without introducing a second global state library.

## Decision

Introduce split React contexts under `src/components/wall/session/`:

| Context | Owns |
|---------|------|
| `WallInteractionContext` | Selection, editing, linking, camera intent |
| `WallSyncContext` | Cloud id, sync status, pending/error (read-mostly for UI) |
| `WallLayoutContext` | Panel open state, layout prefs, reading/presentation/focus modes |
| `WallChromeContext` | Header/toolbar/search dock bindings |
| `WallDetailsContext` | Inspector sections, recall, vocabulary, merge wiring |
| `WallModalContext` | Export, settings/help, media-insert modal openers |

`WallSessionProvider` composes all six providers. Chrome components consume `useWallSession()` or granular hooks (`useWallLayout`, `useWallDetails`, etc.) to minimize re-renders.

Bindings are assembled in `useWallSessionBindings.ts` and `useWallSpatialBindings.ts` from orchestration hooks (`useWallCanvasOrchestration` and focused `useWall*` slices). Command execution remains in `src/features/wall/commands.ts`.

Session context lives in **`components/wall/session/`**, not `features/wall/session/`, because it is presentation-layer wiring tied to wall chrome and spatial shells rather than persisted domain state.

## Alternatives Considered

### Continue prop drilling from `WallCanvas`

Rejected — prop surfaces had already exceeded maintainability; every new chrome feature required threading through the orchestrator.

### Single monolithic wall context

Rejected — would over-subscribe consumers and increase re-render risk on unrelated session changes.

### Zustand/Redux session store

Rejected per refactor non-goals — `useWallStore` remains the sole domain store; session state is ephemeral UI coordination.

## Consequences

### Benefits

- `WallFloatingUi` and `WallDetailsSidebar` are prop-less (context-only).
- Clear ownership map from orchestration hooks → session bindings → chrome consumers.
- Granular hooks allow targeted subscriptions as performance needs arise.

### Tradeoffs

- Context value assembly is centralized in binding hooks; debugging requires tracing provider values.
- `useWallCanvasOrchestration` remains a large interim composer until further hook splits.

## Related Docs

- `docs/architecture/frontend-architecture.md`
- `docs/architecture/wall-ui-refactor-implementation-plan.md`
- `docs/contributing/development-workflow.md`
