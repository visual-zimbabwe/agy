# Eisenhower Notes

## Purpose

This document describes the current Eisenhower Matrix note workflow in the wall workspace.

## Scope

This covers Eisenhower note creation, stored data shape, editing behavior, and current constraints.

## Behavior

Eisenhower notes are a specialized wall note workflow for urgency-versus-importance planning.

Current flow:

- create an Eisenhower Matrix note from the wall tools panel
- open the note in a dedicated editor
- edit titles and content for all four quadrants
- review task counts and summary information inside the note UI

Current quadrants are:

- `Do First`
- `Schedule`
- `Delegate`
- `Delete`

## Data and State

Eisenhower notes use wall `noteKind: eisenhower` plus an `eisenhower` payload.

Current payload includes:

- `displayDate`
- `quadrants.doFirst`
- `quadrants.schedule`
- `quadrants.delegate`
- `quadrants.delete`

Each quadrant contains:

- `title`
- `content`

The display date is formatted at creation time and persisted with the note.

## Editing Model

Eisenhower notes use a dedicated matrix editor rather than plain text editing.

Current editor behavior includes:

- four quadrant panels
- per-quadrant title editing
- per-quadrant content editing
- task counting based on line items
- automatic focus routing into the current or default quadrant

## Preview Behavior

When Eisenhower notes appear in retrieval surfaces, preview text is derived from the first populated quadrant.

Task counts are derived from non-empty line items, including lines prefixed with list markers.

## Edge Cases

- Invalid or partial Eisenhower payloads are normalized back into a complete four-quadrant structure.
- Eisenhower notes still depend on wall persistence and sync behavior like any other wall note.
- Search indexes Eisenhower display date and quadrant content.

## Limitations

- Eisenhower notes are currently a wall-specialized note type, not a reusable planning primitive across the whole product.
- The matrix editor is visually rich but still tied to the wall note lifecycle and sizing model.

## Related Docs

- `docs/features/wall-notes.md`
- `docs/features/search-and-retrieval.md`
- `docs/api/walls.md`
