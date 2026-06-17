# 0002 Timeline Stream Improvements

## Status

Accepted

## Context

Agy currently ships **three timeline-related implementations**, but only two are user-facing. The vertical **Timeline stream view** (`V`) is the primary review surface linked from the top nav, yet it is read-only, non-navigable beyond scrolling, and partially disconnected from parent handlers. A separate **Timeline history mode** (`T`) replays persisted wall snapshots and shares the word “timeline” in UI copy and docs.

A live review of the deployed wall (137 notes) confirmed:

- Timeline stream scroll height exceeds **66,000px** with no virtualization.
- File and attachment notes often render low-signal filename/metadata instead of narrative context.
- `WallCanvas` passes `onSelectNote` / `onRevealNote` into `WallTimelineView`, but the child component ignores them.
- Toolbar, command palette, and QA docs still describe Timeline view as a **horizontal** canvas experience, while the shipped UI is a **vertical editorial stream**.
- A full horizontal timeline canvas stack exists in source (`WallTimelineHeader`, `WallTimelineCard`, `WallTimelineScrubber`, `WallTimelineDetailPanel`, `buildWallTimelineLayout`) but is **not mounted anywhere**.

This decision record captures the architecture teardown and the implementation plan for the priority fixes identified in review.

---

## Architecture Teardown

### 1. Timeline history mode (shortcut `T`)

**Purpose:** Rewind and replay the wall to earlier persisted states.

| Layer | Owner |
| --- | --- |
| Persistence | `src/features/wall/storage.ts` — `timelineSnapshots` IndexedDB table, checkpoint + delta encoding |
| Entry loader | `loadTimelineEntries()` → `TimelineEntry { ts, snapshot }[]` |
| Orchestration | `src/components/WallCanvas.tsx` — `timelineMode`, `timelineIndex`, `isTimelinePlaying` |
| Playback hook | `src/components/wall/useWallTimeline.ts` — auto-advance interval, `jumpToTimelineDay()` |
| UI | `src/components/wall/WallFloatingUi.tsx` → `WallTimelineDock`, `CalendarHeatmap` |
| Render effect | `activeTimelineEntry` swaps `renderSnapshot` to a historical `PersistedWallState` |

**Behavior:**

- Entering mode jumps to the latest snapshot index.
- Slider/play controls scrub forward/back through history entries.
- Heatmap (`H`) overlays recency on canvas notes; calendar supports day jump into history mode.
- Editing is blocked via `isTimeLocked`.

**Data model:** History snapshots are **not** the same as note `createdAt` ordering. They record wall mutation checkpoints over time.

---

### 2. Timeline stream view (shortcut `V`, top-nav “Timeline”)

**Purpose:** Read-only chronological review of the **current** note set.

| Layer | Owner |
| --- | --- |
| Toggle state | `WallCanvas` — `timelineViewActive` |
| View component | `src/components/wall/WallTimelineView.tsx` |
| Grouping | `buildTimelineGroups()` — day buckets, left/right/center lanes |
| Card rendering | `WallNotePreview` via `resolveWallPreviewDimensions(..., { surface: "timeline-stream" })` |
| Exit | `Escape`, header `Close`, `onExit` callback |

**Behavior today:**

- Sorts by `note.createdAt` descending within day groups.
- Pinned notes render centered; unpinned alternate left/right on desktop.
- Renders **two** preview nodes per entry (mobile + desktop breakpoints) in the DOM.
- No search, date jump, selection, or reveal bridge.
- Props `selectedNoteId`, `activeTimestamp`, `onSelectNote`, `onRevealNote` are declared and passed from `WallCanvas` but **not consumed** by `WallTimelineView`.

**Parent reveal handler already exists:**

```ts
// WallCanvas.tsx
const revealNoteFromTimeline = useCallback((noteId: string) => {
  setTimelineViewActive(false);
  focusNote(noteId);
}, [focusNote]);
```

---

### 3. Orphaned horizontal timeline canvas (unmounted)

**Purpose (original intent):** Horizontally scrolling time canvas with density scrubber, detail panel, and layout controls.

