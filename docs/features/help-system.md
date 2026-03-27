# Help System

## Purpose

Describe the current hybrid help system for Agy.

## Scope

This covers the wall quick-help surface, the route-based help library, shared help content modeling, and how keyboard shortcuts now fit inside the broader help feature.

## Behavior

Agy now ships a hybrid help system with two presentation layers backed by one shared content model.

Current help entry points are:

- `Profile menu > Help center` on the wall
- wall omnibar actions such as `Open help center` and `Open full help library`
- the route-based `/help` library

The lightweight wall help surface is a modal intended for blocked-in-context use. It supports:

- quick search across wall-relevant help articles
- category browsing
- previewing an article without leaving the wall
- fast actions for product tour replay, keyboard shortcuts, and settings
- a jump into the full `/help` library for deeper browsing

The full `/help` route is the longer-form help library. It supports:

- sidebar category navigation
- article browsing by route
- library search
- related-reading links
- route links back into key product surfaces

Keyboard shortcuts still exist as a dedicated modal, but they are no longer the only thing behind the product's help entry.

## Data and State

Help content is currently modeled in `src/features/help/content.ts`.

Each article defines:

- `id`
- `title`
- `summary`
- `category`
- `keywords`
- `contexts`
- `readTime`
- `sections`
- `relatedArticleIds`
- optional route actions

The wall quick-help modal and the `/help` route both read from the same article set.

Shortcut rows are also sourced from the same help module so the dedicated shortcuts modal and help surfaces stay aligned.

## Edge Cases

- The wall quick-help modal is intentionally scoped to wall-relevant content rather than the full cross-product library.
- Help remains accessible from the wall omnibar even when users do not open the profile menu.
- The quick-help surface must stay inside the viewport and avoid clipping against the wall chrome.
- The `/help` route remains usable without first opening the wall workspace.

## Limitations

- Help content is still static and local to the repo; it is not docs-markdown-backed or CMS-backed yet.
- There is no analytics layer yet for help opens, searches, or unresolved exits.
- Context-aware article recommendation is still limited to the current article `contexts` field and wall-first filtering in the quick-help modal.

## Related Docs

- `docs/product/help-docs-upgrade-plan.md`
- `docs/features/search-and-retrieval.md`
- `docs/product/overview.md`
- `docs/qa.md`
