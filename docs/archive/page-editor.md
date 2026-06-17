# Page Editor

## Purpose

The page editor provides a structured, block-based workspace for writing, embedding, uploading, and annotating content on an infinite canvas.

## Scope

This document describes the current `/page` surface, its major block behaviors, persistence model, and important boundaries.

## Behavior

The page editor is mounted at `/page`.

Current behavior includes:

- infinite canvas panning and zooming
- block creation at arbitrary positions
- slash-command driven insertion
- support for text, headings, to-dos, bulleted lists, numbered lists, toggles, tables, quotes, callouts, code, dividers, bookmarks, embeds, file/media blocks, and page cover images
- drag, nesting, column placement, and block-level menus
- block comments
- file upload, linked media insertion, and Unsplash-powered image search for `/image` and `/cover`
- block-level wall interchange actions that can either create a wall reference note for the current page block or convert the block into a wall note while replacing the source block with a wall deep link

The interaction model is closer to a hybrid of document editing and spatial layout than a fixed linear editor.

## Data and State

Canonical page types live in `src/features/page/types.ts`.

Persisted page state includes:

- `blocks`
- `cover`
- `camera`
- `updatedAt`

Blocks may also include:

- rich text spans
- numbered-list formatting
- table data
- code block data
- bookmark and embed metadata
- comments
- file metadata
- page cover metadata

Page persistence is handled both locally and through cloud-backed snapshot helpers.

## Edge Cases

- `/cover` is document-level state, not a normal block, so cover changes must preserve top-of-page spacing and persistence separately from block insertion.
- File upload requires authenticated Supabase-backed storage behavior.
- Block menus, slash menus, file insertion popovers, and comment panels must remain visible near viewport edges.
- Drag behavior has several modes, including insert, nest, and column placement, which need stable visual feedback.
- Embedded and linked content must degrade gracefully when metadata is limited.

## Limitations

- The page editor is currently concentrated in a very large single workspace component, which increases maintenance pressure.
- The repo does not yet have dedicated API docs for page-specific routes such as file upload and bookmark preview.

## Related Docs

- `docs/product/overview.md`
- `docs/architecture/overview.md`
- `docs/qa.md`
