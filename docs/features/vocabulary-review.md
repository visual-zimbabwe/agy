# Vocabulary Review

## Purpose

This document describes the current vocabulary-note and review workflow in the wall workspace.

## Scope

This covers vocabulary note data, review scheduling behavior, and the current details-sidebar review flow.

## Behavior

Vocabulary review is built into the wall rather than implemented as a separate route.

Current workflow includes:

- create a word note from the wall tools panel
- capture source context, guess, meaning, and your own sentence
- review due words from the details sidebar
- grade a selected word with `Again`, `Hard`, `Good`, or `Easy`
- flip the card and optionally reveal meaning during review

The details sidebar exposes due count, focus count, and reviewed-today count.

## Data and State

Vocabulary notes are stored as wall notes with a `vocabulary` payload.

Current vocabulary fields include:

- `word`
- `sourceContext`
- `guessMeaning`
- `meaning`
- `ownSentence`
- `flipped`
- `nextReviewAt`
- `lastReviewedAt`
- `intervalDays`
- `reviewsCount`
- `lapses`
- `isFocus`
- `lastOutcome`

## Scheduling Behavior

Current scheduling logic is lightweight and custom.

Review outcomes map as follows:

- `Again`: next review in 10 minutes, interval resets to 0, lapse count increases
- `Hard`: next review in 1 day, interval becomes 1 day
- `Good`: interval grows to 3 days or about 1.8x current interval
- `Easy`: interval grows to 7 days or about 2.6x current interval

A word becomes a focus item when lapses reach 3 or more.

## Review Constraints

Current UI behavior requires an `ownSentence` before a selected word can be marked `Good` or `Easy`.

This keeps the review flow tied to actual usage rather than recognition alone.

## Edge Cases

- Vocabulary state must survive both local wall persistence and cloud sync.
- Review counts and due timestamps depend on wall note persistence, not a separate study store.
- Search also indexes vocabulary fields, which makes retrieval part of the review workflow.

## Limitations

- Vocabulary review is wall-embedded, not a separate dedicated study workspace.
- The current scheduler is intentionally simple and not shared with the decks FSRS model.

## Related Docs

- `docs/features/wall-notes.md`
- `docs/features/search-and-retrieval.md`
- `docs/api/walls.md`