| Component | Role |
| --- | --- |
| `wallTimelineViewLayout.ts` | `buildWallTimelineLayout()` — sort, zoom, bucket modes, lane packing |
| `WallTimelineHeader.tsx` | Sort/size/zoom/group/range controls |
| `WallTimelineCard.tsx` | Positioned cards with select + double-click reveal |
| `WallTimelineScrubber.tsx` | Density track for jumping across horizontal layout |
| `WallTimelineDetailPanel.tsx` | Right-rail selected note preview + “Reveal on Wall” |
| `__tests__/wallTimelineViewLayout.test.ts` | Layout engine tests (still valid) |

**Status:** No imports from `WallCanvas` or routes. Command palette copy at `WallCanvas.tsx` still says: *“Arrange current notes on a horizontally scrolling timeline.”* `WallToolbar` tooltip says *“Toggle horizontal timeline view.”*

This is the main source of conceptual drift.

---

### 4. Shared preview and sizing layer

| File | Role |
| --- | --- |
| `src/components/wall/WallNotePreview.tsx` | Note-kind renderers (journal, quote, file, image, etc.) |
| `src/components/wall/wallNotePreviewSizing.ts` | Surface-aware dimensions: `wall`, `timeline-stream`, `timeline-canvas`, `timeline-detail` |
| `src/components/wall/wallTimelineViewHelpers.ts` | Date formatting, bucket keys, scrubber helpers |

Attachment weakness is mostly **presentation**, not missing data: `getFileNoteTitle()` / `getFileNoteMeta()` exist, but stream cards inherit large wall dimensions and text-heavy notes may fall through to low-signal body rendering.

---

### 5. Locking and interaction matrix

`isTimeLocked` is true when any of these are active:

- `timelineMode` (history replay)
- `timelineViewActive` (stream view)
- `publishedReadOnly`
- `presentationMode`
- `readingMode`

Stream view should remain **non-editable** but gain **navigation actions** (select, reveal, jump, filter) without mutating notes.

---

### 6. Documentation and QA drift

| Artifact | Current claim | Actual behavior |
| --- | --- | --- |
| `docs/features/timeline-view.md` | Stream is non-interactive beyond scroll/exit | Accurate today; will change after reveal/navigation |
| `docs/qa.md` § Horizontal Timeline View | Clicking a note must not reveal on wall | Conflicts with planned reveal bridge |
| Command palette / toolbar | Horizontal timeline view | Vertical editorial stream |
| `docs/qa.md` § Time-Based Views | `T` mode scrubber + heatmap | Still accurate; separate from stream view |

---

## Decision

Implement the priority fixes in **four phases** while **keeping the vertical stream** as the canonical Timeline view (`V`). Rename and clarify Timeline history mode (`T`) in UI copy without changing its shortcut in phase 1.

Do **not** resurrect the full horizontal canvas in the first pass. Reuse its **interaction patterns** (select, reveal, detail panel, scrubber semantics) inside the vertical stream where they add value.

Delete or repurpose orphaned horizontal-only components only after stream parity is established.

---

## Implementation Plan

### Phase 0 — Naming and doc alignment (small, ship first)

**Goal:** Remove the two-timeline naming collision in user-facing copy.

| Task | Files |
| --- | --- |
| Rename history mode strings to **“Wall History”** or **“History Replay”** in command palette, tooltips, and help content | `WallCanvas.tsx`, `useWallKeyboard.ts`, `src/features/help/content.ts` |
| Rename stream view strings to **“Timeline”** consistently; remove “horizontal” from toolbar tooltip and command palette description | `WallToolbar.tsx`, `WallCanvas.tsx` |
| Update canonical feature doc limitations/behavior preamble | `docs/features/timeline-view.md` |
| Add glossary note distinguishing history mode vs stream view | `docs/product/overview.md` (short paragraph) |

**Acceptance:**

- No user-facing copy describes stream view as horizontal.
- `T` and `V` shortcuts unchanged.
- Help/palette text makes the two modes distinguishable in one sentence each.

---

### Phase 1 — Stream interaction bridge (reveal + selection)

**Goal:** Close the loop back to the spatial wall without enabling inline editing.

| Task | Detail |
| --- | --- |
| Wire props in `WallTimelineView` | Destructure `selectedNoteId`, `onSelectNote`, `onRevealNote`; track local selection if parent does not |
| Card interaction model | Single click → select; double-click or explicit **“Reveal on Wall”** button → `onRevealNote(noteId)` |
| Keyboard | `↑`/`↓` or `J`/`K` move selection across chronological entries; `Enter` reveal; `Escape` exit (existing) |
| Visual selected state | Pass `selected` to `WallNotePreview` |
| Mobile | Tap selects; action chip/button reveals (no double-click reliance) |

