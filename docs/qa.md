# Idea-Wall Manual QA Checklist

## Baseline + Guardrails (Day 1-2)
1. Run `npm run dev`.
2. Capture baseline screenshots with `npm run baseline:capture`.
3. Confirm screenshot set exists in `docs/baselines/2026-02-11/`:
   `home/login/signup/wall` for both desktop and mobile.
4. Review short route flows in `docs/baselines/2026-02-11/README.md`.

Expected:
- Baseline packet is complete and can be reused for visual diff checks.
- Route baselines are consistent across desktop and mobile captures.

## Frontend Quality Guardrails
1. Keyboard navigation:
   - Tab through interactive controls on `/`, `/login`, `/signup`, `/wall`.
   - Verify focus order is logical and no keyboard trap occurs in modal surfaces.
2. Focus states:
   - Verify visible focus treatment for primary controls, links, inputs, and modal close buttons.
3. Mobile breakpoints:
   - Validate `390x844` behavior for `/`, `/login`, `/signup`, `/wall`.
   - Confirm no clipped controls or horizontal overflow.
4. Contrast:
   - Verify body text and interactive controls meet readable contrast on all primary surfaces.
5. Panel overlap behavior (`/wall`):
   - On compact width (`< 1120px`), open `Tools` and `Details`.
   - Confirm overlays can be closed by backdrop and remain usable without blocking critical actions.

Expected:
- Keyboard-only users can complete core flows.
- Focus visibility is clear and consistent.
- Mobile layouts keep controls reachable without overlap regressions.
- Contrast remains readable across all routes.
- Panel layering does not trap interaction.

## Phase 5 - Aesthetic Parity Across Routes
1. Open `/`, `/login`, `/signup`, and `/wall`.
2. Verify each route uses the same atmosphere shell (soft gradient field + glass surfaces + tokenized borders).
3. On mobile viewport (`390x844`), confirm:
   - Landing top actions (`Sign in`, `Create account`) remain visible without overlap.
   - Auth support card and auth form stack vertically with comfortable spacing.
   - Wall account chip remains reachable at top-right and does not overlap core toolbar actions.
4. Verify primary actions on all routes use accent button styling consistently.
5. Verify danger states on auth/wall (`auth error`, `sync error`) use tokenized danger palette.

Expected:
- Landing, auth, and wall feel like one product with consistent visual language.
- Mobile route behavior is intentional, readable, and touch-friendly.
- Action hierarchy and state feedback are consistent across routes.

## Phase 6 - Hardening Execution Record (2026-02-11)
Executed checks:
1. `npm run lint` -> pass
2. `npm run check:regressions` -> pass
3. `npm run build` -> pass (required sandbox escalation for Windows `spawn EPERM`)
4. `npm run baseline:capture` -> pass after baseline script hardening in `scripts/capture-ux-baselines.ps1`

Artifacts confirmed:
1. `docs/baselines/2026-02-11/home-desktop.png`
2. `docs/baselines/2026-02-11/login-desktop.png`
3. `docs/baselines/2026-02-11/signup-desktop.png`
4. `docs/baselines/2026-02-11/wall-desktop.png`
5. `docs/baselines/2026-02-11/home-mobile.png`
6. `docs/baselines/2026-02-11/login-mobile.png`
7. `docs/baselines/2026-02-11/signup-mobile.png`
8. `docs/baselines/2026-02-11/wall-mobile.png`

## Wall Performance Targets (Guardrails)
Measure in warm local sessions with DevTools performance markers where possible.

1. Panel open latency:
   - Target `< 120 ms` for `Tools`, `Details`, `Export`, and `Shortcuts`.
2. Search palette open time (`Ctrl/Cmd + K` to focused input and rendered results):
   - Target `< 100 ms`.
3. Initial interactive time on `/wall` (navigation start to first successful note interaction):
   - Target `< 2.5 s` (warm cache).
4. Stretch targets with 300 notes loaded:
   - Panel open latency `< 180 ms`.
   - Search open time `< 140 ms`.

Expected:
- Wall command surfaces feel immediate during normal use.
- Large walls remain responsive for key entry points.

## Milestone 0 - Scaffold and Routes
1. Run `npm install`.
2. Run `npm run dev`.
3. Open `http://localhost:3000/` and verify marketing landing page renders.
4. Open `http://localhost:3000/wall` and verify interactive wall view renders.

