# Idea-Wall Manual QA Checklist

## Block Page Editor (`/page`) (2026-03-05)
1. Open `/page` and verify there is no fixed sidebar/top toolbar.
2. Click empty canvas on the left, center, and right; verify a new editable block appears exactly where clicked.
3. Confirm empty editable blocks show placeholder text `Type "/" for commands`.
4. Hold and drag empty canvas to pan.
5. Use `Ctrl/Cmd + mouse wheel` to zoom toward cursor.
6. Use mouse wheel (without `Ctrl/Cmd`) to pan viewport.
7. Drag any block to a new position and verify free placement on the infinite canvas.
8. In a text block, type `/h1`, `/h2`, `/h3`, `/todo`, `/bullet` (or `/list`), `/quote`, and `/code` (one at a time), then press `Enter` and verify block type changes.
9. While slash menu is open, use `ArrowUp/ArrowDown` and `Enter` to select a command.
10. Press `Esc` with slash menu open and verify it closes.
11. In any text block, type `/file` then press `Enter`; verify file insert popover appears with `Upload` and `Link` tabs.
12. In `/file` popover `Upload` tab, click `Choose a file`, upload a document, and verify a file block appears with file name + size metadata.
13. In `/file` popover `Link` tab, paste a URL (PDF, Drive file, or Maps URL) and verify an embedded file block appears with inferred title and `External` size label.
14. Type `/image`, `/video`, and `/audio` (one at a time), press `Enter`, and verify each opens the same two-option popover and inserts a specialized media block after upload/link.
15. Hover a file/media block and verify toolbar actions appear: `Caption`, `Comment`, `Download`.
16. Use hover toolbar `Caption`; verify caption is saved and shown under the file metadata.
17. Use hover toolbar `Comment`; verify comment thread is added to the target block.
18. Use hover toolbar `Download`; verify uploaded files download and embedded links open in a downloadable/openable target.
19. Verify slash command menu visual parity: compact light menu, left-side command symbols, right-side trigger hints, and `Close menu / esc` footer.
20. Open slash menu near each viewport edge and confirm it repositions (above/below and left/right) to stay visible while minimizing overlap with nearby canvas content.
21. Right-click empty canvas and click `Upload files here`; choose at least 2 files and verify each becomes its own movable file block.
22. Drag-and-drop multiple files from desktop onto canvas and verify each file inserts at drop area.
23. Upload at least one image file and verify inline image preview appears in its block.
24. Click a file block and verify it opens in a new tab.
25. Right-click a file block and run `Rename title`; verify title changes without changing stored file.
26. Right-click a file block and run `Delete file`; verify block is removed and backend delete succeeds.
27. Refresh browser tab and verify blocks, camera position/zoom, and file blocks persist.
28. Validate mobile viewport and desktop viewport: slash menu, file insert popover, and context menus are not clipped and remain usable.
29. Create three `/todo` items, focus the second item, press `Tab`, and verify it indents as a subtask under the first item.
30. With an indented `/todo` item focused, press `Shift + Tab` and verify it outdents back to the parent level.
31. In a text block containing multiple lines, select at least 2 lines and press `Ctrl/Cmd + (Option or Shift) + 4`; verify each selected line converts into its own unchecked todo item.
32. In a text block, type `- `, `* `, and `+ ` at the start of a line; verify each instantly converts to bulleted list style.
33. Focus a block and press `Cmd/Ctrl + Shift + 5`; verify block converts to bulleted list.
34. In a bulleted line, press `Enter`; verify a new bullet is created.
35. In a bulleted line, press `Shift + Enter`; verify newline/paragraph is inserted within the same bullet instead of creating a new bullet.
36. Create a parent bullet with two indented child bullets, drag/delete the parent, and verify child bullets move/delete with it.
37. Verify todo checkbox-to-text spacing is compact and consistent with Notion-style list density (no oversized gap).
38. In a quote block, verify default styling is visually distinct (larger italic text, left border, and indentation).
39. In a quote block, use `Ctrl/Cmd + B`, `Ctrl/Cmd + I`, and `Ctrl/Cmd + K`; verify bold/italic/link Markdown is inserted and quote preview reflects formatting.
40. Click a block six-dot handle, choose `Color`, and verify quote text color and quote background color both update.
41. In a text block, type `"` followed by `Space` at the start of a new line and verify it converts to a quote block.
42. Highlight existing text in a block, click the six-dot handle, run `Turn into > Quote`, and verify selected text becomes a quote block.
43. With a quote block selected, press `Enter`; verify a standard text block appears immediately below with attribution starter (`-- `).
44. Single-click a block six-dot handle and verify block menu opens with actions: `Delete`, `Duplicate`, `Turn into`, `Turn into page`, `Copy link`, `Move to page`, `Comment`, and `Color`.
45. Hold six-dot handle for ~250ms (or click-drag) and verify block drags without opening menu.
46. `Ctrl/Cmd`-click three block handles to multi-select, then hold and drag one selected handle; verify selected blocks move together.
47. In block menu, run `Duplicate` and verify exact copy appears below original.
48. In block menu, run `Delete` and verify block is removed.
49. In block menu, run `Turn into` to convert a text block to `Heading 2`, `To-do list`, and `Quote`; verify type changes each time.
50. In block menu, run `Turn into page`; verify block is moved to a new `doc` route and a page-link block remains in the source page.
51. In block menu, run `Copy link`, paste in browser address bar, and verify it navigates to and focuses the target block.
52. In block menu, use `Move to page` search/typed id to move block to another doc; verify it is removed from source and appears in destination.
53. In block menu, run `Comment`; verify floating comment panel opens with composer (`Add a comment...`, attach, mention, send).
54. In comment panel, type text and verify send icon becomes active (blue), then post and verify new card shows author preferred name + `Just now`.
55. On posted comment, click the `...` menu and verify actions: `Mark as unread`, `Edit`, `Copy link`, `Mute replies`, `Delete`.
56. In `...` menu, click `Delete`; verify confirmation modal appears with `Delete` and `Cancel`, and deleting removes the comment.
57. Refresh browser and verify comments persist on their blocks.
58. In block menu, apply text color and background color and verify entire block styling updates.
59. Drag a block near another block's vertical lane and verify it snaps below (vertical rearrange behavior).
60. Drag a block far left/right across another block and verify side-by-side column placement snap occurs.
61. Drag a list block slightly right under another list block and verify it nests (indent increases).

