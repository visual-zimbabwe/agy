# Product Overview

## Purpose

This document describes the current product surface of Agy.

Agy is brain RAM: a visual system for capturing, organizing, and interacting with ideas across spatial, document, and review-oriented workspaces.

## Scope

This is a current-state overview. It explains the product shape and the major user-facing work surfaces. Detailed interaction rules belong in feature docs and architecture docs.

## Current Product Surface

Agy currently has three primary workspaces:

- `Wall`: spatial thinking and relationship mapping
- `Decks`: study and repetition workflows
- `Settings`: account, startup, appearance, and control preferences

The landing page links directly into these surfaces.

A support layer now spans the product through a wall quick-help modal and the route-based `/help` library.

## Wall

The wall is the main spatial workspace.

Users can:

- create and edit notes
- move, resize, group, and color notes
- organize with tags, zones, and note groups
- create directional links and wiki-style relationships
- search, filter, and jump across content
- review changes through Wall History replay and heatmap-style views
- read the current note set chronologically in Timeline (`V`)
- export to PNG, PDF, Markdown, JSON, or published read-only snapshots
- open quick help without leaving the canvas

The wall supports both freeform brainstorming and more structured thinking workflows.

## Decks

The decks workspace is a study environment built around note types, cards, review flows, and deck hierarchy.

Users can:

- create nested decks
- browse notes and cards
- study due material
- run custom study sessions
- inspect deck stats
- import notes and configure note types

Decks is a separate route, but it is also integrated into the wall workflow through shared navigation and related tooling.

## Settings

Settings controls:

- profile and account state
- theme and appearance preferences
- startup route preferences
- keyboard color slots
- wall chrome and control density preferences

Settings can be opened as a route and, in some cases, embedded in wall-adjacent UI.

## Product Model

The current product is not just a sticky-note wall. It is a multi-surface workspace with:

- a spatial canvas
- a study system
- account-backed preferences and sync
- a shared self-serve help layer

The unifying idea is that the user can move between capture, organization, reflection, review, and recovery without leaving the product.

## Time Modes Glossary

The wall exposes two time-oriented surfaces that use different shortcuts and data:

- **Timeline** (`V`): A vertical chronological stream of the **current** wall notes, sorted by creation time. Use it to review what is on the wall today without spatial navigation.
- **Wall History** (`T`): A replay mode that scrubs through **persisted wall snapshots** recorded as the wall changes over time. Editing is locked while history is active.

Both modes are read-only for note mutations. Timeline is the primary review surface linked from the top nav; Wall History is for rewinding to earlier persisted states.

## Known Boundaries

- The wall and decks surfaces have different interaction models and different persistence shapes.
- Some features depend on signed-in Supabase-backed flows.
- Published wall snapshots are intentionally read-only.

## Related Docs

- `docs/architecture/overview.md`
- `docs/architecture/frontend-architecture.md`
- `docs/features/timeline-view.md`
- `docs/features/help-system.md`
- `docs/features/decks.md`
