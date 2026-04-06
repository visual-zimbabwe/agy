# Timeline View

## Purpose

Timeline view gives wall users a time-oriented way to review notes as a calm chronological stream instead of navigating them spatially on the canvas.

## Scope

This document covers the current wall timeline behavior, the read-only constraints of the mode, and the note presentation rules that keep the timeline aligned with the current wall frontend.

## Behavior

Timeline view is a wall-specific mode that presents existing wall notes on a vertical editorial timeline.

Current capabilities include:

- toggling into timeline view from the wall workspace
- rendering notes in chronological order using their created timestamps
- grouping notes by day with centered date markers such as `Today`, `Yesterday`, or a full calendar date
- alternating note placement across the central timeline rail while allowing pinned notes to sit centered in the stream
- reusing the lightweight DOM-based `WallNotePreview` component (the same system used by other timeline surfaces) so specialized note kinds keep their dedicated shells without the overhead of a full Konva canvas stage per card
- preserving the wall note's stored width and height exactly in timeline previews so the timeline card is a direct copy of the wall note rather than a fitted or reduced preview

Timeline is now intentionally view-only. Notes in this mode do not open details, do not reveal themselves back on the wall when clicked, and do not enter editing flows from the timeline surface.

## Data and State

Timeline behavior depends on the current wall note set and note timestamps rather than a separate timeline document model.

Relevant wall concepts:

- persisted wall notes
- note creation timestamps
- note pin state for centered presentation
- note-kind-specific preview rendering shared with `/wall`

The current timeline layout is downstream of wall note state. It does not own a separate editor, details panel, or reveal workflow.

## Edge Cases

- Empty walls should still render a clear read-only empty state.
- Dense note histories must remain readable without clipping note shells or hiding the central date rail.
- Mobile layouts collapse to a single-column chronology while preserving note identity and timestamp context.

## Limitations

- Timeline ordering currently follows created time, not a user-selectable sort mode.
- Timeline view is intentionally non-interactive beyond scrolling and exiting the mode.
- The current implementation is part of the wall experience, not a standalone route or subsystem.

## Related Docs

- `docs/product/overview.md`
- `docs/architecture/overview.md`
- `docs/api/walls.md`
- `docs/qa.md`
