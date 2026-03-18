# Decks API

## Purpose

This document describes the current deck API surface used by the `/decks` workspace.

## Scope

This is a current-state summary of the deck-related routes under `src/app/api/decks/`. It does not exhaustively document every field returned by every route, but it captures the major contract groups and operational behavior contributors need to know.

## Route Groups

### Deck Management

Primary routes:

- `GET /api/decks`
- `POST /api/decks`
- `GET /api/decks/:deckId`
- `PATCH /api/decks/:deckId`
- `DELETE /api/decks/:deckId`
- `POST /api/decks/:deckId/clear`

These routes support:

- listing decks
- creating decks
- updating deck metadata
- clearing deck contents
- working with nested deck hierarchy

`GET /api/decks` also ensures built-in deck note types exist before returning workspace data.

## Study and Scheduling

Routes include:

- `GET /api/decks/study`
- `POST /api/decks/study`
- `POST /api/decks/custom-study`
- `POST /api/decks/:deckId/fsrs/optimize`

These routes support:

- loading due cards
- submitting review actions
- running custom study sessions
- optimizing FSRS-related scheduler parameters

The API and workspace currently support both legacy and FSRS-aware paths.

## Browse and Bulk Operations

Routes include:

- `GET /api/decks/browse`
- `POST /api/decks/browse/bulk`
- `GET /api/decks/tags`

These routes support:

- browsing cards and notes across decks
- filtering across hierarchy
- bulk operations
- tag aggregation

## Notes and Note Types

Routes include:

- `GET /api/decks/note-types`
- `POST /api/decks/notes`
- `GET /api/decks/import-presets`
- `POST /api/decks/import-presets`

These routes support:

- built-in and user-facing note-type workflows
- note creation and card generation
- import mapping presets

## Stats

Primary route:

- `GET /api/decks/stats`

The stats surface currently powers:

- summary metrics
- workload views
- forecast views
- retention and answer-button data
- daily review and interval breakdowns

## Auth

Deck routes require an authenticated user.

## Compatibility Notes

The deck API includes compatibility handling for missing scheduler-related columns. In particular, `GET /api/decks` can fall back when fields such as:

- `scheduler_mode`
- `fsrs_params`
- `fsrs_optimized_at`

are not yet present.

This matters during migrations and staged schema rollout.

## Failure Modes

- invalid request bodies return `400`
- missing or unauthorized records return `404`
- query and persistence failures return `500`
- partial schema rollout can change which scheduler data is available

## Related Docs

- `docs/features/decks.md`
- `docs/architecture/overview.md`
- `docs/product/overview.md`
