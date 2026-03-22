# Architecture Overview

## Purpose

This document describes the current high-level system shape of the Agy codebase.

## Scope

This is the cross-cutting architecture summary for routes, UI composition, domain modules, persistence, and API surfaces. It does not replace deeper feature or API documentation.

## Application Shape

Agy is a Next.js App Router application with multiple authenticated and unauthenticated workspaces:

- landing page
- auth routes
- wall workspace
- page editor workspace
- decks workspace
- settings workspace
- server API routes under `src/app/api/`

## Major Layers

### Route Layer

Routes live in `src/app/`.

The route layer is responsible for:

- mounting workspaces
- handling auth gates where required
- passing minimal route-level context into the workspace

### Workspace UI Layer

Large UI surfaces live under `src/components/`.

Current major workspaces:

- `WallCanvas` and `src/components/wall/*`
- `PageEditor`
- `DecksWorkspace`
- `SettingsWorkspace`

This layer handles user interaction, local view state, rendering, and orchestration of domain modules.

### Domain Layer

Feature-specific logic lives under `src/features/`.

- `src/features/wall/`: canonical wall types, commands, storage, migrations, sync helpers, telemetry, and domain utilities
- `src/features/page/`: page types, local persistence, and cloud persistence
- `src/features/decks/`: note types and deck study logic

### Shared Library Layer

Shared infrastructure lives under `src/lib/`.

Examples:

- Supabase client helpers
- Supabase auth-session middleware for server routes and server components
- auth helpers for API routes
- publish helpers
- workspace communication
- preferences and account settings
- wall image upload helpers

## Persistence Model

Agy is local-first in interaction and cloud-backed when signed in.

### Local Persistence

- Wall data uses IndexedDB via Dexie-style storage helpers
- Page state also has local snapshot storage
- Preferences are partially stored locally for faster startup and UI continuity

### Cloud Persistence

Supabase is used for:

- auth
- wall records and snapshots
- deck records, notes, cards, and stats
- page files and signed access
- account settings and profile state

Authenticated App Router pages and API routes depend on request cookies being refreshed through the repository middleware so server-side auth checks keep working after browser sessions age.

## API Surface

API routes live under `src/app/api/`.

Current major API groups:

- `api/walls`
- `api/decks`
- `api/page`
- `api/account`
- `api/convert`

These routes are server-side adapters over Supabase-backed storage and domain operations.

## Data Shape Notes

The wall schema is no longer minimal. It includes:

- notes with multiple note kinds
- zone groups
- note groups
- links
- richer formatting state
- vocabulary review payloads
- canon note payloads
- Eisenhower note payloads

The page schema is block-based and supports media, embeds, tables, code, comments, and file metadata.

The decks schema includes deck hierarchy, note types, cards, study state, and scheduler-related fields.

## Constraints

- Authenticated routes must correctly redirect unauthenticated users.
- Authenticated server routes and server components must receive refreshed Supabase auth cookies or request-scoped auth checks will fail after session aging.
- UI surfaces are large and need explicit modular boundaries to stay maintainable.
- API handlers include compatibility paths for older database states in some areas, especially walls and decks.
- Published wall snapshots must remain read-only.

## Failure Modes

- Missing or outdated Supabase schema can disable newer fields or fallback paths.
- Local and cloud snapshots can drift and require merge or recovery behavior.
- Page file storage depends on bucket availability and signed file access.
- Large workspace files can become difficult to maintain without enforced boundaries.

## Related Docs

- `docs/architecture/frontend-architecture.md`
- `docs/api/walls.md`
- `docs/api/decks.md`
- `docs/features/page-editor.md`
- `docs/features/decks.md`
- `docs/features/timeline-view.md`

