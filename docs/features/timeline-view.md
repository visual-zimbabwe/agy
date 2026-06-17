# Timeline

## Purpose

Timeline gives wall users a time-oriented way to review the **current** note set as a calm vertical editorial stream instead of navigating notes spatially on the canvas.

This is distinct from **Wall History** (`T`), which replays persisted wall snapshots over time. Timeline (`V`) always reflects the live wall state sorted by note timestamps.

## Scope

This document covers the Timeline stream view (`V`): read-only constraints, presentation rules, and how it differs from Wall History replay mode.

## Behavior

Timeline is a wall-specific mode that presents existing wall notes on a vertical editorial stream.

Current capabilities include:

- toggling into Timeline from the wall toolbar or command palette (`V`)
- rendering notes in chronological order using created or updated timestamps (default: created)
- grouping notes by day with centered date markers such as `Today`, `Yesterday`, or a full calendar date
- alternating note placement across the central timeline rail while allowing pinned notes to sit centered in the stream
- reusing the lightweight DOM-based `WallNotePreview` component (the same system used by other timeline surfaces) so specialized note kinds keep their dedicated shells without the overhead of a full Konva canvas stage per card
- preserving the wall note's stored width and height for journal, quote, image, and other narrative note kinds while clamping oversized file and bookmark cards to a compact stream-friendly size
- selecting a note in the stream to highlight it without entering edit mode
- revealing the selected note back on the spatial wall via double-click, the **Reveal on Wall** action, or `Enter`
- keyboard navigation across chronological entries with `↑`/`↓` or `J`/`K`, plus `[`/`]` or **Prev**/**Next** for filtered navigation, `Enter` to reveal, and `Escape` to exit
- searching the stream client-side across note titles, first lines, tags, and file names
- jumping directly to a day section from the header day picker
- moving between filtered entries with header **Prev**/**Next** controls while keeping the selected card scrolled into view
- showing readable primary labels and compact metadata for file and bookmark entries (user title or first line first, filename once, kind/size subtitle) instead of raw attachment theater
- keeping attachment cards within the stream column without horizontal scrolling at default desktop widths
- virtualizing the stream list so only visible day headers and note rows mount in the DOM while preserving smooth scroll and selection scroll-into-view behavior

Timeline remains view-only for note content. Notes in this mode do not open the details panel, do not enter inline editing, and do not mutate note data from the timeline surface.

## Data and State

Timeline behavior depends on the current wall note set and note timestamps rather than a separate timeline document model or history snapshots.

Relevant wall concepts:

- persisted wall notes
- note creation timestamps
- note pin state for centered presentation
- note-kind-specific preview rendering shared with `/wall`

The current timeline layout is downstream of wall note state. Selection syncs with the wall's primary note selection, and reveal hands off to the existing wall focus/pan workflow.

## Edge Cases

- Empty walls should still render a clear read-only empty state.
- Dense note histories must remain readable without clipping note shells or hiding the central date rail.
- Mobile layouts collapse to a single-column chronology while preserving note identity and timestamp context.

## Limitations

- Timeline does not support inline editing from the stream surface.
- Search and date jump operate on the current in-memory note set only; there is no server-side recall or saved stream scroll position yet.
- The current implementation is part of the wall experience, not a standalone route or subsystem.

## Related Docs

- `docs/product/overview.md`
- `docs/architecture/overview.md`
- `docs/api/walls.md`
- `docs/qa.md`