**Files:**

- `src/components/wall/WallTimelineView.tsx`
- `src/components/WallCanvas.tsx` (only if selection sync needs adjustment)
- `src/components/wall/useWallKeyboard.ts` (stream-specific key handling when `timelineViewActive`)

**Acceptance:**

- Clicking a note highlights it.
- Reveal exits stream view and focuses/pans the note on the wall (uses existing `revealNoteFromTimeline`).
- No note text editing from stream view.
- QA updated to expect reveal behavior.

---

### Phase 2 — Stream navigation (search, date jump, prev/next)

**Goal:** Make 100+ note histories navigable without endless scrolling.

| Task | Detail |
| --- | --- |
| Header toolbar | Add compact controls: search input, date `<select>` or combobox populated from day groups, optional sort toggle (`created` / `updated`) |
| Search | Client-side filter across title/first line/tags/file name (`buildTimelineGroups` input filtered before layout) |
| Date jump | Scroll stream container to chosen day section via `ref` map on group headers |
| Prev / Next | Buttons + keyboard shortcuts jump between entries, respecting filter |
| Empty filter state | Clear copy when search returns zero matches |

**Suggested extraction:**

```
src/components/wall/
  useWallTimelineStream.ts      # filter, sort, selection index, scroll targets
  WallTimelineStreamHeader.tsx  # search + date jump + sort
  wallTimelineStreamHelpers.ts  # filter predicates, label helpers
```

**Files:**

- New hooks/components above
- `WallTimelineView.tsx` — compose header + wire scroll refs
- `wallTimelineViewHelpers.ts` — shared date/list helpers

**Acceptance:**

- With 137 notes, user can jump to `March 16, 2026` without manual scrolling.
- Search for `Dear Wall` or a tag surfaces matching entries only.
- Prev/Next moves selection and scrolls entry into view.

---

### Phase 3 — Attachment and file card presentation

**Goal:** Timeline entries communicate *why* a note matters, not raw filename theater.

| Task | Detail |
| --- | --- |
| Add `getTimelineNoteLabel(note)` helper | Priority: user title → first line → wiki title → `getFileNoteTitle` → `getImageNoteTitle` → fallback |
| Add `getTimelineNoteSubtitle(note)` | For files: kind + size; for text: truncated second line or tag summary |
| Timeline stream renderer variant | Either `WallNotePreview` `surface="timeline-stream"` prop or thin `WallTimelineNoteCard` wrapper |
| Cap oversized stream dimensions | For `file` / `bookmark` / bare attachment notes, clamp max height (e.g. 220–280px) while preserving aspect for image/journal types |
| Fix horizontal overflow | Ensure card column and preview roots use `max-w-full overflow-hidden`; audit `wall-timeline-scrollbar` children |

**Files:**

- `src/components/wall/wallTimelineStreamHelpers.ts` (new)
- `src/components/wall/WallNotePreview.tsx` (surface-aware label behavior)
- `src/components/wall/wallNotePreviewSizing.ts` (optional clamp rules per kind)
- `src/components/wall/WallTimelineView.tsx`

**Acceptance:**

- PDF/markdown file notes show a readable primary label (filename once) and compact meta line.
- No horizontal scrollbar at default desktop viewport width.
- Journal/quote/image notes remain visually unchanged.

---

### Phase 4 — Virtualized stream rendering

**Goal:** Keep Timeline responsive as note count grows.

| Task | Detail |
| --- | --- |
| Introduce list virtualization | Prefer `@tanstack/react-virtual` (single dep, variable row heights) **or** native `content-visibility: auto` + spacer estimates if avoiding new deps |
| Single preview per entry | Render one preview path based on `matchMedia` or container width, not duplicated mobile/desktop DOM |
| Group headers as virtual items | Day chips stay sticky or inline as virtual rows |
| Measurement strategy | Estimate row height from `resolveWallPreviewDimensions` + timestamp/footer; remeasure after images load |

**Files:**

- `package.json` (if adding `@tanstack/react-virtual`)
- `src/components/wall/WallTimelineView.tsx`
- `src/components/wall/WallTimelineVirtualRow.tsx` (new, optional)
- `src/components/wall/__tests__/wallTimelineStreamHelpers.test.ts` (new)