Expected:
- `/page` is an infinite, pannable, zoomable canvas with no fixed sidebar chrome.
- `Type "/" for commands` appears at the active insertion point, not fixed to left side.
- Slash commands provide Notion-style block changes and keyboard navigation.
- Bulleted lists support slash, markdown, and `Cmd/Ctrl + Shift + 5` creation flows with proper continuation/indent/outdent/end-list behaviors.
- Slash command menu is visually compact and symbol-driven; command popup stays in viewport with reduced canvas obstruction.
- `/file`, `/image`, `/video`, `/audio` open an insert popup with `Upload` and `Link` flows.
- Todo items support `Tab`/`Shift + Tab` nesting and un-nesting.
- Multi-line text selection supports one-shot conversion to todo checkboxes via `Ctrl/Cmd + (Option or Shift) + 4`.
- Quote blocks are visually distinct and support inline Markdown formatting shortcuts for bold/italic/link.
- Block handle menu supports `Turn into > Quote` and quote color controls for text/background.
- Quote conversion shortcut (`"` + `Space` at line start) works reliably.
- Six-dot handle single-click opens block actions; click-hold activates drag-and-drop.
- Multi-selected blocks can be moved together from a handle drag.
- Block menu supports delete/duplicate/turn-into/page conversion/link copying/move-to/comment/color actions.
- File upload works via both picker and drag-drop, including multi-file insertion.
- Uploaded image files preview inline; non-image files render as file cards.
- File/media blocks support open/preview, download original, caption, comment, rename title, delete, and drag repositioning.
- Comment threads use card UI with preferred-name author attribution, `...` action menu, delete confirmation modal, and attach/mention/send composer.
- Page state (blocks + camera) persists after refresh.

## Electron Desktop Packaging (2026-02-18)
1. In `idea-wall-studio`, run `npm install`.
2. Run `npm run dist`.
3. Verify installer exists at `idea-wall-studio/release/Idea Wall Studio-Setup-0.1.0.exe`.
4. Launch unpacked app from `idea-wall-studio/release/win-unpacked/Idea Wall Studio.exe`.
5. Verify routes work in desktop app:
   - `/` landing loads
   - `/wall` loads and note interactions work
   - `/login` and `/signup` render
