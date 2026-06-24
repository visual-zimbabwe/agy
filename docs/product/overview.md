# Product Overview

## Purpose

This document describes the current product surface of Agy.

Agy is brain RAM: a visual system for capturing, organizing, and interacting with ideas across spatial, timeline, and study-oriented workspaces.

## Scope

This is a current-state overview. It explains the product shape and the major user-facing work surfaces. Detailed interaction rules belong in feature docs and architecture docs.

## Current Product Surface

Agy is a **light-only** product with one unified design system across routes.

Primary workspaces:

- `Wall`: spatial thinking and relationship mapping
- `Decks`: standalone spaced-repetition study
- `Settings`: account, startup, and workspace preferences
- `Help`: route-based help library and wall quick-help modal

The landing page (`/`) links into Wall and Decks.

Timeline is a **Wall overlay** (`V` or header **Timeline**), not a separate top-level product route.

## Wall

The wall is the main spatial workspace.

Users can:

- create and edit notes via omnibar (`Ctrl/Cmd+K`), shortcuts, and the Structure menu
- move, resize, group, and color notes
- organize with tags, zones, and note groups
- create directional links and wiki-style relationships
- search and filter with omnibar tokens (`tag:`, `type:`, `is:`, `tool:`)
- review changes through Wall History replay and heatmap-style views
- read the current note set chronologically in Timeline (`V`)
- export to PNG, PDF, Markdown, JSON, or published read-only snapshots
- open Help and Settings without leaving the canvas

Wall chrome is simplified:

- **Details panel** — selection inspector only; collapsed by default (pin in Workspace settings)
- **Context bar** — on by default when a note is selected
- **No** Tools left rail, Smart Merge, vocabulary/word review, or Wall→Decks integration

## Decks

Decks is a **standalone** study workspace. It shares auth, header navigation, design tokens, Settings, and Help with Wall but does not import from or sync with wall notes.

Users can:

- create nested decks and sub-decks
- browse cards, inspect stats, and run study sessions
- run custom study with filters and limits
- import deck-native content and configure note types
- use FSRS scheduling when enabled per deck

## Settings

Settings use a shared `SettingsShell`:

- **Wall** — header gear opens a modal overlay
- **Decks and deep links** — full `/settings` route with the same content

Tabs:

- **Account** — profile, email, password, MFA
- **Preferences** — startup route, timezone, keyboard color slots
- **Workspace** — context bar, tags on cards, pin details panel, replay tour

Theme and Basic/Advanced controls mode were removed in the unified refactor.

## Product Model

The current product is a multi-surface workspace with:

- a spatial canvas (Wall)
- a standalone study system (Decks)
- account-backed preferences and sync
- a shared self-serve help layer

Wall and Decks are intentionally separate data models and workflows.

## Time Modes Glossary

The wall exposes two time-oriented surfaces that use different shortcuts and data:

- **Timeline** (`V`): A vertical chronological stream of the **current** wall notes, sorted by creation time. Use it to review what is on the wall today without spatial navigation.
- **Wall History** (`T`): A replay mode that scrubs through **persisted wall snapshots** recorded as the wall changes over time. Editing is locked while history is active.

Both modes are read-only for note mutations. Timeline is linked from the top nav; Wall History is for rewinding to earlier persisted states.

## Known Boundaries

- Wall and Decks have different interaction models and different persistence shapes.
- Some features depend on signed-in Supabase-backed flows.
- Published wall snapshots are intentionally read-only.

## Related Docs

- `docs/architecture/overview.md`
- `docs/architecture/frontend-architecture.md`
- `docs/features/timeline-view.md`
- `docs/features/help-system.md`
- `docs/features/decks.md`
- `docs/decisions/0004-unified-light-refactor.md`