Expected:
- No runtime errors in terminal or browser console.
- `/` and `/wall` are both accessible.

## Milestone 1 - Notes MVP (Create, Edit, Drag, Persist)
1. In `/wall`, click `New Note` five times.
2. Double-click each new note and enter unique text.
3. Drag notes to different positions.
4. Refresh the page.

Expected:
- Notes reappear with the same text, position, size, and color.
- Edits save automatically while typing.
- Dragging remains smooth.

## Milestone 2 - Pan, Zoom, Infinite Wall
1. Hold `Space` and drag to pan.
2. Use trackpad or mouse wheel without modifier to pan.
3. Use `Ctrl/Cmd + wheel` to zoom toward the cursor.
4. Click `Reset View`.

Expected:
- Notes keep correct relative positions through pan/zoom.
- Reset returns camera to 100% zoom centered on content bounds.

## Milestone 3 - Resize, Color, Delete, Duplicate
1. Select a note and resize using transform handles.
2. Select a new color from swatches.
3. Press `Ctrl/Cmd + D` (or `Shift + D`) to duplicate selected note.
4. Press `Delete` to remove selected note and confirm dialog.
5. Refresh page.

Expected:
- Resized dimensions and chosen colors persist.
- Duplicate appears slightly offset.
- Deleted note does not return after refresh.

## Milestone 4 - Search and Quick Jump
1. Press `Ctrl/Cmd + K` to open search.
2. Search for a known phrase in one note.
3. Select result.

Expected:
- Result list updates quickly as you type.
- Selecting a result centers and highlights the target note.

## Milestone 5 - Clusters and Zones
1. Click `New Zone` twice.
2. Drag and resize zones.
3. Click `Detect Clusters`.
4. Refresh page.

Expected:
- Zone position and size persist after refresh.
- Cluster outlines appear without moving notes.

## Milestone 6 - Export
1. Click `Export`.
2. Export PNG with `Current view` and verify downloaded image.
3. Export PNG with `Whole wall`.
4. Select a zone and export PNG with `Selected zone`.
5. Export Markdown.

Expected:
- PNG files match rendered styling/content.
- Markdown file includes note text and metadata.

## Smart Links - Directed Graphs
1. Create at least three notes.
2. Select first note, click `Start Link` (or press `Ctrl/Cmd + L`), then click second note.
3. Repeat to create a second link from second note to third note.
4. Change link type dropdown (`Cause -> Effect`, `Dependency`, `Idea -> Execution`) and create one link of each type.
5. Click a note in the chain and confirm only related path links remain emphasized.
6. Refresh page.
7. Select a link arrow and press `Delete`, then refresh again.
8. Right-click a link arrow and choose `Change Type`, then right-click again and choose `Delete link`.

Expected:
- Arrows render directionally between notes with type-specific styling.
- Selecting a note highlights upstream/downstream graph paths and dims unrelated links.
- Links persist after refresh.
- Deleting a selected link removes it permanently.
- Right-click menu appears on links with actions applied immediately.

## Structure Primitives - Tags, Templates, Zone Groups
1. Select a note and add two tags via the `Selection Tags` controls in the `Details` panel.
2. Open search (`Ctrl/Cmd + K`) and search by one of those tags.
3. Choose each template in the template dropdown and click `Apply Template`.
4. Select one zone, enter a group name in `Zone Groups` panel, then click `Group Zone`.
5. Assign another zone to the same group using the `Selected Zone Group` dropdown.
6. Collapse that group in the panel and verify grouped zones and overlapping notes are hidden.
7. Expand group and verify content returns.
8. Refresh page.
9. Add the same tag to at least two notes and verify an automatic `Tag Groups (Auto)` entry appears.
10. Click the tag-group entry and verify camera jumps to the grouped notes.

Expected:
- Tags are displayed on notes and searchable.
- Template creates a pre-structured layout with zones, notes, and grouped zones.
- Collapsing a zone group hides grouped zones and notes inside those zones.
- Zone groups, assignments, and collapse state persist after refresh.
- Tags with 2+ notes are shown as automatic groups with outlines and panel entries.

## Multi-Select Workflows
1. Enable `Box Select` and drag over several notes.
2. Verify selected count appears in header.
3. Apply a color swatch and confirm all selected notes change color.
4. Add a tag and confirm all selected notes receive the tag.
5. Drag one selected note and confirm the full selection moves together.
6. Use align/distribute buttons and verify layout updates accordingly.
7. Open export modal and choose `Selected notes` PNG scope.
8. Export Markdown and confirm selected notes are exported.

