# Wall Notes

## Purpose

This document describes the current note model and note-creation workflows in the wall workspace.

## Scope

This covers current note kinds, creation surfaces, related organization primitives, and important behavior boundaries for `/wall`.

## Behavior

Wall notes are not limited to plain sticky-note text. A fresh wall now seeds one Joker card that fetches a joke from JokeAPI. If that card is deleted, the wall does not silently repurpose the next standard note. Instead, users can explicitly create a new Joker note from the Tools panel or convert the currently selected standard note by choosing `Joker` in the note-type controls. If a Joker note already exists, those same actions refresh it with a new joke instead of creating duplicates.

The wall also supports one dedicated Throne note. It is created explicitly from the Tools panel or by converting the currently selected standard note with `Throne` in the note-type controls. Once a Throne note exists, those same actions refresh the existing note with a new Game of Thrones quote instead of creating duplicates. Its bright red color is reserved for that note type and not reused by normal notes.

Current note creation entry points include:

The wall also maintains one permanent system note: currency. It is seeded automatically, cannot be deleted or duplicated, can be repositioned, and uses location plus exchange-rate lookups to keep a USD conversion widget on the canvas.


- standard note creation
- vocabulary word note creation
- journal note creation
- quote note creation
- Eisenhower Matrix note creation
- canon note creation
- web bookmark note creation
- NASA APOD note creation

These actions are available from the wall tools panel, and some note transformations also flow through in-note editing commands.

Web bookmark notes create a rich preview card from a URL using a server-side metadata fetch route. The parser prioritizes Open Graph tags, then Twitter card tags, then document title and meta description, and resolves preview images plus favicons into safe absolute URLs. Provider-aware enrichment now upgrades common video links such as YouTube when raw page scraping is weak, so the wall can still show a real title and thumbnail. The default non-edit bookmark note now renders as a compact horizontal link card instead of a tall note shell. The card stores the original URL, normalized URL, sanitized metadata, fetch timestamps, and status so the wall can render cached previews without re-requesting metadata on every render. v2 cache entries skip earlier domain-only fallback results so upgraded walls refetch richer previews instead of reusing weak metadata.

Image note creation now supports three insert sources from the wall image modal:

- `Upload` for local image files
- `Paste URL` for direct remote image links
- `Unsplash` search for single-image insertion or 3-10 image moodboards

NASA APOD notes create a dedicated astronomy card powered by the NASA Astronomy Picture of the Day API. The wall can create them explicitly from the Tools panel, from the command palette, from the `Shift + A` shortcut, or by converting an existing note through `Details > Note Type`. APOD notes refresh automatically against the current UTC day, cache the latest payload locally, persist their metadata through local storage and cloud sync, and expose actions to manually refresh, open the NASA source page, or download the current image through the app backend. When the APOD entry is a video or otherwise lacks a primary still image, the wall falls back to the best available thumbnail while keeping the note readable.

## Note Kinds

Current wall note kinds include:

- `standard`
- `quote`
- `canon`
- `journal`
- `eisenhower`
- `joker`
- `throne`
- `currency`
- `web-bookmark`
- `apod`
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
- Joker note source metadata from JokeAPI
- Throne note source metadata from the Game of Thrones Quotes API
- currency payload for detected region, live USD rate, cache state, trend, and converter input
- web bookmark payload for normalized URL, sanitized metadata, fetch status, last success, and error state
- APOD payload for NASA media type, title, explanation, copyright, source URLs, fetch timestamps, and refresh error state
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





