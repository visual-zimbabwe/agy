# Unified Agy Refactor Plan

## Status

**In progress — Phase 2 implemented on branch `refactor/phase-2-timeline-tokens`.** Phase 1 on `refactor/phase-1-wall-unified`. Tunnel verification and PR pending.

## Purpose

Refactor Agy into **one light-mode product** with a **unified design system**, a **Wall-first delivery order**, and **clear separation** between Wall (spatial notes) and Decks (standalone study). Remove failed or redundant surfaces (dark theme, Smart Merge, vocabulary/word notes, Basic/Advanced split, Wall→Decks integration) while **preserving user content** through explicit migrations.

## Scope

### In scope

- Wall chrome simplification and feature removal (Phase 1)
- Light-only theme removal across all routes
- Word/vocabulary note removal and migration
- Smart Merge removal
- Wall→Decks UI/API removal
- Settings and Help consolidation
- Timeline token/shell alignment (Phase 2)
- Decks full UI rebuild with feature parity, standalone data model (Phase 3)
- Landing alignment and documentation/QA updates (Phase 4)

### Out of scope

- Konva → DOM canvas rewrite
- New state management library
- Mobile-native apps or full mobile parity (responsive improvements only where cheap)
- Decks feature cuts below current parity
- Re-introducing Wall→Decks workflows in any form

## Related docs

These become stale when implementation ships and must be updated in the same change sets:

- `docs/product/overview.md`
- `docs/product/ux-rules.md`
- `docs/features/settings.md`
- `docs/features/help-system.md`
- `docs/features/vocabulary-review.md` (archive or delete)
- `docs/features/wall-notes.md`
- `docs/features/decks.md`
- `docs/api/account.md`
- `docs/architecture/state-and-storage.md`
- `docs/qa.md`
- `README.md`

---

## Locked product decisions

| Topic | Decision |
|-------|----------|
| Design system | **One unified system** across Wall, Timeline, Decks, landing, settings |
| Theme | **Light only** — remove dark/system everywhere |
| Theme migration | One-time DB cleanup: set all accounts to `light`; remove from UI/API; deprecate column, drop in follow-up migration |
| Phase order | **Wall-first** → Timeline → Decks rebuild → Landing/docs |
| Phase 1 done gate | Deployed on **current Localtonet tunnel** (`xy3ywehn9o.localto.net`) with **signed-in sync** verified after reload |
| Details panel | **Rebuild slimmer** — selection inspector only; **collapsed by default** |
| Context bar | **On by default** (user can disable in Workspace settings) |
| Basic/Advanced | **Remove** — single wall mode; progressive disclosure via omnibar + Structure menu |
| Tools left rail | **Remove** — creation via omnibar + shortcuts |
| Smart Merge | **Remove feature** entirely |
| Word / vocabulary | **Remove entirely** — note type, review workflow, shortcuts, omnibar actions |
| Word data | **Migrate, don't delete** — convert to `standard` notes; merge useful fields into body; strip `vocabulary` payload |
| Wall→Decks | **Strip all UI/API in Phase 1**; Decks is **standalone** (shared auth/header/tokens only) |
| Existing deck cards | **Keep as normal deck cards**; drop wall provenance/link metadata only |
| Decks nav in Phase 1 | Header **Decks** link remains → **current Decks UI** until Phase 3 rebuild |
| Decks Phase 3 | **Full UI rebuild** with **feature parity** (library, browse, stats, study, sub-decks, custom study) |
| Timeline | **Wall overlay** (`V` + header), not a top-level peer route |
| Structure tools | **Omnibar `tool:`** + labeled **Structure** menu in wall chrome |
| Help | **One Help center**; `?` opens shortcuts tab; no duplicate keyboard surfaces |
| Settings | Shared **`SettingsShell`** — modal on Wall, `/settings` route elsewhere; refreshed dashboard; consistent **gear icon** in header |
| Settings tabs | **Account** · **Preferences** (startup, timezone) · **Workspace** (context bar, tags on cards, replay tour, panel pin) |
| Perf target | ~**141 notes** smooth pan/zoom/fit; local build + automated tests first; **tunnel verification required** before merge |
| Note types kept | Standard, journal, canon, quote, code (fenced-block detection), bookmark, file, audio, video, image, Eisenhower matrix, private; zones/links as structure |
| Private notes / Eisenhower | **Keep** |
| Delivery workflow | After each phase: verify on **https://xy3ywehn9o.localto.net/** → if correct, **commit, push new branch, open PR** (always) |