**Acceptance:**

- 137-note wall: initial mount renders only visible rows (verify via DOM node count spot-check).
- Scroll remains smooth; selected entry scroll-into-view still works.
- No duplicate note preview nodes per entry in the DOM.

---

### Phase 5 — Orphan cleanup and optional detail rail

**Goal:** Reduce dead code and decide fate of horizontal stack.

| Option A (recommended) | Repurpose `WallTimelineDetailPanel` as stream right-rail on `xl+` viewports when a note is selected |
| Option B | Delete horizontal-only components after porting reveal/detail patterns |

| Task | Detail |
| --- | --- |
| Mount detail panel in stream view | Show tags, timestamps, reveal CTA for selected note |
| Remove dead props smell | All declared props used or removed |
| Delete or archive unused horizontal components | `WallTimelineHeader`, `WallTimelineCard`, `WallTimelineScrubber` if not integrated |
| Keep `buildWallTimelineLayout` | Retain if heatmap/scrubber concepts migrate; otherwise move to `docs/archive/` with comment |

**Acceptance:**

- No unused timeline component exports remain without an explicit `// legacy` comment and doc note.
- `WallTimelineDetailPanel` is either mounted in stream view or deleted.

---

## Testing and QA Gates

| Phase | Automated | Manual (`docs/qa.md`) |
| --- | --- | --- |
| 0 | — | Palette/tooltip copy check |
| 1 | Unit tests for selection index helpers | Reveal + keyboard selection |
| 2 | Filter/sort helper tests | Search, date jump, prev/next |
| 3 | Label helper tests for file/journal/quote | Attachment card readability, no horizontal scroll |
| 4 | Virtual row height estimation tests | Scroll perf with 100+ notes |
| 5 | — | Detail rail visibility + orphan removal |

Required repo gates before merge (per `AGENTS.md`):

1. `npm run lint`
2. `npm run build`
3. Manual QA sections updated in `docs/qa.md`

---

## Docs to Update During Implementation

| Doc | When |
| --- | --- |
| `docs/features/timeline-view.md` | Each phase that changes behavior |
| `docs/qa.md` | Phases 1–4 (replace “non-interactive” reveal rules) |
| `docs/releases/changelog.md` | User-visible summary after all phases |
| `docs/architecture/frontend-architecture.md` | Add timeline module map after hook extraction |
| `docs/decisions/0002-timeline-stream-improvements.md` | Mark **Accepted** when phase 5 completes |

---

## Alternatives Considered

### A. Ship the orphaned horizontal canvas as Timeline view

**Rejected for now.** Layout engine and tests exist, but switching orientations regresses the current editorial stream users already have open in production. Horizontal layout also performs worse for long chronological histories on typical laptop viewports.

### B. Merge history mode and stream view into one surface

**Rejected.** Different data sources (snapshot history vs current notes) and different mental models (replay vs review). Could be a future third tab inside a unified “Time” workspace.

### C. Make stream view fully editable

**Rejected.** Editing on the stream would duplicate wall editor complexity and break `isTimeLocked` guarantees. Reveal bridge is the correct handoff.

---

## Consequences

### Positive

- Timeline becomes a navigable review tool instead of a scroll-only gallery.
- Naming clarity reduces support burden and contributor confusion.
- Virtualization and DOM dedupe prepare the stream for 500+ notes.
- Orphan component debt is resolved intentionally.

### Negative / tradeoffs

- Reveal-from-timeline changes a deliberate non-interactive QA contract; docs must move in the same PRs.
- Virtualization adds complexity to selection scroll-into-view.
- Sort-by-updated may surprise users expecting created-time journaling; default remains `created`.

### Open Questions

1. Should top-nav **Timeline** open stream view with last scroll position preserved across sessions?
2. Should history mode (`T`) gain a one-click “Open this day in Timeline stream” bridge?
3. Is adding `@tanstack/react-virtual` acceptable, or should we stay dependency-free with `content-visibility`? **Resolved in Phase 4:** `@tanstack/react-virtual` is now used for stream virtualization.

---

## Related Docs

- `docs/features/timeline-view.md`
- `docs/qa.md` — § Time-Based Views, § Horizontal Timeline View
- `docs/architecture/state-and-storage.md` — timeline snapshot persistence
- `docs/architecture/frontend-architecture.md`