6. Create note(s), reload app window, verify local persistence.
7. Open an external link from the app and verify it opens in system browser (not in-app webview).

Expected:
- Desktop package builds successfully and launches without blank-window or server-start errors.
- Core routes and wall interactions work inside Electron.
- IndexedDB/local persistence works across desktop relaunch.
- External navigation is blocked in-app and delegated to system browser.

## Decks Route and Workflow (2026-03-03)
1. Sign in and open `/decks` from landing and from `/wall` toolbar.
2. In deck sidebar, create a root deck and one child deck.
3. Open `Add` and create one note using each built-in note type (Basic, reversed, optional reversed, cloze).
4. Start study on parent deck with `Include child decks` enabled; confirm cards from child deck appear.
5. Exclude the child deck and confirm child cards are removed from current queue.
6. In study view, click `Show Answer`, then rate cards with `Again/Hard/Good/Easy`.
7. Open `Browse`, search cards, select rows, and run bulk `Suspend`, `Unsuspend`, and `Delete`.
8. In Browse editor, edit prompt/answer and save.
9. Open `Stats`, switch ranges (`7d`, `30d`, `90d`, `1y`, `deck_life`) and verify summary/workload updates.
10. Open `Import File`, upload sample `.csv` or tab-delimited `.txt`, map columns, import notes.
11. Save an import preset, close modal, reopen, and apply the saved preset.
12. Verify Decks behavior in Electron app build (`idea-wall-studio`) by opening `/decks`, adding one note, and reviewing one card.

Expected:
- Decks route is reachable from both landing and wall.
- Add/Browse/Stats/Study/Import toolbar flows work end-to-end.
- Parent study optionally includes children and supports exclusions.
- Card scheduling updates queue counts after rating.
- Import mapping presets persist via cloud data and reload correctly.
- Same Decks route/features work in web and Electron builds.

## Custom Study Session (2026-03-04)
1. Open `/decks`, select a deck, and confirm `Study Deck` overview appears with `New`, `Learning`, and `To Review` counts.
2. Click `Custom Study` and choose `Increase Today's New Card Limit`; set `Card count` and click `OK`.
3. Confirm deck returns to normal Study session with larger `Today limits` values shown on overview.
4. Return to overview, open `Custom Study`, choose `Increase Today's Review Card Limit`, and apply again.
5. Open `Custom Study`, choose `Review Forgotten Cards`, set days, and confirm cards rated `Again` recently are queued.
6. Open `Custom Study`, choose `Review Ahead`, set look-ahead days, and confirm future-due cards are queued.
7. Open `Custom Study`, choose `Preview New Cards`, keep reschedule unchecked, answer cards, then refresh queue and confirm card scheduling is unchanged.
8. Open `Custom Study`, choose `Study by Card State or Tag`, click `Choose Tags`, include two tags and exclude one tag, then confirm only matching cards are queued (`include` uses OR, excluded tag is removed from results).
9. Start one custom session, then create a new custom session with different settings and confirm the first session queue is replaced.
10. Finish all cards in a custom session and confirm UI automatically returns to deck overview.

Expected:
- Custom Study modal supports all listed session modes.
- Increase limit modes modify today's deck limits directly (not a filtered deck queue).
- Creating a new custom session replaces the previous custom selection.
- Preview mode does not reschedule cards unless user explicitly enables rescheduling.
- Non-preview filtered sessions reschedule cards by default.
- Completing custom queue returns user to home deck overview automatically.

## Baseline + Guardrails (Day 1-2)
1. Run `npm run dev`.
2. Capture baseline screenshots with `npm run baseline:capture`.
3. Confirm screenshot set exists in `docs/baselines/2026-02-11/`:
   `home/login/signup/wall` for desktop.
4. Review short route flows in `docs/baselines/2026-02-11/README.md`.

Expected:
- Baseline packet is complete and can be reused for visual diff checks.
- Route baselines are consistent across desktop captures.

## Frontend Quality Guardrails
1. Keyboard navigation:
   - Tab through interactive controls on `/`, `/login`, `/signup`, `/wall`.
   - Verify focus order is logical and no keyboard trap occurs in modal surfaces.