---

## Delivery workflow (tunnel verify → branch → PR)

Every phase (and each logical sub-milestone within a phase, when shipped separately) follows this workflow. **Do not merge to `main` without tunnel verification and an open PR.**

### Canonical verification URL

**https://xy3ywehn9o.localto.net/**

This Localtonet tunnel is the **authoritative visual and integration check** for whether changes match expectations. Local `npm run dev` catches build/test issues; the tunnel catches what the deployed app actually looks and feels like (sync, auth, real note data, chrome layout).

### Before checking the tunnel

1. Run the automated gate for the change scope:
   - `npm run lint`
   - `npm run build`
   - `npm run test:wall:p0` (and any other tests touched by the change)
2. **Restart the dev server** when changes may not hot-reload cleanly, including:
   - `globals.css` / theme token changes
   - env or API route changes
   - storage migration or boot hooks
   - Next.js config or middleware changes
   - first run after `npm run build` when validating production behavior locally before tunnel reflects it
3. Confirm the tunnel points at the running local server (Localtonet forwards to the active dev port). If the tunnel shows stale UI or 502s, restart **both** the Next dev server and the Localtonet tunnel process, then hard-refresh.

### Tunnel verification checklist (per phase)

Open the tunnel, click through **Visit Site** if Localtonet shows the interstitial, then verify phase-specific expectations.

| Phase | Routes to check | What “correct” means |
|-------|-----------------|----------------------|
| **1 — Wall** | `/wall`, `/settings` (if routed), profile menu | Light-only UI; slim Details; no removed features; sync after edit; Structure menu + omnibar; gear settings |
| **2 — Timeline** | `/wall` → Timeline (`V`) | Unified tokens; stream navigation works; no vocabulary cards |
| **3 — Decks** | `/decks`, `/decks/decks`, study flow | Rebuilt UI matches Wall tokens; parity features work; no Wall import |
| **4 — Landing** | `/`, `/wall`, `/decks` | Landing aligned; docs-accurate entry points |

**Always on Wall checks (when Wall was touched):**

- [ ] Signed-in session loads ~141 notes
- [ ] Edit a note → `Synced` → hard reload → change persisted
- [ ] No console errors blocking core flows
- [ ] Changes match the phase section in this plan (not just “page loads”)

If behavior is **wrong or unexpected**, fix locally, restart server if needed, re-verify on the tunnel. **Do not commit/push/PR until tunnel checks pass.**

### Git workflow (required after successful tunnel verification)

When tunnel verification confirms changes are **correct as expected**:

1. **Branch** — create a new short-lived branch per phase or sub-milestone, e.g. `refactor/phase-1-wall-light-only`, `refactor/phase-2-timeline-tokens`
2. **Commit** — focused Conventional Commit(s) on that branch (see suggested sequences below)
3. **Push** — `git push -u origin HEAD`
4. **Pull request** — **always** open a PR to `main` via `gh pr create` with:
   - Summary of what changed and why
   - Phase reference (e.g. “Phase 1 — §1.1 theme removal”)
   - **Test plan** including tunnel URL and steps performed
   - Screenshots from tunnel when UI changed
5. **Merge** — only after PR checks (CI if configured) and tunnel verification noted in PR body

**One phase = one PR minimum.** Large phases may use multiple PRs (e.g. Phase 1 commits 1–4 in PR A, 5–8 in PR B), but **each merged PR must have passed tunnel verification** for its scope.

### PR title convention

```
refactor(phase-N): <short description>
```

Examples:

- `refactor(phase-1): remove dark theme and vocabulary notes`
- `refactor(phase-2): align timeline to unified light tokens`
- `refactor(phase-3): rebuild decks UI with feature parity`

---

## Current state (baseline)

From live review of `https://xy3ywehn9o.localto.net/wall` (signed-in, ~141 notes):

### What works

- Hybrid **omnibar** (search + `tag:`/`type:`/`is:`/`tool:` + actions) is the strongest surface
- **Timeline overlay** is coherent and readable
- **Sync** reaches `Synced` after load
- Core shortcuts (`Ctrl/Cmd+K`, `N`) function
- Wall session architecture (`WallChromeShell`, `useWall*` hooks) is a reasonable foundation

### Problems driving this plan

| Area | Issue |
|------|-------|
| Design unity | Wall (cream glass), Decks (rust/gradient sidebar), Timeline (own shell) feel like different products |
| Dark mode | Chrome can go dark while **canvas stays warm cream** — incomplete, confusing |
| Details panel | “Premium wall control center” is dense, open by default, duplicates omnibar Recall/Word Review/Zones |
| Basic/Advanced | Users cannot tell the difference — failed UX split |
| Smart Merge | Stale copy references removed `/page` workspace |
| Vocabulary | Parallel SRS on Wall overlaps Decks; `vocabulary` payload on notes via `isVocabularyNote()` |
| Wall→Decks | Cross-window presence, deck selection badge, deck-aware toolbar (`WallToolbar.tsx`) |
| Note chrome | Thick black vertical bars on many cards read as rendering bugs |
| Settings | Theme/keyboard/controls_mode tabs add noise; Decks uses emoji settings link |
| Discoverability | No obvious create affordance on canvas; Tools panel not reliably visible |

---

## Target end state

```
┌──────────────────────────────────────────────────────────────┐
│  Shared: brand, header nav, auth, design tokens, Settings  │
├────────────────────────────┬─────────────────────────────────┤
│  Wall (/wall)              │  Decks (/decks/*)             │
│  spatial notes + timeline  │  standalone SRS                 │
│  own wall sync payload     │  own deck_cards / deck_notes  │
│  no deck integration       │  no wall import                 │
└────────────────────────────┴─────────────────────────────────┘
```

### Wall chrome (Phase 1 target)

```
┌ Header: Agy | Wall · Decks · Timeline | sync · ⚙ settings · profile ─┐
│                                                                        │
│                         Konva canvas                                   │
│                                                                        │
│  [Structure ▾]                                          [zoom rail]    │
│                                                                        │
│              ┌─ context bar (when note selected) ─┐                    │
│              └────────────────────────────────────┘                    │
│                                                                        │
│         ┌──────────── omnibar (Ctrl/Cmd+K) ────────────┐               │
│         └──────────────────────────────────────────────┘               │
│                                                                        │
│  Details panel (collapsed; opens on selection) ──────────────►         │
└────────────────────────────────────────────────────────────────────────┘
```

### Slim Details panel fields

**Include**

- Title / body preview
- Note type badge + type conversion (all kept types except vocabulary)
- Created / updated timestamps
- Pin / highlight toggles
- Tags (add/remove)
- Color / palette
- Duplicate, delete
- Link controls when linking or linkable
- Type-specific essentials (bookmark URL/refresh, file open/download, etc.)
- Private note lock/unlock
- Copy / export snippet

**Exclude**

- Recall search and saved filters (omnibar owns this)
- Word Review / vocabulary fields
- Zones browser / tag-group maintenance bulk
- Templates bulk apply UI (keep via Structure menu / omnibar `tool:`)
- Smart Merge
- Any Decks references

### Design system (light tokens)

Single token source in `src/app/globals.css` (and shared Tailwind theme):

| Token role | Direction |
|------------|-----------|
| Background | Warm paper `#f8f6f1` with subtle atmosphere gradients |
| Surface | `#fffefb` glass/elevated panels |
| Text | `#1f2430` primary, `#5f6676` muted |
| Accent | Terracotta `#a33818` sparingly (CTA, active nav) |
| Border | `#d9d4c7` / `#e8e3d8` |
| Typography | Display serif for brand/headlines; Nunito/body stack for UI |

