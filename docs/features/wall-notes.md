# Wall Notes

## Purpose

This document describes the current note model and note-creation workflows in the wall workspace.

## Scope

This covers current note kinds, creation surfaces, related organization primitives, and important behavior boundaries for `/wall`.

## Behavior

Wall notes are not limited to plain sticky-note text.

Current note creation entry points include:

- standard note creation
- vocabulary word note creation
- journal note creation
- quote note creation
- Eisenhower Matrix note creation
- canon note creation

These actions are available from the wall tools panel, and some note transformations also flow through in-note editing commands.

Image note creation now supports three insert sources from the wall image modal:

- `Upload` for local image files
- `Paste URL` for direct remote image links
- `Unsplash` search for single-image insertion or 3-10 image moodboards

## Note Kinds

Current wall note kinds include:

- `standard`
- `quote`
- `canon`
- `journal`
- `eisenhower`

In addition to explicit `noteKind`, notes can also carry vocabulary review payloads, which makes vocabulary notes a meaningful note workflow even when not represented as a separate `noteKind` enum value.

## Note Fields

The current wall note model supports more than text and position.

Important fields include:

- text
- tags
- color
- x/y/w/h
- quote author and source
- canon payload
- Eisenhower payload
- vocabulary payload
- image URL
- Unsplash-sourced image URLs
- text alignment and vertical alignment
- text font and color
- text sizing
- pinned and highlighted state
- timestamps

## Related Organization Primitives

Notes can participate in:

- directional links
- wiki-style relationships
- zones
- zone groups
- note groups
- search and recall workflows
- timeline review workflows

This makes notes the core unit of wall content, but not the only structural element.

## Edge Cases

- Unsplash moodboards create multiple image notes in one grouped insert action and place them near the current target or viewport center.
- Note data must survive both local persistence and cloud sync.
- Richer note payloads depend on newer schema support; compatibility paths exist in wall APIs for some missing columns.
- Published wall snapshots are read-only even though they display wall note content.

## Limitations

- Wall note behavior spans multiple UI layers and feature helpers, so there is not yet a single implementation module for every note interaction.
- Some note workflows, such as vocabulary review and canon editing, still need deeper dedicated docs as they grow.

## Related Docs

- `docs/api/walls.md`
- `docs/architecture/state-and-storage.md`
- `docs/features/search-and-retrieval.md`
- `docs/features/timeline-view.md`