2. Focus states:
   - Verify visible focus treatment for primary controls, links, inputs, and modal close buttons.
3. Layout behavior:
   - Validate `/`, `/login`, `/signup`, `/wall` at default desktop viewport.
   - Confirm no clipped controls or horizontal overflow.
4. Contrast:
   - Verify body text and interactive controls meet readable contrast on all primary surfaces.
5. Panel overlap behavior (`/wall`):
   - Open `Tools` and `Details`.
   - Confirm panel layering remains usable without blocking critical actions.

Expected:
- Keyboard-only users can complete core flows.
- Focus visibility is clear and consistent.
- Layouts keep controls reachable without overlap regressions.
- Contrast remains readable across all routes.
- Panel layering does not trap interaction.

## Phase 5 - Aesthetic Parity Across Routes
1. Open `/`, `/login`, `/signup`, and `/wall`.
2. Verify each route uses the same atmosphere shell (soft gradient field + glass surfaces + tokenized borders).
3. Verify primary actions on all routes use accent button styling consistently.
4. Verify danger states on auth/wall (`auth error`, `sync error`) use tokenized danger palette.

Expected:
- Landing, auth, and wall feel like one product with consistent visual language.
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

## Quote Notes
1. In `/wall`, click `New Quote` from the Tools panel (or run `Create quote note` from command palette).
2. Enter quote text in the note editor.
3. Add `Author` and `Source` in the quote attribution fields.
4. Blur editor, refresh page, and reopen the same quote note.
5. Open search (`Ctrl/Cmd + K`) and search by quote author/source text.
6. Select the quote and use `More > Convert to Standard`, then `More > Convert to Quote` again.

Expected:
- Quote notes render with quote styling and attribution footer.
- Author/source attribution persists after refresh.
- Command palette note search matches quote body, author, and source.
- Quote/standard conversion works without losing core note content.

## Canon Notes (Single + List)
1. In `/wall`, click `New Canon` from the Tools panel (or run `Create canon note` from command palette).
2. In edit mode, set mode to `Single` and fill `Title`, `Statement`, `Interpretation`, `Example`, and `Source`.
3. Blur and refresh page.
4. Reopen the same canon note and confirm the values persist.
5. Switch mode to `List`, add at least 3 items, and fill item title/text for each.
6. Remove one item and verify list reorders safely.
7. Open search (`Ctrl/Cmd + K`) and search by canon title and by list item text.

Expected:
- Canon notes support both `Single` and `List` modes in one note type.
- Single mode fields persist after refresh/sync.
- List mode supports add/remove items and preserves ordered content.
- Search matches canon title, statements, and list item content.

## Text Formatting Micro-Toolbar
1. Select a note and enter text edit mode (double-click a note or press `Enter` on selected note).
2. Verify a floating formatting toolbar appears only while the text cursor is active inside the editor.
3. Click outside the editor and confirm the formatting toolbar disappears immediately.
4. Select text and apply `Bold`, `Italic`, and `Underline`.
5. Select one or more lines and apply `Bulleted`, `Numbered`, and `Multilevel`.
6. Toggle `Align Left`, `Align Center`, and `Align Right` while editing, then blur and re-open editor.
7. Toggle vertical align `Top`, `Middle`, and `Bottom` while editing, then blur and re-open editor.
8. Change `Font family` in the micro-toolbar and verify note text updates immediately in editor and on canvas.
9. Change `Font size` in the micro-toolbar and verify note text scales immediately in editor and on canvas.
10. Change `Text color` in the micro-toolbar and verify note text color updates immediately in editor and on canvas.
11. With a note selected (not in edit mode), use quick-action `Horizontal align` (`Left`, `Center`, `Right`) and verify alignment updates for all selected notes.
12. With a note selected (not in edit mode), use quick-action `Vertical align` (`Top`, `Middle`, `Bottom`) and verify alignment updates for all selected notes.
13. With a note selected (not in edit mode), use quick-action `Note text color` control and verify color updates for all selected notes.
14. In note edit mode, click `Img`, insert a valid image URL, and verify image appears inside the note while text remains editable.
15. With notes selected but not in text edit mode, verify no text-formatting controls are visible in header/quick-action toolbars.