**Remove** all `html[data-theme-preference="dark"]`, system dark media blocks, and route-specific dark shells (`decks-workspace-shell` dark, `wall-timeline-shell` dark, etc.).

Apply same tokens to Decks in Phase 3 (no separate rust-gradient dialect).

### Settings architecture

| Surface | Entry | Container |
|---------|-------|-----------|
| Wall | Header gear icon | **Modal overlay** (`SettingsShell`) — stay on canvas |
| Decks / deep links | `/settings` | **Full page** using same `SettingsShell` content |
| Narrow viewport | Either entry | Modal becomes full-screen sheet |

**Header gear icon**

- Use shared `Icon` cog from wall control set (not emoji, not mismatched SVG)
- Same size, focus ring, and tooltip pattern as sync + profile
- `aria-label="Open settings"`

**Profile menu**

- Settings (opens same shell)
- Help center
- Sign out

**Settings footer link**

- “Keyboard shortcuts → Help” (no Keyboard tab duplicating content)

---

## Phase 1 — Wall (priority)

**Goal:** Daily-drivable Wall on tunnel with signed-in sync. No dark mode, no removed features, no Wall→Decks coupling.

### 1.1 Theme removal (light only)

**CSS / client**

- [ ] Remove `ThemePreference` `dark` | `system` from `src/lib/preferences.ts`
- [ ] Remove `dataset.themePreference` writes except fixed `light` (or remove attribute entirely)
- [ ] Delete dark/system blocks in `src/app/globals.css` (body gradients stay warm light)
- [ ] Remove theme controls from `src/components/settings/SettingsWorkspace.tsx`
- [ ] Remove theme from login/signup/reset pages if surfaced
- [ ] Audit components using `dark:` Tailwind variants — remove or replace with light-only styles

**API / database**

- [ ] Migration: `UPDATE account_settings SET theme = 'light' WHERE theme IS DISTINCT FROM 'light'`
- [ ] Remove `theme` from `src/app/api/account/settings/route.ts` request/response Zod schemas
- [ ] Remove `theme` from `src/lib/account-settings.ts` client normalization
- [ ] Update `src/lib/supabase/types.ts` — mark `theme` deprecated or plan drop migration
- [ ] Follow-up migration (Phase 1 or 4): `ALTER TABLE ... DROP COLUMN theme` after one release cycle

**Validation**

- [ ] No `data-theme-preference="dark"` in DOM after load
- [ ] Settings save without theme field succeeds

### 1.2 Remove Basic/Advanced (`controls_mode`)

- [ ] Remove `controls_mode` from account API, Supabase types, `useWallClientPrefs`, storage keys
- [ ] Remove Workspace settings UI for density toggle
- [ ] Remove `controlsMode` branching in `WallDetailsContent.tsx`, `WallToolsPanel` visibility gates, toolbar
- [ ] Expose structure features via Structure menu + omnibar (see 1.8)
- [ ] DB cleanup: set `controls_mode = 'basic'` or drop column (same pattern as theme)

### 1.3 Remove Smart Merge

**Delete or orphan-remove**

- [ ] `src/components/wall/useWallSmartMerge.ts`
- [ ] `src/components/wall/details/SmartMergeSection.tsx`
- [ ] `src/lib/smart-merge.ts` (if only used by merge)
- [ ] Context bindings in `useWallSessionBindings.ts`, `wall-details-context.tsx`, `wall-layout-context.tsx`
- [ ] Omnibar / command palette merge actions
- [ ] Help content references
- [ ] QA steps in `docs/qa.md`

### 1.4 Remove vocabulary / word notes

**Conceptual model today**

- Vocabulary is not a `noteKind`; it is `note.vocabulary?: VocabularyNote` detected by `isVocabularyNote()` in `src/features/wall/vocabulary.ts`
- Word review UI: `useWallVocabularySession.ts`, `VocabularySection.tsx`, Details Word Review blocks, omnibar create/review/flip actions

