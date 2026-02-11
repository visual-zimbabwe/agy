# Idea-Wall Manual QA Checklist

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
1. Select a note and add two tags via the `Tags` input in the top bar.
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
5. If browser supports speech recognition, click `Voice to Notes`, speak two short lines, stop, then capture.

Expected:
- One line becomes one note near viewport center.
- Inline `#tags` are parsed into note tags.
- Clipboard multi-line input creates multiple notes.
- Voice transcripts are appended into quick-capture text and can be captured as notes.

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

Expected:
- Undo restores previous states reliably.
- Redo reapplies undone states.
- New edits after undo clear redo stack (recovery safety against branching confusion).

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

## Usability Polish - Icons, Tooltips, Responsive Panels
1. Open `/wall` on desktop width (>= 1200px).
2. Verify top bar controls display icon + label pairs with tighter spacing.
3. Hover each top bar control and verify tooltip text appears; confirm shortcut hints show for:
   `Search`, `Capture`, `Undo`, `Redo`, `Present`, `Timeline`, `Heatmap`, `Keys`.
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