Expected:
- Formatting controls exist only during note text editing.
- Toolbar tracks text selection/caret context and stays near the edited text.
- Toolbar hides instantly when text editing ends.
- Text alignment persists for each note after exiting and re-entering edit mode.
- Vertical text alignment persists for each note after exiting and re-entering edit mode.
- Font family and text size selections persist for each note.
- Text color selections persist for each note.
- Image URL insertion shows image inside note and persists after blur/reopen.

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
1. Press `Ctrl/Cmd + K` to open command palette.
2. Search for a known phrase in one note.
3. Select result.
4. Reopen palette, type `/`, and run a command (for example `Undo` or `Open export panel`).

Expected:
- Result list updates quickly as you type.
- Selecting a result centers and highlights the target note.
- Command rows are discoverable with shortcut hints and execute immediately.

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

## Structure Primitives - Tags, Templates, and Zone Groups
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
11. Toggle `Tag Signals (Auto)` visibility and verify auto-tag overlays show/hide.

Expected:
- Tags are displayed on notes and searchable.
- Template creates a pre-structured layout with zones, notes, and grouped zones.
- Collapsing a zone group hides grouped zones and notes inside those zones.
- Zone groups, assignments, and collapse state persist after refresh.
- Tags with 2+ notes are shown as automatic signals with outlines and panel entries.

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

Expected:
- One line becomes one note near viewport center.
- Inline `#tags` are parsed into note tags.
- Clipboard multi-line input creates multiple notes.

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

## Vocabulary Review Workflow
1. Click `New Word` from `Tools` panel.
2. Select the new card and open `Details > Word Review`.
3. Fill `Word`, `Book context`, `Your guess`, and `Meaning`.
4. Click `Reveal Meaning` and verify meaning preview shows/hides.
5. Leave `Your sentence` empty and verify `Good`/`Easy` are disabled.
6. Add `Your sentence`, then click `Good`.
7. Verify `Due` count updates and card is no longer immediately due.
8. Click `Review Next Due` and verify camera jumps/selects the next due vocabulary card.
9. Grade a card as `Again` three times and verify `Focus` count increases.
10. Refresh page and verify vocabulary fields and review schedule persist.

Expected:
- Word cards capture reading context and personal examples in one place.
- Spaced review grades schedule future reviews and persist after refresh.
- Context lock prevents `Good`/`Easy` before writing a personal sentence.
- Repeated failures promote cards into `Focus` for targeted review.

## Smart Merge Suggestions
1. Create two notes with near-identical text and one unrelated note.
2. Open `Details` panel and expand `Smart Merge`.
3. Verify duplicate/similar suggestion appears with match score and note previews.
4. Click `Preview` on a suggestion and verify camera focuses both notes with dual selection.
5. Click `Merge`, confirm prompt, and verify merge note is removed.
6. Verify kept note combines tags/text as expected and remains selected.
7. If merged note had links or note-group membership, verify they now point to the kept note.
8. Press `Ctrl/Cmd + Z` once and verify the entire merge operation is undone in one step.

Expected:
- Smart Merge only proposes likely duplicates/similar notes from currently visible notes.
- Preview is non-destructive and centers the candidate pair.
- Merge is explicit (with confirmation), undoable as one grouped action, and preserves relationships.

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

## Presentation Polish - Narrative Paths
1. Enter presentation mode (`P`) on `/wall`.
2. In the presentation dock, click `New Path` and create a named narrative path.
3. Pan/zoom camera to first storytelling frame and click `Add Step`.
4. Enter talking points in the dock textarea.
5. Move camera to two additional frames and click `Add Step` for each.
6. Use `Prev` and `Next` in the dock (and arrow keys) to navigate steps.
7. On one step, move camera slightly and click `Update View`.
8. Verify talking points and camera framing stay attached to each step while navigating.
9. Click `Delete Step` and verify step list/index updates safely.
10. Exit presentation mode, refresh page, re-enter presentation mode, and reselect the path from dropdown.