**Removal**

- [ ] Delete vocabulary feature module usage from wall orchestration, details, omnibar, keyboard hooks
- [ ] Remove shortcuts from `src/features/help/content.ts` (`Shift+W`, `F`, review actions)
- [ ] Remove `createVocabularyNote`, `applyVocabularyReview`, etc., or entire `vocabulary.ts` if unused
- [ ] Remove `VocabularyNote` type and `vocabulary` field from `Note` in `types.ts` after migration
- [ ] Remove vocabulary rendering from Konva + `WallNotePreview` paths
- [ ] Archive `docs/features/vocabulary-review.md`

**Client boot migration** (run once per device, before sync push)

```
For each note where note.vocabulary is defined:
  1. Build standard note text:
     - If note.text empty and vocabulary.word non-empty → title/text from word + meaning fields as markdown
     - Else append meaning/sourceContext/ownSentence as markdown footer
  2. Set noteKind to standard (or preserve existing non-vocab kind)
  3. Delete note.vocabulary
  4. Mark note dirty for sync
```

Edge cases (locked defaults):

- Empty-front flashcard → `text = vocabulary.word` (+ meaning block if present)
- No manual review step; silent conversion
- Never delete notes

**Cloud**

- Sync migrated notes via existing wall delta pipeline
- No server-side note deletion

### 1.5 Strip Wall→Decks integration (Phase 1)

**Remove from Wall**

- [ ] `WallToolbar.tsx` — deck presence channel, `openDecksWindow`, deck badge, `deckId` URL params, cross-tab BroadcastChannel deck events
- [ ] Any “add to deck” / deck existence checks on notes (e.g. matrix note copy, details actions)
- [ ] Omnibar / command palette deck actions
- [ ] Help articles implying wall→deck flows
- [ ] Wall API routes that accept or return deck coupling (audit `src/app/api/walls/**`)

**Keep**

- Header `Decks` nav link → current `/decks` (old UI until Phase 3)
- Shared auth session

**Decks data**

- Existing `deck_cards` with `note_id` (wall UUID) — **keep cards**; stop maintaining or displaying wall linkage from Wall side
- Phase 3 Decks rebuild: treat cards as standalone; optionally null `note_id` provenance in UI only

### 1.6 Rebuild slim Details panel

- [ ] Replace “Premium wall control center” overview with minimal selection summary
- [ ] Default `detailsPanelOpen = false`; open on note selection; Workspace setting “Pin details panel”
- [ ] Remove sections: Recall, Word Review, Zones bulk, Smart Merge, Templates bulk (relocate templates to Structure menu)
- [ ] Implement slim field set (see Target end state)
- [ ] Reduce prop surface in `WallDetailsSidebar.tsx` / `wall-details-context.tsx`
- [ ] Delete unused section components or move to Structure flyout

### 1.7 Remove Tools left rail

- [ ] Stop rendering `WallToolsPanel` from `WallChromeShell.tsx`
- [ ] Move create-note actions exclusively to omnibar + shortcuts
- [ ] Remove “Show Tools panel controls” from Workspace settings (or repurposed as “Show Structure menu”)
- [ ] Delete panel toggle from `WallToolbar` if only served Tools

### 1.8 Structure menu + omnibar parity

**Structure menu** (labeled button in wall chrome)

| Item | Maps to |
|------|---------|
| New zone | `onCreateZone` |
| Link notes | start linking / link type |
| Box select | toggle box select mode |
| Snap to grid / guides | toggles |
| Show clusters | toggle |
| Dot matrix | toggle |
| Apply template | template picker |
| Presentation mode | `P` |
| Reading mode | `R` |
| Heatmap | `H` |
| Wall history replay | `T` |
| File conversion | PDF↔Word modal |

**Omnibar**

- [ ] Ensure all Structure actions also reachable via `tool:` tokens
- [ ] Remove vocabulary/deck/merge tool actions
- [ ] Keep `tag:`, `type:`, `is:` filters

