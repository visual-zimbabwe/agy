# Decks Data Model

## Purpose

This document describes the current conceptual data model behind the decks workspace.

## Scope

This is a high-level architecture doc for deck hierarchy, note types, cards, study state, and scheduler-related behavior. It does not replace route-by-route API docs.

## Core Entities

### Deck

A deck is the top-level study container.

Current deck characteristics include:

- id and name
- optional parent deck id for hierarchy
- archived state
- scheduler-related fields such as `scheduler_mode`, `fsrs_params`, and optimization timestamps
- counts used by the workspace for new, learning, and review surfaces

### Note Type

Deck note types define how note fields become study cards.

Current built-in keys:

- `basic`
- `basic_reversed`
- `basic_optional_reversed`
- `cloze`

A note type includes:

- field definitions
- front template
- back template
- optional CSS
- optional built-in key

### Note

Deck notes hold field values for a chosen note type and are the source material from which one or more cards are generated.

### Card

Cards are the review units produced from notes.

Card generation currently depends on note type rules:

- basic creates one prompt/answer card
- basic reversed creates two cards
- optional reversed creates one or two cards depending on reverse field presence
- cloze creates one or more cards based on cloze ordinals

## Scheduling Model

Current scheduling concepts include:

- card state: `new`, `learning`, `review`
- review rating: `again`, `hard`, `good`, `easy`
- step progression
- interval days
- ease factor
- lapses and reps
- due date

The codebase currently supports both legacy scheduling logic and FSRS-aware settings.

## Hierarchy and Query Shape

Decks can be nested.

This affects:

- study inclusion/exclusion of child decks
- browse filtering
- tag aggregation
- stats and custom study behavior

The deck workspace and APIs therefore treat hierarchy as part of normal query behavior, not an edge case.

## Compatibility Notes

Current deck APIs include compatibility handling for schema states where scheduler fields are missing.

This means the model must tolerate environments where:

- scheduler metadata exists fully
- scheduler metadata exists partially
- scheduler metadata falls back to legacy assumptions

## Constraints

- note-type changes can affect card generation semantics
- scheduler settings can affect both UI and API behavior
- hierarchy changes affect query scope across study and browse operations

## Related Docs

- `docs/api/decks.md`
- `docs/features/decks.md`
- `docs/decisions/0001-local-first-with-cloud-sync.md`