Expected:
- Box selection selects intersecting notes.
- Bulk operations apply consistently to all selected notes.
- Align/distribute actions only activate when enough notes are selected.
- Selected-notes export works for both PNG and Markdown.

## Faster Capture
1. Open quick capture with `Q` (or `Ctrl/Cmd + J`).
2. Enter 3 lines (include inline tags such as `#idea` on one line).
3. Press `Ctrl/Cmd + Enter` to capture.
4. Re-open quick capture and use `Paste -> Notes` with multi-line clipboard text.
5. If browser supports speech recognition, click `Voice to Notes`, speak two short lines, pause for ~8-10 seconds, then speak again and stop.

Expected:
- One line becomes one note near viewport center.
- Inline `#tags` are parsed into note tags.
- Clipboard multi-line input creates multiple notes.
- Voice transcripts are appended into quick-capture text and can be captured as notes.
- Silence timeouts auto-recover: voice capture keeps listening after a `no-speech` timeout until you explicitly stop.

## Stronger Recall
1. In the Recall panel, enter text in query and verify matching notes remain visible.
2. Apply zone filter and confirm notes are restricted to that zone overlap.
3. Apply tag filter and confirm only notes with that tag remain visible.
4. Apply date filter (`Today`, `Last 7d`, `Last 30d`) and verify recency filtering by `updatedAt`.
5. Click `Save Search`, name it, then clear filters and re-apply saved search.
6. Click `Jump Stale` and confirm camera centers on the least recently updated visible note.
7. Add `#priority` or `#urgent` to notes and click `Jump Priority`.

Expected:
- Saved searches persist and can be reapplied.
- Combined filters narrow the visible note set.
- Stale and priority jumps reliably focus the target notes.

## Undo/Redo History
1. Create three notes and move one note.
2. Press `Ctrl/Cmd + Z` repeatedly and confirm actions revert in reverse order.
3. Press `Ctrl/Cmd + Shift + Z` (or `Ctrl/Cmd + Y`) and confirm actions reapply.
4. After one undo, make a brand-new edit (for example, add a tag).
5. Press redo shortcut.
6. Multi-select at least 3 notes, perform an align action, then press undo once.
7. Apply a template, then press undo once.
8. Multi-select drag at least 3 notes, then press undo once.
9. In `History` panel, verify `Undo depth` and `Redo depth` values change as actions are undone/redone.
10. Click `Clear History`, confirm prompt, then verify undo/redo are disabled and depths reset to 0.

Expected:
- Undo restores previous states reliably.
- Redo reapplies undone states.
- New edits after undo clear redo stack (recovery safety against branching confusion).
- Grouped operations (align, template apply, multi-select move) undo in a single step.
- History depth indicator is visible and updates correctly.
- Clearing history requires confirmation and is irreversible.

## Time-Based Views
1. Make several edits over 1-2 minutes (create notes, move notes, change tags/colors).
2. Toggle timeline mode (`T`) and verify timeline controls appear at the bottom.
3. Drag timeline slider backward and confirm wall state rewinds.
4. Click `Play` and verify snapshots replay forward.
5. Toggle heatmap (`H`) and confirm recently updated notes appear warmer/stronger.
6. Verify GitHub-style calendar heatmap appears and click a highlighted day to jump timeline.
7. Exit timeline mode and verify editing is enabled again.

Expected:
- Timeline mode is navigable with slider and playback.
- Playback reflects historical snapshots in order.
- Heatmap visually emphasizes recently changed notes.
- Calendar heatmap mirrors GitHub-style day grid and supports day-based timeline jump.
- Timeline mode is read-only for wall mutations.

## Share and Export Upgrades
1. Open Export modal and export PDF for each scope (`Current view`, `Whole wall`, `Selected zone`, `Selected notes`).
2. Verify downloaded PDF files render notes/links/zones correctly.
3. Toggle presentation mode using `P`.
4. Use arrow keys (or Prev/Next controls) to move between notes in presentation mode.
5. Exit presentation mode and verify normal editing resumes.
6. In Export modal, click `Publish Read-Only Link`.
7. Open the copied link in a new tab and verify the wall is read-only and displays snapshot state.