### 1.9 Note accent chrome fix

- [ ] Audit Konva note left-edge rendering in `WallNotesLayer.tsx` / `build-wall-note-presentation.ts`
- [ ] Replace stark black bars with **2–4px accent** from `note.color` or type token
- [ ] Align HTML preview path (`WallNotePreview.tsx`) to same rule

### 1.10 Settings dashboard refresh

- [ ] Extract `SettingsShell` shared layout (sidebar nav + content + save bar)
- [ ] Wall: gear opens modal using `SettingsShell`
- [ ] Implement three tabs: Account, Preferences, Workspace
- [ ] Remove theme, keyboard tab, controls_mode, deck references
- [ ] Unify save feedback and “last saved” timestamp
- [ ] Match unified tokens (glass surfaces, typography)

### 1.11 Help consolidation

- [ ] Profile → Help center (route `/help` or modal — match existing `HelpCenter.tsx` pattern)
- [ ] `?` / `Shift+/` → Help center shortcuts section (fix binding if broken)
- [ ] Remove standalone “Keyboard shortcuts” menu item as separate modal (merge into Help)
- [ ] Update `src/features/help/content.ts` — remove word, merge, deck, theme, basic/advanced articles
- [ ] Settings footer link to Help shortcuts

### 1.12 Context bar

- [ ] Default **on** in workspace prefs and `useWallClientPrefs` initial state
- [ ] Ensure actions: edit, duplicate, delete, color, link — visible on selection
- [ ] Document in Help

### Phase 1 — files likely touched (non-exhaustive)

| Area | Paths |
|------|-------|
| Theme | `globals.css`, `preferences.ts`, `SettingsWorkspace.tsx`, `api/account/settings/route.ts` |
| Vocabulary | `vocabulary.ts`, `useWallVocabularySession.ts`, `VocabularySection.tsx`, `useWallKeyboard.ts`, `omnibar.ts`, `help/content.ts` |
| Smart Merge | `useWallSmartMerge.ts`, `SmartMergeSection.tsx`, `lib/smart-merge.ts` |
| Wall→Decks | `WallToolbar.tsx`, `WallHeaderBar.tsx`, wall command palette |
| Details | `WallDetailsContent.tsx`, `WallDetailsSidebar.tsx`, `details/*Section.tsx`, session contexts |
| Tools | `WallToolsPanel.tsx`, `WallChromeShell.tsx` |
| Settings | `SettingsWorkspace.tsx`, new `SettingsShell.tsx` |
| Storage migration | `storage.ts`, boot hook in `useWallPersistenceEffects.ts` |

### Phase 1 — quality gate (definition of done)

**Automated (local)**

1. [ ] `npm run lint` passes
2. [ ] `npm run build` passes
3. [ ] `npm run test:wall:p0` passes (update tests for removed features)

**Tunnel** — **https://xy3ywehn9o.localto.net/** (restart dev server / tunnel if UI or API looks stale)

4. [ ] Hard-refresh `/wall` after server restart
5. [ ] Sign in as real account; wall loads ~141 notes without dark theme artifacts
6. [ ] Edit a note → wait for sync → reload → change persisted (`Synced`)
7. [ ] Omnibar search, `tool:` actions, Structure menu functional
8. [ ] Details opens on selection only; slim fields present
9. [ ] No Smart Merge, Word Review, vocabulary create, or deck actions on Wall
10. [ ] `?` opens Help shortcuts; gear opens refreshed Settings
11. [ ] Vocabulary notes migrated: none with `vocabulary` field after boot
12. [ ] Manual pass on `docs/qa.md` (updated checklist)

**Ship**

13. [ ] Tunnel verification passed → commit on new branch → push → **open PR** (required)

---

## Phase 2 — Timeline alignment

**Goal:** Timeline overlay uses unified light tokens and shared header/settings patterns. Behavior unchanged.

