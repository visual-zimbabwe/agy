# Decks

## Purpose

The decks workspace gives Agy a structured study and review surface for notes, cards, and spaced repetition workflows.

## Scope

This document covers the current `/decks` product surface and the major workflows visible in the codebase. It does not fully specify every deck API contract.

## Behavior

The decks workspace is mounted at `/decks` and requires an authenticated user.

Current workspace areas include:

- deck list and hierarchy management
- browse view
- stats view
- study view
- custom study sessions
- note-type and import flows

The workspace supports nested decks, filtered study, due counts, tags, and import presets.

The wall toolbar can also open decks, which makes decks part of the broader product flow rather than a disconnected side project.

## Data and State

Deck-related behavior uses:

- decks
- note types
- cards
- stats payloads
- custom study payloads
- scheduler-related fields such as `scheduler_mode`, `fsrs_params`, and optimization timestamps

The workspace relies heavily on server APIs rather than a purely local-only state model.

## Edge Cases

- The deck APIs include compatibility handling for missing scheduler columns, which means the frontend must tolerate partial schema rollout.
- Nested decks change study semantics because parent deck sessions can include or exclude child decks.
- Browse and bulk operations need careful selection behavior to avoid accidental destructive actions.

## Limitations

- The repo does not yet have a dedicated architecture doc for the decks data model.
- There is still discovery/planning history in `docs/decks-feature-discovery.md`; the canonical current-state source should move to this file going forward.

## Related Docs

- `docs/product/overview.md`
- `docs/architecture/overview.md`
- `docs/api/decks.md`
- `docs/qa.md`

