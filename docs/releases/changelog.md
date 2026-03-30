# Changelog

## Unreleased

### Added

- Wall `web-bookmark` notes with server-side metadata fetch, local URL-level caching, timeline/detail previews, and synced bookmark payload support
- Wall `apod` notes backed by the NASA Astronomy Picture of the Day API, including daily refresh, backend download flow, and synced APOD payload support
- Wall `poetry` notes backed by PoetryDB, including daily auto-refresh, details-sidebar poem search by PoetryDB fields, adaptive poem sizing, and PNG/PDF export actions
- Wall `economist` cover notes backed by the local magazine-cover API, including multi-source creation for Economist/Barron's/New Yorker/Newsweek/Forbes, login-time refresh, details conversion, and floating source/refresh actions
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

### Changed

- Wall search now ships as a dock-first inline omnibar with grouped suggestions/actions/notes, shared `Ctrl/Cmd + K` focus behavior, and query tokens for `tag:`, `type:`, `is:`, and `tool:` filters
- `Help / Docs` in the wall profile menu now opens a real help center, and the omnibar now exposes help actions including `tool:help`
- `README.md` now reflects the current multi-surface product instead of describing only the wall workspace
- Frontend architecture guidance moved into `docs/architecture/frontend-architecture.md`
- Unsplash-powered image search now backs `/wall` image insertion and `/page` `/image` + `/cover` flows, including clustered wall moodboards and persisted page covers

### Fixed

- Magazine cover notes no longer persist placeholder `cover unavailable` art in the per-source cache, so transient upstream misses can recover to the latest real cover on the next refresh instead of staying stuck on the fallback card
- Electron desktop routing now allows current internal routes (`/wall`, `/page`, `/decks`, `/settings`, `/help`) without blocking valid in-app navigation, and startup preferences now cover the same route surface as the web app
- Hosted auth login failures now normalize Supabase error payloads into readable messages instead of surfacing raw `{}` on `/login`
- Hosted auth retryable failures now preserve service-unavailable status instead of incorrectly reporting `401` invalid-credential errors on `/login`
- Removed the stale flat `docs/frontend-architecture.md` file so there is a single canonical frontend architecture doc
- Archived older flat planning and discovery docs under `docs/archive/legacy-plans/`
- Promoted the quick-capture guide into `docs/features/quick-capture.md`

## Notes

Use this file as the running release history for user-visible and contributor-relevant documentation changes. Add dated release files later if release-specific notes need more detail.
