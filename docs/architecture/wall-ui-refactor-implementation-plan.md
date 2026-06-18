# Wall UI Refactor Implementation Plan

## Status

**Phase 0 shipped** (2026-06-17) — session context scaffold and guardrails landed.

**Phase 1 shipped** (2026-06-17) — prop surfaces collapsed via session context; `WallFloatingUi` and `WallDetailsSidebar` are prop-less; detail sections consume context; modals split by domain.

This plan supersedes the remaining structural goals in `docs/archive/legacy-plans/frontend-improvement-plan.md`. That document marked wall UI decomposition as complete; the current codebase still has central files far above maintainable size (see [Current State](#current-state)).

## Purpose

Reduce maintenance risk on Agy’s primary product surface (`/wall`) by finishing the architectural refactor already started in `src/components/wall/`, improving test coverage for data-critical flows, and stopping dual-render drift between the Konva canvas and HTML preview paths.

## Scope

### In scope

- `src/components/WallCanvas.tsx`
- `src/components/wall/**`
- Supporting feature-layer coordination in `src/features/wall/**` where session/sync ownership moves out of the canvas root
- Test and QA updates required to validate refactors safely

### Out of scope

- Full Konva → DOM rewrite (or reverse)
- New state library introduction (Zustand/Redux) — `useWallStore` remains the domain store
- Mechanical file splits with no ownership model
- Visual redesign / token work already covered by prior frontend plans

## Current State

As of the review that produced this plan:

| Area | Location | Approx. size | Notes |
|------|----------|--------------|-------|
| Wall orchestrator | `src/components/WallCanvas.tsx` | ~3,550 lines | Top-level `eslint-disable complexity, max-lines`; JSX delegated to `spatial/` + `chrome/`; orchestration partially in `useWall*` hooks |
| Konva note rendering | `src/components/wall/WallNotesLayer.tsx` | ~1,850 lines | All note types, interaction, and asset loading in one module |
| Keyboard behavior | `src/components/wall/useWallKeyboard.ts` | ~535 lines | Large option surface; hook-shaped but monolithic |
| Floating editors / docks | `src/components/wall/WallFloatingUi.tsx` | ~650 lines | ~85 props |
| Details sidebar | `src/components/wall/WallDetailsSidebar.tsx` | ~375 lines | ~100 props |
| HTML note previews | `src/components/wall/WallNotePreview.tsx` | ~810 lines | Parallel presentation stack to Konva |
| Persistence hook | `src/components/wall/useWallPersistenceEffects.ts` | ~460 lines | Local + cloud bootstrap |

### What is already working

- Domain logic is largely separated in `src/features/wall/` (store, commands, storage, sync, windowing).
- ~20 `useWall*` hooks extract slices of behavior from the canvas root.
- Performance awareness exists: viewport windowing, entity cache, render budgets, virtualized timeline stream.
- Timeline stream architecture (`WallTimelineView`, `useWallTimelineStream`, tested helpers) is cleaner than the Konva stack and should be treated as the template for new list/read-heavy work.

### Test coverage today

| Covered | Not covered |
|---------|-------------|
| `wall-coordinates` (open-note placement), preview sizing, timeline layout/stream helpers | `WallCanvas`, `WallNotesLayer`, `NoteTextEditor` |
| `useWallPersistenceEffects`, `useWallRemoteDeltaFeed` (hook tests) | End-to-end create → edit → reload → sync flows |
| | Playwright or RTL coverage for keyboard selection / edit commit |

Quality gate remains: `npm run lint`, `npm run build`, manual `docs/qa.md`.

## Problem Statement

1. **God files** — `WallCanvas` and `WallNotesLayer` concentrate too much ownership. Hook extraction reduced inline noise but did not finish boundary work.
2. **Prop firehose** — Components with 85–100 props indicate missing session/interaction context, not acceptable “large interfaces.”
3. **Dual rendering** — Konva (`WallNotesLayer`) and HTML (`WallNotePreview`) must stay aligned for every note type; they will drift without an explicit adapter contract or visual regression coverage.
4. **Correctness gap** — Local-first + cloud sync + private notes need automated tests more than helper unit tests.
5. **Incomplete refactor narrative** — Prior plans claimed decomposition done while the orchestrator grew again.

## Guiding Principles

1. **No new logic in `WallCanvas`** except composition and wiring — enforce as a merge rule during this effort.
2. **Split by ownership**, not by line count — each extracted module owns one concern (selection, sync session, spatial shell, note kind rendering).
3. **Correctness before perf** — pause new micro-optimizations until critical paths are test-backed.
4. **Timeline pattern over Konva monolith** — new read-heavy or list features follow the stream architecture where possible.
5. **Behavior parity per slice** — refactor in vertical slices with QA steps after each merge.

## Implementation Phases

### Phase 0 — Stop the bleeding (1 week)

**Goal:** Prevent further growth of central files while scaffolding the target structure.

**Status:** Shipped (2026-06-17) — guardrails, responsibility inventory, and session provider scaffold.

#### Tasks

1. Add a contributor guardrail (document in this plan and `docs/contributing/development-workflow.md`):
   - No new business logic in `WallCanvas.tsx` or `WallNotesLayer.tsx`.
   - New wall behavior lands in `features/wall`, `useWall*` hooks, or new session modules.
2. Inventory `WallCanvas` responsibilities into a checklist (sync, presentation, recall, vocabulary, export, tour, bookmark orchestration, private notes, layout prefs, etc.) and assign a target owner module for each. See [WallCanvas responsibility inventory](#wallcanvas-responsibility-inventory).
3. Introduce a **wall session context** skeleton (empty or minimal at first):
   - `WallInteractionContext` — selection, editing, linking, camera intent
   - `WallSyncContext` — cloud id, sync status, pending/error state (read-mostly for UI)
   - Optional: `WallLayoutContext` — panel open state, layout prefs
4. Define target file tree (proposed):

```text
src/components/wall/
  session/
    WallSessionProvider.tsx
    useWallSession.ts
    useWallSessionBindings.ts
    wall-interaction-context.tsx
    wall-sync-context.tsx
    wall-layout-context.tsx
    wall-chrome-context.tsx
    wall-details-context.tsx
    wall-modal-context.tsx
  modals/
    WallExportModals.tsx
    WallSettingsHelpModals.tsx
    WallMediaInsertModals.tsx
  spatial/
    WallSpatialView.tsx          # Konva stack composition
    notes/                       # split from WallNotesLayer
      WallNotesLayer.tsx         # thin composer
      renderers/                 # per note kind or concern
  chrome/                        # optional grouping over time
  ... existing files ...
```

#### Exit criteria

- [x] Responsibility inventory checked in
- [x] Session provider mounted from `WallCanvas` without behavior change
- [x] Team agreement: no new props added to `WallDetailsSidebar` / `WallFloatingUi` without context migration plan (documented in `docs/contributing/development-workflow.md`)

#### Validation

- `npm run lint`
- `npm run build`
- Smoke: open wall, create/edit note, toggle panels — no regressions

---

## WallCanvas responsibility inventory

Each row maps a concern currently owned (fully or partially) by `WallCanvas.tsx` to its target owner after the refactor. Status reflects Phase 0 baseline.

| Responsibility | Current location | Target owner | Phase |
|----------------|------------------|--------------|-------|
| Domain store (notes, zones, links, camera) | `useWallStore` | `src/features/wall/store.ts` | Done |
| Local persistence + debounced save | `useWallPersistenceEffects` | `useWallPersistenceEffects` / `features/wall/storage` | Done |
| Cloud bootstrap + delta sync | inline in `WallCanvas` + `useWallRemoteDeltaFeed` | `features/wall/sync`, `useWallPersistenceEffects` | 2 |
| Sync status chrome (pending, error, last synced) | `WallCanvas` state → header/footer | `WallSyncContext` → chrome consumers | 1 |
| Selection (single, multi, box) | `useWallSelection` + inline state | `WallInteractionContext` + `useWallSelection` | 1 |
| Inline editing state | `WallCanvas` `editing` state | `WallInteractionContext` + editor hooks | 1 |
| Keyboard shortcuts | `useWallKeyboard` | split sub-hooks (Phase 3) | 3 |
| Camera / pan / zoom | `useWallCameraNavigation`, `useWallZoomControls` | spatial shell + interaction context | 2 |
| Viewport windowing + entity cache | `useWallViewportWindow`, `useWallEntityWindowCache` | `WallSpatialView` | 2 |
| Note drag / resize / snap | inline + `useWallSnapping` | spatial shell + `note-interaction` helpers | 3 |
| Konva layer stack | inline JSX in `WallCanvas` | `WallSpatialView` | 2 |
| Note rendering (all kinds) | `WallNotesLayer` | `wall/spatial/notes/renderers/*` | 3 |
| Links + zones layers | `WallLinksZonesLayer` | `WallSpatialView` composition | 2 |
| Floating editors + docks | `WallFloatingUi` (~85 props) | session context + `WallFloatingUi` | 1 |
| Details sidebar / inspector | `WallDetailsSidebar` (~100 props) | session context + section consumers | 1 |
| Global modals (export, settings, media) | `WallGlobalModals` | modal registry or domain splits | 1 |
| Header / toolbar / tools panel | `WallHeaderBar`, `WallToolsPanel` | `WallChromeShell` | 2 |
| Search / command palette | `WallSearchDock` + recall query state | session hook + search module | 1–2 |
| Timeline scrubber mode | `useWallTimeline` + inline state | `useWallTimeline` / presentation module | 2 |
| Timeline stream view | `WallTimelineView` | existing stream architecture | Done |
| Presentation / narrative paths | inline state + `WallFloatingUi` | presentation session hook | 2 |
| Recall search + saved searches | inline state + details sections | details/session module | 1 |
| Vocabulary review UI | inline handlers + details | details/session module | 1 |
| Smart merge suggestions | inline + `WallDetailsSidebar` | details/session module | 1 |
| Zone / tag groups UI | details sections | details/session module | 1 |
| Private notes (protect/unlock/edit) | inline state + `PrivateNoteModal` | `features/wall/private-notes` + session | 2 |
| Bookmark fetch / cache / resize | inline orchestration | `features/wall/bookmarks` extension | 2 |
| Media note editors (image/audio/video/file) | `WallFloatingUi` + handlers in `WallCanvas` | session actions + type editors | 1–2 |
| Export / import / publish | `useWallExport` + modals | `useWallExport` + export modal cluster | 1 |
| Backup reminders | `useWallBackupActions` | `useWallBackupActions` | Done |
| Product tour | `useWallProductTour` | `useWallProductTour` | Done |
| Layout + spatial prefs | inline state + localStorage | `WallLayoutContext` | 1 |
| Panel open state (left/right) | inline state | `WallLayoutContext` | 1 |
| Reading / presentation / focus modes | inline state | `WallLayoutContext` + interaction | 1 |
| Published read-only snapshot | inline bootstrap | sync context + store hydrate | 2 |
| Telemetry | `useWallTelemetry` | `useWallTelemetry` | Done |
| Derived data (tags, backlinks, clusters) | `useWallDerivedData` | `useWallDerivedData` | Done |
| UI actions (create note, focus, etc.) | `useWallUiActions`, `useWallActions` | session hook exposing bound commands | 1 |

---

### Phase 1 — Collapse prop surfaces (1–2 weeks)

**Goal:** Replace 85–100 prop interfaces with context consumers.

**Status:** Shipped (2026-06-17) — session contexts wired; chrome components consume `useWallSession()` slices.

#### Priority order

1. `WallFloatingUi` — editors, zoom, timeline/presentation docks
2. `WallDetailsSidebar` / `WallDetailsContent` — inspector sections
3. `WallGlobalModals` — split by domain or modal registry after context exists

#### Tasks

1. Move shared handlers and state from `WallCanvas` into session hooks:
   - `useWallSession()` — composed read API for chrome components
   - Keep command execution in `features/wall/commands`; session hook exposes bound actions
2. Migrate `WallFloatingUi` to consume context; delete props that merely pass through from `WallCanvas`.
3. Migrate details panel sections incrementally:
   - Start with one section (e.g. `HistorySection`) as proof
   - Shrink `DetailsSectionTypes.ts` prop bags as sections migrate
4. Split `WallGlobalModals` by domain:
   - Export / import cluster
   - Settings / help / shortcuts cluster
   - Media insert cluster

#### Exit criteria

- [x] `WallFloatingUi` prop count reduced by ≥50% (now 0 props — context-only)
- [x] `WallDetailsSidebar` prop count reduced by ≥50% (now 0 props — context-only)
- [x] No new `DetailsSection*Props` types added for migrated sections (`HistorySectionProps` removed; sections use context)
- [ ] `WallCanvas` line count trending down (target: −500 lines minimum in this phase) — partial: JSX prop drilling removed; bindings live in `useWallSessionBindings.ts`; net `WallCanvas` reduction ~50 lines so far

#### Validation

- Manual QA: all details sections, floating editors, modals
- Update `docs/qa.md` with context-migration smoke steps if panel wiring changed

---

### Phase 2 — Decompose `WallCanvas` (2–3 weeks)

**Goal:** `WallCanvas` becomes a thin shell (~800–1,200 lines).

**Status:** In progress (2026-06-17) — Tasks 1–2 shipped structurally (`WallSpatialView`, `WallChromeShell`). Task 3 substantially advanced: prior extractions plus focused hooks (`useWallRenderSnapshot`, `useWallDisplayLayer`, `useWallCanvasEffects`, `useWallTimelineHistory`, `useWallNoteQuickActions`, `useWallKeyboardBindings`) and `useWallCanvasOrchestration` (orchestration + session/spatial binding assembly). `WallCanvas.tsx` is now a ~70-line composition shell (down from ~4,330); `eslint-disable` removed from `WallCanvas`. `useWallCanvasOrchestration` (~1,390 lines) retains the disable until further split.

#### Tasks

1. Extract **`WallSpatialView`** — owns Konva layer stack: **(shipped 2026-06-17)**
   - `WallStage`, `WallDotMatrixLayer`, `WallNotesLayer`, `WallLinksZonesLayer`, `WallOverlaysLayer`
   - Canvas container (drag/drop, loading, focus/reading badges, inline video, `WallFloatingUi`)
2. Extract **`WallChromeShell`** — header, toolbar, tools panel, search dock, footer, timeline toggle: **(shipped 2026-06-17)**
   - `WallChromeHeader` + `WallInCanvasChrome` in `src/components/wall/chrome/WallChromeShell.tsx`
3. Move remaining orchestration into focused controllers/hooks under `features/wall` or `wall/session/`: **(substantially advanced 2026-06-17)**
   - `useWallSpatialBindings` — spatial + chrome prop assembly
   - `useWallCommandPalette` — omnibar commands
   - `useWallCloudSync` — sync scheduling / delta push / rebase
   - `useWallClientPrefs` — layout/spatial/recall/presentation-path localStorage bootstrap + persist
   - `useWallPrivateNotes` — protect/unlock session, editor commit, wiki-link sync on edit
   - `useWallBookmarkOrchestration` — preview fetch + auto-upgrade on hydrate
   - `useWallNoteCreation` — viewport-centered note factories (all note kinds)
   - `useWallMediaNoteHandlers` — image/audio/video/file note submit, playback, open/download
   - `useWallImageInsert` — image insert modal, clipboard paste, Unsplash/moodboard orchestration
   - `useWallPresentationPaths` — narrative path CRUD, step camera sync, presentation index state
   - `useWallSmartMerge` — merge suggestion preview/apply wiring for details panel
   - `useWallNoteTagActions` — per-note tag add/remove/rename helpers
   - `useWallVocabularySession` + `useWallSessionClock` — vocabulary review session + wall clock for derived data
   - `useWallPanelChrome` — left/right panel state, tracked modal openers, details auto-open
   - `useWallRenderSnapshot` — published/timeline render snapshot, wiki/backlink derivations, placement helpers
   - `useWallDisplayLayer` — private-note display masking and focus-mode visibility filtering
   - `useWallCanvasEffects` — viewport resize, transformer wiring, debounced edit commit, deep links, selection pruning
   - `useWallTimelineHistory` — timeline history bootstrap from IndexedDB
   - `useWallNoteQuickActions` — pin/highlight/focus and zone-group collapse helpers
   - `useWallKeyboardBindings` — keyboard shortcut wiring for the spatial shell
   - `useWallCanvasOrchestration` — composes all wall hooks and session/spatial binding assembly; consumed by `WallCanvas`
   - Remaining in `WallCanvas`: session provider mount, spatial/chrome JSX composition, private-note modal shell
4. Remove `eslint-disable complexity, max-lines` from `WallCanvas` when thresholds are met — **done on `WallCanvas` shell**; remains on `useWallCanvasOrchestration` until that module is split further
5. Relocate `wall-canvas-helpers.ts` junk-drawer contents: **(done 2026-06-17)**
   - `wall-coordinates.ts` — toWorld/toScreen, fit bounds, open-note placement, zone containment
   - `wall-links-geometry.ts` — link points, stroke/color maps, link graph traversal
   - `wall-download.ts` — export download helpers + download id
   - `wall-storage-keys.ts` — localStorage key constants + snap threshold
   - `wall-canvas-helpers.ts` retains note-text/presentation helpers (text style/font/truncation, tag-chip palette, recency intensity, journal date label)

#### Exit criteria

- [x] `WallCanvas.tsx` ≤ 1,200 lines (now ~75-line shell)
- [x] No `eslint-disable complexity, max-lines` on `WallCanvas`
- [ ] Each extracted module ≤ ~400 lines OR has documented reason to exceed (`useWallCanvasOrchestration` ~1,390 lines — interim orchestration owner; split in Phase 3+ or follow-up slice)

#### Validation

- Full `docs/qa.md` wall sections
- `npm run check:regressions` if available for wall paths

---

### Phase 3 — Split `WallNotesLayer` (2–3 weeks)

**Status:** Shipped (2026-06-18) — shared layout/styling helpers, `WallNoteViewModel` (compact previews), `note-interaction.ts` (drag/resize/select wiring), `WallNoteChromeOverlays`, per-kind canvas renderers, keyboard sub-hooks, and a thin `WallNotesLayer` composer (~226 lines) with extracted asset loading, style animations, presentation derivation, and full-detail dispatch modules under `wall/spatial/notes/`.

**Goal:** Note rendering and interaction scalable per note type.

#### Recommended split strategy

**Option A (preferred): by note kind**

```text
wall/spatial/notes/renderers/
  StandardNoteRenderer.tsx
  ImageNoteRenderer.tsx
  VideoNoteRenderer.tsx
  AudioNoteRenderer.tsx
  FileNoteRenderer.tsx
  BookmarkNoteRenderer.tsx
  EisenhowerNoteRenderer.tsx
  JournalNoteRenderer.tsx
  CodeNoteRenderer.tsx
  PrivateNoteRenderer.tsx
```

**Option B: by concern** (if kind split is too disruptive initially)

- `note-layout.ts` — sizing, caption height, contained image layout
- `note-assets.ts` — image load caps, asset URL resolution
- `note-interaction.ts` — drag, resize, hit targets (shared)

#### Tasks

1. Extract shared layout helpers currently inline in `WallNotesLayer` (image caption estimation, contained layout, etc.). **Started 2026-06-18:** image caption estimation, auto-height, and contained image layout now live in `src/components/wall/spatial/notes/note-layout.ts`.
2. Introduce **`WallNoteViewModel`** (pure functions in `features/wall` or `wall/note-presentation/`):
   - title, subtitle, privacy mask label
   - preview dimensions policy
   - muted/disabled states
   - Used by both Konva renderers and `WallNotePreview` (Phase 4)
   - **Started 2026-06-18:** `src/features/wall/wall-note-view-model.ts` now owns compact title/meta/privacy labels used by low-detail canvas note previews. Preview dimensions and full `WallNotePreview` consumption remain Phase 4 work.
3. Thin `WallNotesLayer` composes renderers + windowing props only.
   - **Shipped 2026-06-18:** compact/ambient rendering in `WallCompactNoteRenderer`; full-detail renderers under `wall/spatial/notes/renderers/` for image, bookmark, file, audio, video, private, journal, code, quote, and standard notes; shared chrome overlays in `WallNoteChromeOverlays`; drag/resize/select wiring in `note-interaction.ts`. Composer extractions: `useWallNoteAssets`, `useWallNoteStyleAnimations`, `buildWallNotePresentation`, `WallFullNoteRenderer`, `open-note-editor`, and `wall-notes-layer-types`. `WallNotesLayer` is ~226 lines.
4. Split `useWallKeyboard` into scoped hooks:
   - `useWallKeyboardNavigation` (`keyboard/useWallKeyboardNavigation.ts`)
   - `useWallKeyboardEditing` (`keyboard/useWallKeyboardEditing.ts`)
   - `useWallKeyboardSelection` (`keyboard/useWallKeyboardSelection.ts`)
   - Composer hook re-exports for `WallCanvas` / spatial shell — **shipped 2026-06-18** (`useWallKeyboard.ts` composes the three handlers)

#### Exit criteria

- [x] `WallNotesLayer.tsx` (composer) ≤ ~300 lines (now ~226)
- [x] No single renderer file ≥ ~500 lines without follow-up split plan
- [x] `useWallKeyboard.ts` ≤ ~200 lines per sub-hook

#### Validation

- Manual QA per note type: create, edit, drag, resize, delete
- Visual check: canvas presentation unchanged for baseline screenshots in `docs/baselines/`

---

### Phase 4 — Unify dual rendering (2 weeks)

**Goal:** Stop timeline/canvas presentation drift.

#### Tasks

1. Implement **`getWallNoteViewModel(note, context)`** (name TBD) returning a stable struct for presentation.
2. Refactor `WallNotePreview` to consume view model only — no duplicate domain parsing.
3. Refactor Konva renderers to consume the same view model for text labels, privacy masking, media metadata.
4. Add **visual regression baseline** (choose one):
   - Storybook stories per note type × surfaces (`canvas` mock / `preview` card), or
   - Playwright screenshot compares for a fixture wall JSON

#### Exit criteria

- [ ] View model unit tests for each note kind
- [ ] `WallNotePreview` does not duplicate title/subtitle logic found in view model
- [ ] Documented mapping: view model field → Konva node / HTML element

#### Validation

- Side-by-side QA: select note on canvas, open timeline stream — titles/subtitles/media labels match
- Update `docs/features/timeline-view.md` and `docs/features/wall-notes.md` if presentation rules change

---

### Phase 5 — Correctness and test harness (2–3 weeks, can overlap Phase 2–4)

**Goal:** Test the flows that lose user trust when broken.

#### Minimum test suite

| Priority | Test | Type |
|----------|------|------|
| P0 | Local save debounce → reload restores note | Hook/integration |
| P0 | Cloud bootstrap + delta apply + rebase | Hook/integration (extend existing delta tests) |
| P0 | Private note: protect → unlock → edit → lock | Hook/integration |
| P1 | Keyboard: select note, delete, undo | RTL |
| P1 | Edit commit on blur / Escape | RTL |
| P1 | Timeline stream: search, select, keyboard prev/next | RTL |
| P2 | Playwright: login → wall → create note → reload | E2E smoke |

#### Tasks

1. Add fixture wall snapshots under `src/features/wall/__fixtures__/` (or test-only path).
2. Extend `useWallPersistenceEffects.test.tsx` and `useWallRemoteDeltaFeed.test.tsx` with rebase/conflict scenarios.
3. Add one Playwright spec: `@wall-smoke` tagged, runnable in CI when env available.
4. Update `docs/qa.md` to reference automated coverage for P0 flows; manual QA focuses on gaps.

#### Exit criteria

- [ ] P0 tests green in CI
- [ ] No refactor phase merges without running P0 suite
- [ ] `docs/contributing/development-workflow.md` lists wall test commands

---

### Phase 6 — Polish and documentation (1 week)

**Goal:** Align docs, tokens, and modal structure with the new architecture.

#### Tasks

1. Update canonical docs:
   - `docs/architecture/frontend-architecture.md` — session model, spatial shell, file tree
   - `docs/architecture/wall-rendering-model.md` — layer split, view model
   - `docs/features/wall-notes.md` — presentation contract
2. Token alignment:
   - Migrate hardcoded atelier values in timeline/preview to CSS variables OR document intentional stream-only palette in `docs/product/ux-rules.md`
3. Archive or annotate `docs/archive/legacy-plans/frontend-improvement-plan.md` with pointer to this plan
4. Optional ADR: `docs/decisions/0003-wall-session-context.md` if session split is accepted

#### Exit criteria

- [ ] Architecture docs match shipped structure
- [ ] No stale “decomposition complete” claims elsewhere
- [ ] Changelog entry when user-visible stability improves (optional)

---

## Success Criteria (overall)

| Metric | Target |
|--------|--------|
| `WallCanvas.tsx` lines | ≤ 1,200 (stretch: ≤ 800) |
| `WallNotesLayer` composer lines | ≤ 300 |
| `WallFloatingUi` props | ≤ 30 (or context-only) |
| `WallDetailsSidebar` props | ≤ 30 (or context-only) |
| `eslint-disable` on wall root | Removed |
| P0 automated tests | Present and CI-green |
| Dual-render drift | View model single source for labels/metadata |

## Non-Goals

- Rewriting the wall without Konva
- Adding a second global state library
- Large aesthetic overhaul (separate from structure)
- 100% component test coverage — focus on data and interaction critical paths

## Anti-Patterns (do not do)

- Split files every 500 lines without an ownership model
- Add more props to sidebar/floating UI during migration
- Silence lint with file-level disables instead of splitting
- Add features to `WallNotesLayer` before Phase 3 split
- Document this plan as “shipped” before exit criteria are met

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Long-running refactor branch diverges | Vertical slices merged weekly; feature freeze on god files only |
| Behavior regressions undetected | P0 tests before Phase 2 merges; baseline screenshots |
| Context over-fetch re-renders | Split contexts; memoize session value; profile if needed |
| View model abstraction wrong | Start with read-only fields; expand incrementally per note kind |

## Open Questions

1. Should session context live in `components/wall/session/` or `features/wall/session/`?
2. Is Storybook already desired for this repo, or Playwright screenshots only?
3. Can `npm run check:regressions` be extended to wall P0 tests in CI?
4. Should presentation/narrative state move entirely to `features/wall` as persisted domain state?

## Suggested Execution Order (summary)

```text
Phase 0  Stop bleeding + session skeleton
    ↓
Phase 1  Context migration (props collapse)
    ↓
Phase 2  WallCanvas decomposition          ←─┐
Phase 3  WallNotesLayer split               │ parallelizable after Phase 1
Phase 4  View model / dual-render unify      │
Phase 5  Correctness tests                 ←─┘
    ↓
Phase 6  Docs + token polish
```

If only three things ship first:

1. Break up `WallCanvas` and `WallNotesLayer` (Phases 2–3).
2. Replace 100-prop interfaces with session context (Phase 1).
3. P0 sync/edit/reload tests (Phase 5).

## Related Docs

- `docs/architecture/frontend-architecture.md`
- `docs/architecture/wall-rendering-model.md`
- `docs/architecture/state-and-storage.md`
- `docs/features/timeline-view.md`
- `docs/features/wall-notes.md`
- `docs/runbooks/sync-debugging.md`
- `docs/qa.md`
- `docs/archive/legacy-plans/frontend-improvement-plan.md` (superseded structural claims)