Expected:
- Narrative paths persist locally with saved camera waypoints and step notes.
- Presentation navigation follows selected path steps when a path is active.
- `Update View` updates only the active step camera without creating duplicates.
- Deleting a step keeps navigation stable and never crashes at index boundaries.

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
2. Press `Ctrl/Cmd + K` for command palette.
3. Press `Ctrl/Cmd + L` with a selected note, then click target note to create a link.
4. Press `Ctrl/Cmd + Z` then `Ctrl/Cmd + Shift + Z`.
5. Press `Ctrl/Cmd + A` to select visible notes.
6. Press `T` and `H` to toggle time-based views.
7. Press `Delete` with selected note (and optionally selected zone/note group).
8. Press `?` to open shortcuts overlay.

Expected:
- All shortcuts work without needing mouse for command invocation.

## Accessibility Guardrail
1. On `/wall`, inspect quick-action toolbar buttons (`Text size`, `Pin`, `Highlight`, `Focus`, `Link`, align/distribute) and verify hit areas are at least ~36px.
2. Navigate the quick-action toolbar with keyboard only (`Tab`, `Shift+Tab`, `Enter`, `Space`) and verify every action is reachable/activatable.
3. Verify short-label buttons (`L/C/R/T/M/B`) and command button expose accessible names via screen reader/ARIA.

Expected:
- Toolbar controls satisfy minimum hit target size.
- Keyboard-only navigation can operate all primary quick actions.
- ARIA labels provide clear names for icon/abbreviated controls.

## Settings - Keyboard Color Slots
1. Open profile menu on `/wall` and click `Settings`.
2. In `Keyboard` section, set slot `1` and slot `2` to clearly distinct custom colors.
3. Click `Save settings`, return to `/wall`, select a note, press `C`, then press `1` and `2`.
4. Press `Shift + C` repeatedly and verify it cycles through configured (non-empty) slots.
5. Without pressing `C`, press `2` and verify no color is applied.
6. Return to `Settings`, clear slot `2`, save, then verify `C` + `2` no longer applies a color.
7. Refresh the page and verify slot changes persist.

Expected:
- `C` then `1-9` shortcuts follow configured keyboard slots from Settings.
- `Shift + C` cycles through currently configured slots only.
- Pressing `1-9` without first pressing `C` does not apply a slot color.
- Cleared slots are skipped/unavailable.
- Slot configuration persists after refresh.

## Command-First Toolbar and Context
1. Open `/wall` and verify top toolbar has reduced persistent controls (`Command`, panel toggles, `Capture`, `Present`, `Shortcuts`).
2. Press `Ctrl/Cmd + K` and verify both command actions and note search results are shown.
3. Type `/` in palette and verify only commands are shown.
4. Select 2+ notes and verify alignment/distribution controls appear in floating contextual toolbar near selection.
5. Verify contextual toolbar includes a `⌘K` action hint/button.
6. With no modal open, verify canvas hint appears: `Command-first: press Ctrl/Cmd + K`.

Expected:
- Always-visible chrome is lighter while critical actions remain reachable.
- Power actions are primarily executed through the command palette.
- Selection workflows are surfaced contextually near the selected notes.

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
5. Verify left/right side panels can be opened using top bar `Tools` / `Details` toggles.
6. Open each panel and use its `Close` button.

Expected:
- Control iconography is consistent across top bar and tools rail.
- Tooltips render for controls, with shortcut chips where available.

## IA Cleanup - Accordions, Minimal Context, Layout Preferences
1. Open `/wall` with default layout.
2. In the `Details` panel, verify `History`, `Recall`, `Zone Groups`, and `Tag Signals (Auto)` sections can each be expanded/collapsed independently.
3. Confirm `Templates` and `Selection Tags` remain visible without needing expansion.
4. Clear note selection and verify top `Context` bar is hidden.
5. Select one note and verify `Context` bar appears with only relevant controls (`Color`, `Tags`).
6. Select two or more notes and verify alignment/distribution controls appear.
7. Open `Settings > Advanced`, disable `Show Tools panel controls`, save, and verify `Tools` pill is hidden on `/wall`.
8. Disable `Show Details panel controls`, save, and verify `Details` pill is hidden on `/wall`.
9. Disable `Show context bar`, save, and verify context bar stays hidden even with selected notes.
10. Refresh the page and verify layout preferences persist.
11. Re-enable all related settings and verify full layout is restored.

Expected:
- Dense right-panel sections are organized with collapsible accordions.
- Context bar remains minimal and appears only when selection-dependent actions are relevant.
- Layout preference toggles persist across reloads and control panel visibility reliably.