- [x] Replace `wall-timeline-shell` custom dark/light split with unified tokens
- [x] Align typography, chips, search bar, and detail pane with Wall surfaces
- [x] Keep overlay model (`V`, header button); optional `?timeline=1` query later
- [x] Verify note type renderers post-vocabulary removal (no word cards)
- [ ] QA: open Timeline, search, jump by day, prev/next, Enter reveal, Escape close

**Done when:** Timeline visually matches Wall on **https://xy3ywehn9o.localto.net/**; no regression in stream navigation.

**Ship:** tunnel verification → new branch → commit → push → **PR** (required).

---

## Phase 3 — Decks full rebuild

**Goal:** Decks feels like the same app as Wall (tokens, header, settings) while remaining **fully standalone** for data and workflows.

### Feature parity checklist (must ship)

- [ ] Library sidebar with nested decks
- [ ] Create deck / sub-deck
- [ ] Browse cards
- [ ] Deck stats
- [ ] Study session (due queue, ratings)
- [ ] Custom study
- [ ] Import presets / note types (Decks-native, not Wall import)
- [ ] Tags on deck notes
- [ ] FSRS / scheduling (preserve current backend behavior)

### Standalone rules

- [ ] No “import from Wall” or wall `note_id` coupling in UI
- [ ] No BroadcastChannel / cross-window presence with Wall
- [ ] Existing cards remain; `note_id` column ignored in product UI
- [ ] Shared: `WallHeaderBar`-style nav (Wall | Decks | Timeline), auth, `SettingsShell`, Help

### UI rebuild direction

- [ ] Remove emoji `⚙ Settings` / `? Help` sidebar links → header gear + profile Help
- [ ] Replace rust gradient hero with unified paper/glass layout
- [ ] Rebuild `DecksDecksView`, `DecksBrowseView`, `DecksStudyView`, `DecksStatsView` on shared components (`Panel`, `ModalShell`, `Badge`, etc.)
- [ ] Light-only tokens (no Decks-specific dark shell)

### Phase 3 done gate

**Automated (local)**

- [ ] `npm run lint` and `npm run build` pass

**Tunnel** — **https://xy3ywehn9o.localto.net/decks** (restart server if needed)

- [ ] Feature parity manual test on tunnel
- [ ] Decks CRUD + study session completes without Wall open
- [ ] Settings/Help match Wall patterns
- [ ] `docs/features/decks.md` rewritten for standalone model

**Ship:** tunnel verification → new branch → commit → push → **PR** (required).

---

## Phase 4 — Landing + documentation

- [ ] Align `src/app/page.tsx` (landing) to unified tokens; remove dark references
- [ ] Update `README.md` — light-only, simplified chrome map, no vocabulary/smart merge
- [ ] Update canonical docs listed in Related docs
- [ ] Archive `docs/features/vocabulary-review.md` → `docs/archive/`
- [ ] Add ADR `docs/decisions/0004-unified-light-refactor.md` summarizing decisions
- [ ] Update `docs/qa.md` with Phase 1–3 checklists
- [ ] Changelog entry in `docs/releases/changelog.md`

**Tunnel** — verify `/` landing and entry links on **https://xy3ywehn9o.localto.net/**

**Ship:** tunnel verification → new branch → commit → push → **PR** (required).

---

## Data and migration summary

| Data | Action |
|------|--------|
| `account_settings.theme` | Set `light`; remove from API; drop column later |
| `account_settings.controls_mode` | Remove; drop column later |
| Notes with `vocabulary` | Client boot → `standard` text; strip field; sync |
| `deck_cards` / `deck_notes` | **Keep**; no wall provenance in UI |
| Wall layout prefs | Retain; remove tools/deck/merge keys if stored |
| Smart merge state | N/A (computed, not persisted) |

**Data loss policy:** Never delete user notes or deck cards as part of this refactor. Migrations convert or detach; they do not purge content.

---

## Keyboard shortcuts (post-refactor)

Document in Help center only. Remove all vocabulary-related bindings.

