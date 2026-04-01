# Decks

## Purpose

The decks workspace gives Agy a structured study and review surface for notes, cards, and spaced repetition workflows.

## Scope

This document covers the current `/decks` product surface and the major workflows visible in the codebase. It does not fully specify every deck API contract.

## Behavior

The decks workspace is mounted at `/decks` and requires an authenticated user.

Current workspace areas include:

- deck list and hierarchy management
- add-note creation from the `/decks` overview
- browse view
- stats view
- study view
- custom study sessions
- note-type and import flows

The workspace supports nested decks, filtered study, due counts, tags, and import presets.

The decks header keeps the local Decks/Browse/Stats/Study tabs grouped on the left while direct route links back into `Wall`, `Page`, and `Media` sit at the top-right edge of the same bar. The deck overview header does not keep separate duplicate `Study` or decorative search controls; persistent `Settings` and `Help` route links live together in the lower-left sidebar footer.

On `/decks`, the main deck overview includes a single in-content `Add Note` entry point in the hero actions. That modal lets the user choose a deck, choose a note type, fill the note fields, add comma-separated tags, and create the note. Card generation still happens note-first through the note type template system rather than by creating raw cards directly.

Deck note creation blocks exact duplicates within the same deck and note type. The duplicate check compares normalized field content only: field order does not matter, leading and trailing whitespace is ignored, and Windows versus Unix line endings are treated as equivalent. Tags do not participate in duplicate detection, so changing tags alone does not make a note unique.

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
- Duplicate prevention is enforced in the shared note-creation API, so both manual add and file import reject exact duplicate notes in the same deck and note-type scope.

## Limitations

- The repo does not yet have a dedicated architecture doc for the decks data model.
- There is still discovery/planning history in `docs/decks-feature-discovery.md`; the canonical current-state source should move to this file going forward.

## Related Docs

- `docs/product/overview.md`
- `docs/architecture/overview.md`
- `docs/api/decks.md`
- `docs/qa.md`