## Wall UI Preferences in Settings
1. Open profile menu on `/wall` and click `Settings`.
2. Go to `Advanced`.
3. Toggle each option and click `Save settings`:
   - `Show Tools panel controls`
   - `Show Details panel controls`
   - `Show context bar`
   - `Show note tags on cards`
   - `Wall controls density` (`Basic` / `Advanced`)
4. Return to `/wall` and verify each saved preference applies.
5. Refresh `/wall` and verify preferences persist.
6. Verify `Tools` and `Details` pills remain visible in top toolbar when their respective settings are enabled.

Expected:
- Low-usage display toggles are configured in Settings, not top-level wall chrome.
- Wall respects saved layout and controls-density preferences.
- Settings changes persist across sessions.

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
10. With a note selected, click `Focus` in quick actions; verify canvas is dimmed and only the focused note remains visible. Click the `Focus mode` pill to exit.
11. With a note selected, click `Pin` then try drag/resize, align, and distribute; verify pinned note does not move or resize. Click `Pin` again to unpin.
12. Click `Highlight` and verify emphasized visual treatment appears without changing note content/position.

Expected:
- Editing and quick actions are faster and match modern canvas UX patterns.
- Snap guides and distance labels improve alignment confidence.
- Axis lock and alt-drag duplication work consistently.
- Tags render as compact chips with overflow handling.
- Hover/selected/dragging visual states are clearly distinct.
- Focus mode isolates one note with low-distraction context and exits cleanly.
- Pinned notes are visually anchored and protected from accidental movement.
- Highlighted notes remain easy to spot on dense boards.

## Spatial Affordances - Optional Guidance (2026-02-12)
1. Open `Tools` panel on `/wall`.
2. Click `Dot Matrix` and verify subtle low-opacity dot background appears.
3. Drag a note and verify snapping guides appear only while dragging (and disappear on release).
4. Toggle `Snap Guides` off, drag near note/zone edges, and verify note no longer auto-snaps to guide targets.
5. Toggle `Snap Grid` on, drag a note slowly, and verify position snaps to dot-grid spacing while dragging.
6. Create one of each zone type: `New Frame`, `New Column`, `New Swimlane`.
7. Verify each zone type renders distinct visual affordance (frame shell, tall column, horizontal swimlane tracks).
8. Place notes freely inside/outside zones and verify no forced constraint blocks manual layout decisions.
9. Refresh page and verify:
   - zone kinds persist
   - spatial toggles (`Dot Matrix`, `Snap Guides`, `Snap Grid`) persist
10. If cloud sync is enabled, sync and reload in another session to verify zone kinds persist across devices.

Expected:
- Spatial tools suggest structure without forcing it.
- Users can keep fully freeform placement at any time.
- Drag-time guidance is optional and reversible via toggles.
- Zone variants remain first-class persisted objects.

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
11. While signed in, set a note's `Horizontal align`, `Vertical align`, and `Text color`; wait for sync, then close browser, restart `npm run dev`, and reopen `/wall`.

Expected:
- `/wall` is protected for unauthenticated users.
- Sync status updates (`Syncing...`, `Last synced`) behave consistently.
- Cross-device sync works for create/edit/delete.
- Accounts remain isolated via RLS.
- Note formatting (`textAlign`, `textVAlign`, `textColor`) survives app/browser restarts and cloud rehydration.

## Cloud Sync Regression - Note Groups and Note State (2026-02-14)
1. Sign in on device A and create 3 notes.
2. Select 2 notes and create a `Note Group`.
3. Pin one grouped note and highlight the other.
4. Click `Sync now` and wait for `Last synced`.
5. Reload `/wall` on device A.
6. Sign in on device B with the same account and open `/wall`.
7. Verify note group exists with the same members.
8. Verify pinned note remains pinned (cannot drag/resize).
9. Verify highlighted note remains highlighted.
10. On device B, unpin/highlight toggle both notes, modify note-group membership, then click `Sync now`.
11. Refresh device A and verify changes propagate.

Expected:
- `noteGroups` persist through cloud sync and hydration.
- `pinned` and `highlighted` persist through cloud sync and hydration.
- Cross-device edits to note-group membership and note state converge after sync.

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