| Keep (representative) | Remove |
|-----------------------|--------|
| `N` / `Ctrl/Cmd+N` new note | `Shift+W` word note |
| `Shift+G` canon, `Shift+Q` quote, `Shift+J` journal, `Shift+E` Eisenhower | `F` flip word card |
| `Ctrl/Cmd+K` omnibar | Review next due word |
| `Enter` edit, `Delete` delete selection | Any vocabulary review bindings |
| `Ctrl/Cmd+Z` / `Ctrl/Cmd+Shift+Z` undo/redo | |
| `V` timeline, `T` history, `H` heatmap, `P`/`R` modes | |
| `Esc` clear selection / close overlays | |
| `?` Help shortcuts | |
| Pan/zoom/drag modifiers | |

---

## Testing strategy

| Layer | Expectation |
|-------|-------------|
| Unit | Update `omnibar.test.ts`, vocabulary removal, migration helper tests |
| Integration | `test:wall:p0` — persistence, sync, private notes still pass |
| E2E | `@wall-smoke` when dev server available |
| **Tunnel (required)** | Manual verification on **https://xy3ywehn9o.localto.net/** per phase; restart server/tunnel when stale |
| Manual | Updated `docs/qa.md` — light-only, slim details, no removed features |
| Visual | Spot-check on tunnel: note accents, Details collapsed default, Settings modal |

Add migration test fixture: notes with `vocabulary` payload → assert standard output.

**Tunnel verification is mandatory before every PR.** Local-only validation is insufficient for UI/sync changes.

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Vocabulary migration loses meaning | Merge all vocabulary fields into markdown body before strip |
| Sync conflict after migration | Bump revision; run migration idempotently (skip if no `vocabulary`) |
| Removing `controls_mode` exposes too much UI | Structure menu groups advanced actions; omnibar `tool:` for power users |
| Phase 1 scope creep into Decks rebuild | Strict Wall-only gate; Decks link goes to legacy UI |
| Tunnel shows stale UI | Restart Next dev server and Localtonet tunnel; hard-refresh; rebuild if needed |
| Tunnel false negatives on sync | Re-test after restart; document tunnel steps in PR body |
| Large diff hard to review | Split Phase 1 into multiple PRs; each must pass tunnel verification for its scope |
| Skipping PR workflow | **Not allowed** — every verified phase ends in branch + push + PR |

---

## Suggested branches, commits, and PRs

### Phase 1 (may be one or two PRs)

**Branch example:** `refactor/phase-1-wall-unified`

**Commits (atomic):**

1. `refactor: remove dark theme and controls_mode (light-only)`
2. `feat: vocabulary note migration and removal`
3. `refactor: remove smart merge and wall-decks integration`
4. `feat: slim details panel and remove tools rail`
5. `feat: structure menu and omnibar cleanup`
6. `fix: note accent rendering on canvas`
7. `feat: unified settings shell and help consolidation`
8. `docs: update qa and product docs for phase 1`

**After tunnel pass on https://xy3ywehn9o.localto.net/wall** → push → `gh pr create` → title `refactor(phase-1): unified light wall chrome`

### Phase 2

**Branch:** `refactor/phase-2-timeline-tokens`  
**Tunnel:** `/wall` → Timeline overlay  
**PR:** `refactor(phase-2): align timeline to unified light tokens`

### Phase 3

**Branch:** `refactor/phase-3-decks-rebuild`  
**Tunnel:** `/decks` (+ study session)  
**PR:** `refactor(phase-3): rebuild decks UI with feature parity`

### Phase 4

**Branch:** `refactor/phase-4-landing-docs`  
**Tunnel:** `/` + spot-check `/wall`, `/decks`  
**PR:** `docs(phase-4): landing alignment and canonical doc updates`

---

## Ambiguities

**None remaining.** All product decisions are locked. Implementation may discover technical sub-choices (exact Help route vs modal, Structure menu placement pixel-level) without changing scope.

---

## Approval

Implementation starts only when explicitly requested. Until then, this document is the source of truth for planned work.

Every implementation session ends with: **tunnel check on https://xy3ywehn9o.localto.net/** → if correct → **branch, commit, push, PR**.