Expected:
- PDF export works for all scopes.
- Presentation mode supports focused note-by-note walkthrough.
- Published snapshot link opens a read-only wall state without mutation controls.

## Data Backup - JSON Export/Import and Reminder
1. Open `Export` modal and click `Export JSON`.
2. Verify a backup file is downloaded (filename starts with `idea-wall-backup-`).
3. Make a visible wall change (create or move note).
4. In `Export` modal, click `Import JSON` and choose the exported backup file.
5. Confirm import prompt.
6. Verify wall state is restored to the backup snapshot.
7. In `Export` modal, set `Backup Reminder` to `Daily`.
8. Refresh the page and verify reminder prompt appears if due; choose cancel.
9. Set `Backup Reminder` to `Weekly`, refresh again, and verify reminder does not reappear immediately.
10. Set `Backup Reminder` to `Off` and verify no reminder prompt appears on refresh.

Expected:
- JSON export captures full wall snapshot (notes/zones/groups/links/camera).
- JSON import restores the snapshot after confirmation.
- Reminder cadence is persisted and prompts at configured intervals only.
- Turning reminder off suppresses prompt.

## Keyboard Accessibility Spot Check
1. Press `N` for new note.
2. Press `Ctrl/Cmd + K` for search.
3. Press `Ctrl/Cmd + L` with a selected note, then click target note to create a link.
4. Press `Ctrl/Cmd + Z` then `Ctrl/Cmd + Shift + Z`.
5. Press `Ctrl/Cmd + A` to select visible notes.
6. Press `T` and `H` to toggle time-based views.
7. Press `Delete` with selected note (and optionally selected group).
8. Press `?` to open shortcuts overlay.

Expected:
- All shortcuts work without needing mouse for command invocation.

## Performance and Regression Checks
1. Create or import at least 300 notes.
2. Enable `Box Select`, select 40+ notes, and drag the group across the wall.
3. While dragging, verify peer notes move with the anchor smoothly and no major frame drops occur.
4. Open Recall and type a query; verify filtering and panel interactions remain responsive.
5. Run `npm run check:regressions`.

Expected:
- Multi-select drag remains responsive with large walls (no obvious jank spikes from per-frame state churn).
- Recall/tag/path derived data updates remain responsive.
- Regression guardrails pass for hook/state anti-patterns (`react-hooks/set-state-in-effect`, `react-hooks/refs`).

## Usability Polish - Icons, Tooltips, Responsive Panels
1. Open `/wall` on desktop width (>= 1200px).
2. Verify top bar controls display icon + label pairs with tighter spacing.
3. Hover each top bar control and verify tooltip text appears; confirm shortcut hints show for:
   `Search`, `Capture`, `Undo`, `Redo`, `Present`, `Timeline`, `Heatmap`, `Shortcuts`.
4. Verify left tools rail controls display icon + label pairs and tooltips, including:
   `New Note`, `New Zone`, `Box Select`, `Start Link`, `Detect Clusters`.
5. Resize viewport to tablet/mobile width (< 1120px).
6. Verify left/right side panels are collapsed by default and can be opened using top bar `Tools` / `Details` toggles.
7. With one or both side panels open on compact width, click the dimmed backdrop and verify panels close.
8. Open each compact panel and use its `Close` button.

Expected:
- Control iconography is consistent across top bar and tools rail.
- Tooltips render for controls, with shortcut chips where available.
- On compact layouts, side panels behave like collapsible overlays and do not permanently occupy canvas space.

## IA Cleanup - Accordions, Minimal Context, Layout Preferences
1. Open `/wall` with default layout.
2. In the `Details` panel, verify `History`, `Recall`, `Zone Groups`, and `Tag Groups (Auto)` sections can each be expanded/collapsed independently.
3. Confirm `Templates` and `Selection Tags` remain visible without needing expansion.
4. Clear note selection and verify top `Context` bar is hidden.
5. Select one note and verify `Context` bar appears with only relevant controls (`Color`, `Tags`).
6. Select two or more notes and verify alignment/distribution controls appear.
7. Click top-bar `Layout` and disable `Tools Panel`; verify left panel disappears.
8. Disable `Details Panel`; verify right panel disappears.
9. Disable `Context Bar`; verify it stays hidden even with selected notes.
10. Refresh the page and verify layout preferences persist.
11. Re-enable all layout toggles and verify full layout is restored.

