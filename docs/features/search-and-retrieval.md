# Search and Retrieval

## Purpose

This document describes the current search and retrieval behavior in the wall workspace.

## Scope

This covers the wall search palette, command palette behavior, searchable note content, and the current boundaries of retrieval workflows.

## Behavior

The wall search palette combines:

- note search
- command execution

It is opened with `Ctrl/Cmd + K` and can also switch into command-focused behavior when the query starts with `/`.

Current retrieval behavior includes:

- fuzzy search over note content and note metadata
- command execution from the same palette
- note selection and jump behavior after choosing a result

## Searchable Content

Current wall search indexes more than plain note text.

Indexed content includes:

- note text
- quote author and quote source
- canon title, statement, interpretation, example, source, and item text
- tags
- vocabulary word, meaning, and source context
- Eisenhower display date and quadrant content

This makes search a cross-note retrieval surface rather than a title-only filter.

## Commands in the Palette

The palette can also search commands.

Current behavior:

- commands and notes can appear in the same results set
- a query beginning with `/` limits behavior toward command-style use
- commands may include labels, descriptions, keywords, and shortcuts

## Edge Cases

- Empty queries fall back to a bounded default set of commands and notes.
- Palette UI must remain keyboard navigable and visually stable.
- Search quality depends on the current note payload shape, especially for richer note kinds.

## Limitations

- Search behavior is currently wall-specific; there is no unified global search across wall, page, and decks.
- The repo does not yet have a separate retrieval doc for saved searches, stale-note jumps, or higher-order recall workflows beyond the palette itself.

## Related Docs

- `docs/features/wall-notes.md`
- `docs/product/overview.md`
- `docs/qa.md`
