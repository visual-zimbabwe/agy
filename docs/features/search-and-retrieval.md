# Search and Retrieval

## Purpose

This document describes the current search and retrieval behavior in the wall workspace.

## Scope

This covers the wall omnibar, action search behavior, query-token filters, searchable note content, and current retrieval boundaries.

## Behavior

The wall now uses a dock-first omnibar instead of a separate modal palette.

The omnibar combines:

- note retrieval
- action search and execution
- visible query-token filters for wall recall

It is focused from the bottom dock directly and can also be opened with `Ctrl/Cmd + K`.

Current retrieval behavior includes:

- inline search from the dock itself instead of a fake trigger + second input
- grouped omnibar sections for suggestions, actions, and notes
- `/` command-only behavior for action-focused searching
- token filters that remain visible as removable chips while searching
- note selection and jump behavior after choosing a result

## Query Tokens

The omnibar currently recognizes these query-token families:

- `tag:<value>`: require one or more note tags
- `type:<value>`: filter by note kind such as `type:quote`, `type:poetry`, or `type:image`
- `is:<value>`: filter by note state such as `is:pinned` or `is:highlighted`
- `tool:<value>`: prioritize actions related to areas such as `tool:details`, `tool:tools`, `tool:export`, `tool:timeline`, or `tool:help`

As the user types a token prefix, the omnibar suggests matching tags, note types, states, and tool tokens.

## Searchable Content

Current wall search indexes more than plain note text.

Indexed content includes:

- note text
- quote author and quote source
- canon title, statement, interpretation, example, source, and item text
- tags
- vocabulary word, meaning, and source context
- Eisenhower display date and quadrant content

This keeps search a cross-note retrieval surface rather than a title-only filter.

## Actions in the Omnibar

The omnibar can also search and execute wall actions.

Current behavior:

- actions and notes appear in the same expanded omnibar, but in separate groups
- action search respects free-text queries and optional `tool:` tokens
- actions may include labels, descriptions, keywords, and shortcuts
- `Tools`, `Details`, and `Help center` entry points remain accessible both from visible chrome and omnibar actions

The omnibar now includes help-focused actions for opening the in-wall help center and the full `/help` library.

## Wall Filter Effect

The omnibar query is part of the wall recall pipeline.

Current wall behavior:

- token filters affect which notes remain visible on the wall
- free-text search filters visible notes unless the query starts with `/`
- private notes remain excluded from searchable note results
- note results still navigate the camera to the chosen note

## Edge Cases

- Empty queries fall back to bounded omnibar suggestions plus a default action/note set.
- Unknown token values are treated as normal text instead of breaking the query.
- Omnibar UI must remain keyboard navigable and visually stable.
- Search quality still depends on the current note payload shape, especially for richer note kinds.

## Limitations

- Search behavior is still wall-specific; there is no unified global search across wall, page, and decks.
- Query tokens currently cover tags, note types, note states, and action/tool intent, but not full natural-language filter grammar.
- Saved recall searches still rely on the existing recall sidebar flow for zone/date persistence.

## Related Docs

- `docs/features/wall-notes.md`
- `docs/product/overview.md`
- `docs/qa.md`
- `docs/features/help-system.md`