Expected:
- Dense right-panel sections are organized with collapsible accordions.
- Context bar remains minimal and appears only when selection-dependent actions are relevant.
- Layout preference toggles persist across reloads and control panel visibility reliably.

## Note Design - Pro Interaction Pass
1. Select one note and press `Enter`; verify inline editor opens.
2. Click directly on note text; verify editor opens without requiring double-click.
3. Select a note and use quick floating actions above the note:
   set text size (`S/M/L`), change color, duplicate, delete, and start link.
4. Drag a note near another note edge/center and verify snap guide lines appear.
5. While dragging, hold `Shift` and verify movement locks to a single axis.
6. Hold `Alt` and drag a note; on release verify a duplicated note appears at drop position while source remains.
7. Add many tags to a note and verify note body shows compact tag chips with overflow count (`+N`).
8. Resize note and verify text is visually truncated (no overflow clipping outside card).
9. Hover a note and compare against selected/dragging states.

Expected:
- Editing and quick actions are faster and match modern canvas UX patterns.
- Snap guides and distance labels improve alignment confidence.
- Axis lock and alt-drag duplication work consistently.
- Tags render as compact chips with overflow handling.
- Hover/selected/dragging visual states are clearly distinct.

## Tag Parsing Parity - Direct Edit vs Quick Capture
1. Create a new note and type text containing inline hashtags (for example: `Draft launch plan #release #q2`) directly in note edit mode.
2. Blur or commit the edit.
3. Select the note and verify tags appear in selection tag chips/details.
4. Repeat by editing an existing note and adding an additional `#tag`.
5. Open quick capture and create a note with inline `#tags` for comparison.

Expected:
- Inline hashtags typed directly inside note text are recognized and added to `note.tags`.
- Quick capture and direct note editing produce consistent tag parsing behavior.
- Existing manual tags are preserved while new inline tags are appended (deduplicated).
- Tag editing entry point is the `Selection Tags` section in `Details` panel (not the top context bar).
- Hovering or selecting a note with tags reveals full tag list context beyond compact chip truncation.

## Accounts and Cloud Sync (Supabase)
1. Create a new account on `/signup` and complete sign-in.
2. Verify `/wall` loads and account chip shows signed-in email.
3. Sign out and verify redirect to `/login`.
4. Sign in again with same account and verify return to `/wall`.
5. Create notes/zones/links, wait for `Last synced` to update, refresh page, verify data persists.
6. Click `Sync now` and confirm sync completes without error banner.
7. Sign in on a second browser/device with same account and verify wall content appears after sync.
8. Modify wall on device B, sync, then refresh device A and verify updates propagate.
9. Turn off network, make local edits, turn network back on, click `Sync now`, verify changes persist and error clears.
10. Sign in with a second account and verify it does not see the first account's wall.

Expected:
- `/wall` is protected for unauthenticated users.
- Sync status updates (`Syncing...`, `Last synced`) behave consistently.
- Cross-device sync works for create/edit/delete.
- Accounts remain isolated via RLS.

## Priority 2 Maintainability Guardrails (2026-02-12)
1. Run `npm run lint`.
2. Run `npm run check:types`.
3. Run `npm run check:deadcode`.
4. Run `npm run check:styles:duplicates`.

Expected:
- Lint warnings/errors stay within accepted thresholds and new wall complexity/size warnings remain visible.
- Type check passes with `noUncheckedIndexedAccess` enabled.
- Dead-code check passes for wall domain and shared lib modules.
- Duplicate wall class check reports no repeated long class literals needing extraction.

## Priority 3 Strategic Guardrails (2026-02-12)
1. Run `npm run test:unit`.
2. Open `/wall` in a local/dev session and perform:
   - open `Tools`, `Details`, `Search`, `Export`, and `Shortcuts`
   - first wall interaction (pointer or keyboard)
3. Inspect `localStorage["idea-wall-ux-telemetry-v1"]` in DevTools.
4. Export JSON backup from `Export` modal, then import it back.

Expected:
- Unit tests include storage migration and backup compatibility coverage.
- Telemetry snapshot persists local/dev UX timings for:
  `initialInteractMs`, `toolsPanelOpenMs`, `detailsPanelOpenMs`, `searchOpenMs`, `exportOpenMs`, `shortcutsOpenMs`.
- Backup export/import remains compatible with current and legacy-shaped snapshots.
