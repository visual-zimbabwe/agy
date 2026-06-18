# Changelog

## Unreleased

### Added

- Timeline stream detail rail on `xl+` viewports with tags, timestamps, larger preview, and **Reveal on Wall** action
- Wall `apod` notes backed by the NASA Astronomy Picture of the Day API, including daily refresh, backend download flow, and synced APOD payload support
- Wall `poetry` notes backed by PoetryDB, including daily auto-refresh, details-sidebar poem search by PoetryDB fields, adaptive poem sizing, and PNG/PDF export actions
- Wall `economist` cover notes backed by the local magazine-cover API, including multi-source creation for Economist/Barron's/New Yorker/Newsweek/Forbes/The Week, login-time refresh, details conversion, and floating source/refresh actions
- Hybrid help center with a wall quick-help modal, shared help content model, and route-based `/help` library
- Canonical documentation structure under `docs/product`, `docs/architecture`, `docs/features`, `docs/api`, `docs/runbooks`, and `docs/releases`
- Initial convert API doc
- Initial page file storage debugging runbook
- Initial feature docs for vocabulary review and Eisenhower notes
- Initial wall rendering-model architecture doc
- Initial account API doc
- Initial file conversion and published snapshot feature docs
- Initial local storage reset and recovery runbook
- Initial decks data-model architecture doc
- Current-state product overview for the wall, page editor, decks, and settings surfaces
- Canonical architecture overview and frontend architecture docs
- Initial feature docs for timeline view, page editor, and decks
- Initial API docs for walls, decks, and page routes
- Initial architecture docs for state, storage, and frontend structure
- Initial sync debugging runbook
- Initial ADR for local-first with cloud sync
- Initial contributor workflow doc
- Initial feature docs for wall notes, search/retrieval, settings, and help system

### Removed

- Standalone `/page` block editor workspace, including wall `Page Interchange` controls, page APIs, and page-editor persistence modules
- Standalone `/media` workspace route (legacy bookmarks now redirect to `/wall`)

### Changed

- Wall UI refactor documentation aligned with shipped architecture: session model, spatial/notes layer split, view-model presentation contract, and Digital Atelier palette tokens (`docs/product/ux-rules.md`, ADR 0003)
- Timeline stream now ships search, day jump, prev/next navigation, attachment-friendly labels, virtualization, and a read-only detail rail; orphaned horizontal timeline canvas components were removed
- `/page` and `/media` now server-redirect to `/wall`
- Startup and last-visited path preferences migrate away from `/page` and `/media`
- One-time boot migration clears local page-editor IndexedDB data, wall/page link localStorage, and best-effort authenticated cloud `page_docs` / `page-files` data without touching wall or decks storage
- Removed the deprecated Electron desktop packaging subtree and its release workflow so the repository now reflects the current web-only product surface
- Wall search now ships as a dock-first inline omnibar with grouped suggestions/actions/notes, shared `Ctrl/Cmd + K` focus behavior, and query tokens for `tag:`, `type:`, `is:`, and `tool:` filters
- `Help / Docs` in the wall profile menu now opens a real help center, and the omnibar now exposes help actions including `tool:help`
- `README.md` now reflects the current multi-surface product instead of describing only the wall workspace
- Frontend architecture guidance moved into `docs/architecture/frontend-architecture.md`

### Fixed

- Magazine cover notes no longer persist placeholder `cover unavailable` art in the per-source cache, so transient upstream misses can recover to the latest real cover on the next refresh instead of staying stuck on the fallback card
- `Tools > Magazine Covers` now fans out sources like `The Week` into multiple notes when the API returns multiple distinct images instead of dropping everything after the first image
- Hosted auth login failures now normalize Supabase error payloads into readable messages instead of surfacing raw `{}` on `/login`
- Hosted auth retryable failures now preserve service-unavailable status instead of incorrectly reporting `401` invalid-credential errors on `/login`
- Removed the stale flat `docs/frontend-architecture.md` file so there is a single canonical frontend architecture doc
- Archived older flat planning and discovery docs under `docs/archive/legacy-plans/`
- Promoted the quick-capture guide into `docs/features/quick-capture.md`

## Notes

Use this file as the running release history for user-visible and contributor-relevant documentation changes. Add dated release files later if release-specific notes need more detail.
