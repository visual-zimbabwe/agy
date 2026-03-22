# Agy Manual QA Checklist

## Block Page Editor (`/page`) (2026-03-05)
1. Open `/page` and verify there is no fixed sidebar/top toolbar.
2. Click empty canvas on the left, center, and right; verify a new editable block appears exactly where clicked.
3. Confirm empty editable blocks show placeholder text `Type "/" for commands`.
4. Hold and drag empty canvas to pan.
5. Verify the dark workspace chrome appears around the canvas: slim top bar, left tool rail, and bottom status strip, while the canvas remains the main focus.
6. Click `New Text`, `Upload`, `Fit View`, left-rail tool buttons, and bottom zoom controls; confirm they trigger the expected canvas/editor actions without blocking panning or block editing.
5. Use `Ctrl/Cmd + mouse wheel` to zoom toward cursor.
6. Use mouse wheel (without `Ctrl/Cmd`) to pan viewport.
7. Drag any block to a new position and verify free placement on the infinite canvas.
8. In a text block, type `/h1`, `/h2`, `/h3`, `/todo`, `/bullet` (or `/list`), `/table`, `/quote`, and `/code` (one at a time), then press `Enter` and verify block type changes.
9. While slash menu is open, use `ArrowUp/ArrowDown` and `Enter` to select a command.
10. Press `Esc` with slash menu open and verify it closes.
11. In any text block, type `/file` then press `Enter`; verify file insert popover appears with `Upload` and `Paste URL` tabs.
12. In `/file` popover `Upload` tab, click `Choose a file`, upload a document, and verify a file block appears with file name + size metadata.
13. Refresh while the workspace stays unlocked and verify the uploaded file still opens and downloads correctly, confirming the encrypted file round-trip works.
14. In `/file` popover `Paste URL` tab, paste a URL (PDF, Drive file, or Maps URL) and verify an embedded file block appears with inferred title and `External` size label.
15. In any text block, type `/image` then press `Enter`; verify the image insert popover shows `Upload`, `Paste URL`, and `Unsplash` tabs.
16. In `/image` > `Unsplash`, search for a term, choose one result, and verify an inline image block is inserted with preview and attribution text.
17. In any text block, type `/cover` then press `Enter`; verify the cover insert popover opens with `Upload`, `Paste URL`, and `Unsplash` tabs.
18. In `/cover` > `Unsplash`, search for a term, choose one result, and verify the page cover updates above the document blocks and persists after refresh.
19. Type `/image`, `/video`, and `/audio` (one at a time), press `Enter`, and verify each opens the same two-option popover and inserts a specialized media block after upload/link.
20. Hover a file/media block and verify toolbar actions appear: `Caption`, `Comment`, `Download`.
21. Use hover toolbar `Caption`; verify caption is saved and shown under the file metadata.
22. Use hover toolbar `Comment`; verify comment thread is added to the target block.
23. Use hover toolbar `Download`; verify uploaded files download and embedded links open in a downloadable/openable target.
24. Verify slash command menu visual parity: compact light menu, left-side command symbols, right-side trigger hints, and `Close menu / esc` footer.
25. Open slash menu near each viewport edge and confirm it repositions (above/below and left/right) to stay visible while minimizing overlap with nearby canvas content.
26. Right-click empty canvas and click `Upload files here`; choose at least 2 files and verify each becomes its own movable file block.
27. Drag-and-drop multiple files from desktop onto canvas and verify each file inserts at drop area.
28. Upload at least one image file and verify inline image preview appears in its block.
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
37. In a text block, type `1. ` at line start and verify it converts to a numbered list item.
38. In a text block, type `a. ` and `i. ` at line start and verify both convert to numbered list items using alphabetic and roman markers.
39. Focus a block and press `Cmd/Ctrl + Shift + 6` (or `Cmd/Ctrl + Option + 6`); verify block converts to numbered list.
40. In block menu for a numbered item, open `List options`, switch among `1.`, `a.`, `i.`, and verify numbering style updates immediately.
41. In `List options`, set `Start at` to a value > 1 and verify the first numbered item in that sequence starts at the configured index.
42. In a numbered list item, press `Enter` in the middle of text and verify it splits into two numbered items at the caret.
43. In an indented list item, press `Backspace` at cursor start and verify it outdents first (instead of immediately converting to text).
44. Create a `/toggle` item and verify it renders with a collapse/expand chevron.
45. In a text block, type `> ` at line start and verify it converts to a toggle list item.
46. Focus a block and press `Cmd/Ctrl + Shift + 7` (or `Cmd/Ctrl + Option + 7`); verify block converts to toggle list.
47. With a toggle item focused, press `Cmd/Ctrl + Enter`; verify that toggle opens/closes.
48. Press `Cmd/Ctrl + Alt + T` and verify all toggle items expand when any are collapsed; press again and verify all collapse.
49. Create a `/toggle` item with nested children, collapse it, and verify all indented descendants are hidden; expand and verify they return.
50. Add inline markdown (`**bold**`, `*italic*`, `` `code` ``, links, `@mentions`) inside bulleted/numbered/toggle items and verify formatted preview appears when input is not focused.
51. Drag a block slightly right and below another block to nest it; verify indent and parent linkage persist after refresh.
52. Verify todo checkbox-to-text spacing is compact and consistent with Notion-style list density (no oversized gap).
53. In a quote block, verify default styling is visually distinct (larger italic text, left border, and indentation).
54. In a quote block, use `Ctrl/Cmd + B`, `Ctrl/Cmd + I`, and `Ctrl/Cmd + K`; verify bold/italic/link Markdown is inserted and quote preview reflects formatting.
55. Focus a block and press `Cmd/Ctrl + Shift + 8` (or `Cmd/Ctrl + Option + 8`); verify block converts to quote.
56. In quote text, include inline code and `@mention` tokens and verify quote preview renders both.
57. Click a block six-dot handle, choose `Color`, and verify quote text color and quote background color both update.
58. In a text block, type `"` followed by `Space` at the start of a new line and verify it converts to a quote block.
59. Highlight existing text in a block, click the six-dot handle, run `Turn into > Quote`, and verify selected text becomes a quote block.
60. With a quote block selected, press `Enter`; verify a standard text block appears immediately below with attribution starter (`-- `).
61. In a text block, type `--- ` and verify it converts to a divider block.
62. Type `/div` or `/divider` and press `Enter`; verify a divider block is inserted.
63. Focus a divider and press `Enter`; verify a text block is created below it.
64. Single-click a block six-dot handle and verify block menu opens immediately with actions: `Delete`, `Duplicate`, `Turn into`, `Turn into page`, `Copy link`, `Move to page`, `Comment`, and `Color`.
65. Drag a block from the six-dot handle (moving pointer beyond small threshold) and verify drag starts reliably without requiring hold delay.
66. Click the `+` icon next to the six-dot handle and verify an insert menu opens anchored near the block.
67. From the `+` insert menu, add `Text`, `Bulleted list`, `Toggle`, and `Divider`; verify each inserts below the source block.
68. From the `+` insert menu, choose `File`/`Image`/`Video`/`Audio`; verify file insert popover opens at the insertion point below the source block.
69. Press `Cmd/Ctrl + /` with a selected/focused block and verify block action menu opens for that block.
70. `Ctrl/Cmd`-click three block handles to multi-select, then hold and drag one selected handle; verify selected blocks move together.
71. In block menu, run `Duplicate` and verify exact copy appears below original.
72. In block menu, run `Delete` and verify block is removed.
73. In block menu, run `Turn into` to convert a text block to `Heading 2`, `To-do list`, `Numbered list`, `Toggle`, `Quote`, and `Divider`; verify type changes each time.
74. In block menu, run `Turn into page`; verify block is moved to a new `doc` route and a page-link block remains in the source page.
75. In block menu, run `Copy link`, paste in browser address bar, and verify it navigates to and focuses the target block.
76. In block menu, use `Move to page` search/typed id to move block to another doc; verify it is removed from source and appears in destination.
77. In block menu, run `Comment`; verify floating comment panel opens with composer (`Add a comment...`, attach, mention, send).
78. In comment panel, type text and verify send icon becomes active (blue), then post and verify new card shows author preferred name + `Just now`.
79. On posted comment, click the `...` menu and verify actions: `Mark as unread`, `Edit`, `Copy link`, `Mute replies`, `Delete`.
80. In `...` menu, click `Delete`; verify confirmation modal appears with `Delete` and `Cancel`, and deleting removes the comment.
81. Refresh browser and verify comments persist on their blocks.
82. In block menu, apply text color and background color and verify entire block styling updates.
83. Drag a block near another block's vertical lane and verify it snaps below (vertical rearrange behavior).
84. Drag a block far left/right across another block and verify side-by-side column placement snap occurs.
85. Drag a list block slightly right under another list block and verify it nests (indent increases).
86. Type `/table` and press `Enter`; verify a simple table block appears with editable cells.
87. In a table block, click `+ Row` and `+ Column`; verify row/column counts increase and new cells are editable.
88. In a table block, toggle `Header row` and `Header column`; verify first row/column switches to emphasized header styling.
89. Type `/code` and press `Enter`; verify a code block appears with language selector and `Wrap` toggle.
90. In code block hover controls, click `Copy`; verify block content is copied to clipboard.
91. In code block hover controls, click `Caption`, enter text, and verify caption appears under the code area and persists after refresh.
92. In code block, disable wrap, enter a long line, and verify horizontal scrolling; enable wrap and verify long line wraps within block width.
93. Type `/bookmark` (or `/web`) and press `Enter`; verify URL popover appears in link mode (no upload tab).
94. Paste a valid URL in bookmark popover and submit; verify a bookmark preview block is inserted and opens URL on click.
94a. After bookmark insertion, verify title/description/thumbnail metadata loads when available from target site.
95. Type `/video`, paste a YouTube/Vimeo embed URL, and verify video renders as an embedded frame when direct media source is unavailable.
96. Type `/audio`, paste an embeddable audio URL, and verify audio renders either native player (direct file URL) or embedded frame fallback.
97. Type `/embed` and verify an inline composer appears with URL input and `Create embed`.
98. Paste a YouTube or Vimeo URL into `/embed` composer, submit, and verify embedded preview renders with `Open original` link.

Expected:
- `/page` is an infinite, pannable, zoomable canvas with no fixed sidebar chrome.
- `/page` uses dark workspace chrome around the canvas with a top command bar, left tool rail, and bottom status strip that stay visible without obscuring core editing flows.
- `Type "/" for commands` appears at the active insertion point, not fixed to left side.
- Slash commands provide Notion-style block changes and keyboard navigation.
- Bulleted lists support slash, markdown, and `Cmd/Ctrl + Shift + 5` creation flows with proper continuation/indent/outdent/end-list behaviors.
- Numbered lists support markdown (`1. `), slash conversion, and caret-based split-on-enter behavior.
- Numbered lists support markdown markers (`1.`, `a.`, `i.`), keyboard shortcut conversion (`Cmd/Ctrl + Shift/Option + 6`), list format switching, and custom start index.
- `/table` creates a simple table block (non-database) with editable cells plus row/column and header toggles.
- `/code` creates a code block with language selection, wrap toggle, and hover actions for copy/caption.
- `Web bookmark` command inserts a link-preview style block from URL input and supports open/edit from block menu.
- Bookmark previews should show site metadata (title/description/image) when retrievable, with graceful fallback when unavailable.
- `/embed` creates an inline embed block that normalizes supported providers (YouTube/Vimeo/Figma/Docs) and renders iframe preview.
- Toggle lists support slash/markdown/keyboard creation, collapse/expand shortcuts, and descendant visibility persistence.
- Divider blocks support slash (`/div`/`/divider`) and markdown (`--- `) creation, and remain fixed to document block width on the infinite canvas.
- Slash command menu is visually compact and symbol-driven; command popup stays in viewport with reduced canvas obstruction.
- `/file`, `/video`, `/audio` open an insert popup with `Upload` and `Paste URL` flows.
- `/image` on `/page` opens `Upload`, `Paste URL`, and `Unsplash`; `/cover` opens the same source options for the page cover.
- Todo items support `Tab`/`Shift + Tab` nesting and un-nesting.
- Multi-line text selection supports one-shot conversion to todo checkboxes via `Ctrl/Cmd + (Option or Shift) + 4`.
- Quote blocks are visually distinct and support inline Markdown formatting shortcuts for bold/italic/link.
- Block handle menu supports `Turn into > Quote` and quote color controls for text/background.
- Quote conversion shortcut (`"` + `Space` at line start) works reliably.
- Six-dot handle single-click opens block actions immediately; dragging past threshold starts drag-and-drop without hold delay.
- Plus icon next to six-dot opens quick insert menu and inserts selected block types below the source block.
- `Cmd/Ctrl + /` opens block actions for the selected/focused block.
- Multi-selected blocks can be moved together from a handle drag.
- Block menu supports delete/duplicate/turn-into/page conversion/link copying/move-to/comment/color actions.
- File upload works via both picker and drag-drop, including multi-file insertion.
- Uploaded image files preview inline; non-image files render as file cards.
- File/media blocks support open/preview, download original, caption, comment, rename title, delete, and drag repositioning.
- Comment threads use card UI with preferred-name author attribution, `...` action menu, delete confirmation modal, and attach/mention/send composer.
- Page state (blocks + camera) persists after refresh.


## Web Bookmark Note (`/wall`) (2026-03-19)
1. Open `/wall`, open `Tools`, and click `New Bookmark`.
2. Verify a bookmark editor appears with a URL field and preview card shell.
3. Paste a bare domain such as `example.com`, submit, and verify it normalizes to `https://example.com`.
4. Paste a common rich URL such as a GitHub repo, YouTube video, article, or docs page and verify a preview card renders title, description, source/site name, badge, and updated state.\n4a. For the default bookmark note size, verify a rich site thumbnail appears in the card when the target page exposes `og:image` or `twitter:image`.
5. Verify a newly fetched bookmark note defaults to a compact horizontal card shape instead of a tall blank panel.\n6. Resize the note smaller and larger; verify compact, comfortable, and expanded layouts adjust gracefully.
7. Click the in-note `OPEN` action and verify the URL opens in a new tab without a full app reload.
8. Double-click the bookmark note and verify the bookmark editor opens again.
9. In `Details > Note Type`, convert a standard note to `Bookmark`, paste a URL, and verify it fetches metadata into the converted note.
10. In `Details > Bookmark`, click `Refresh` and verify the note refetches metadata without creating a duplicate note.
11. Reload `/wall` and verify bookmark metadata, status, last fetch state, and upgraded compact card dimensions persist.
12. If cloud sync is enabled, sync, reload, and verify the bookmark note still shows its preview data.
13. Try a broken or metadata-poor URL and verify the note falls back to a clean domain-first card plus readable error/retry state instead of a broken layout.\n14. Paste a YouTube or `youtu.be` URL and verify the non-edit card shows a real title and thumbnail even when raw page scraping is weak.

Expected:
- Web bookmark notes are creatable from `Tools` and from the details-side note type controls.
- Metadata fetches run through the backend preview route, not direct browser HTML scraping.
- Bookmark previews cache by normalized URL and do not refetch on every render.
- Compact, comfortable, and expanded card states remain polished on the wall and in preview surfaces.
- Invalid, missing, or partial metadata degrades gracefully without clipping or unsafe HTML rendering.

## NASA APOD Note (`/wall`) (2026-03-20)
1. Open `/wall`, open `Tools`, and click `New APOD`.
2. Verify a new APOD note appears and loads the current Astronomy Picture of the Day instead of a blank image card.
3. Verify the note shows the APOD title, date, and readable source metadata.
4. Open the command palette, run `Create APOD note`, and verify another APOD note is created at viewport center.
5. Press `Shift + A` and verify the same APOD note creation flow works from the keyboard.
6. Convert an existing standard note through `Details > Note Type > APOD` and verify it becomes an APOD note and fetches the latest APOD payload.
7. In the APOD floating editor, click `Refresh Now` and verify the note refetches data without creating a duplicate note.
8. Click `Open Source` and verify the NASA APOD page opens in a new tab.
9. Click `Download Image` and verify the current APOD image downloads locally with a readable filename.
10. Resize the APOD note smaller and larger, then zoom out and back in; verify the media remains sharp and uses a contained layout rather than stretching into a blurry crop.
11. Collapse back to the default note size and verify the image preview is still crisp.
12. Refresh `/wall` and verify the APOD note restores with its cached metadata and image.
13. If cloud sync is enabled, sync, reload, and verify the APOD payload still renders after hydration.
14. If the current APOD entry is a video, verify the note falls back to a usable thumbnail/image state and the card remains readable.
15. Leave the wall open across a date boundary or mock a new day, then trigger visibility/focus recovery and verify the APOD note updates to the new day instead of staying stale.

Expected:
- APOD notes are creatable from `Tools`, command palette, keyboard shortcut, and note-type conversion.
- APOD note data is fetched through the app backend using the configured NASA API key rather than from the browser directly.
- APOD notes auto-refresh for a new day, while manual refresh remains available.
- Downloaded APOD media is served as a local attachment through the backend.
- Expanded and contracted APOD notes keep the image crisp, fully visible, and unclipped on desktop and mobile-sized wall layouts.

## Joker Card (`/wall`) (2026-03-19)
1. Sign in with a fresh wall state and open `/wall`.
2. Verify a dedicated Joker card appears automatically.
3. Confirm it uses a bright green color not shared by regular notes and shows a JokeAPI-backed joke.
4. Delete the Joker card.
5. Click `New Joker` in the `Tools` panel and verify a new Joker card is created at viewport center.
6. Create one standard note, select it, click `Joker` in `Details > Note Type`, and verify that selected note becomes the Joker card when no Joker exists.
7. With a Joker card already on the wall, click `Refresh Joker` from `Tools` and verify the existing Joker note updates with a new joke instead of creating a second Joker card.
8. With the Joker card selected, click `Refresh Joker` in `Details > Note Type` and verify the joke refreshes again without changing the note count.
9. Create another standard note and verify it stays a normal standard note.
10. Try color shortcuts on a normal note and verify the Joker green is not applied.

Expected:
- Empty walls seed one Joker card automatically.
- After deletion, Joker recreation is explicit from `Tools` or the selected note's `Joker` note type action.
- If a Joker note already exists, Joker actions refresh that note instead of creating duplicates.
- The Joker color remains reserved for the Joker card.

## Throne Note (`/wall`) (2026-03-19)
1. Open `/wall` and verify no Throne note is created automatically on a fresh wall.
2. Click `New Throne` in the `Tools` panel and verify a dedicated Throne note appears at viewport center.
3. Confirm it uses the reserved red color `#FF2400` and shows a Game of Thrones quote.
4. Verify the note shows the speaking character and a house or source label.
5. Delete the Throne note.
6. Create one standard note, select it, click `Throne` in `Details > Note Type`, and verify that selected note becomes the Throne note when no Throne note exists.
7. With a Throne note already on the wall, click `Refresh Throne` from `Tools` and verify the existing Throne note updates with a new quote instead of creating a second Throne note.
8. With the Throne note selected, click `Refresh Throne` in `Details > Note Type` and verify the quote refreshes again without changing the note count.
9. Create another standard note and verify it stays a normal standard note.
10. Try color shortcuts on a normal note and verify the Throne red is not applied.

Expected:
- Throne note creation is explicit from `Tools` or the selected note's `Throne` note type action.
- If a Throne note already exists, Throne actions refresh that note instead of creating duplicates.
- The Throne color remains reserved for the Throne note.

## Wall Note Editing UI (`/wall`) (2026-03-16)
1. Open `/wall`, double-click a standard note to enter edit mode, and confirm no persistent formatting toolbar is shown before text selection.
2. Select a word or phrase inside the note and verify a compact toolbar fades in above the selection, centered on the highlighted text.
3. Click `Bold`, `Italic`, and `Underline`, then use `Ctrl/Cmd + B`, `Ctrl/Cmd + I`, and `Ctrl/Cmd + U`; verify formatting applies without leaving edit mode.
4. Select text, press `Ctrl/Cmd + K`, enter a URL, and verify link markup is inserted while focus returns to the editor.
5. Select text and click `Code`; verify inline code markup is inserted and the selection remains active.
6. With no text selected, confirm the contextual toolbar stays hidden.
7. Type `/` in an editing note and verify the slash menu opens below the caret.
8. Type `/quo`, `/jour`, `/todo`, and `/img` in separate checks; verify the command list filters as you type.
9. With slash menu open, use `ArrowUp/ArrowDown`, `Enter`, `Tab`, and `Esc`; verify keyboard navigation, command insertion, and dismissal all work.
10. Run `/text`, `/h1`, `/h2`, `/h3`, `/quote`, `/journal`, `/bulleted`, `/numbered`, `/toggle`, `/todo`, `/image`, `/video`, `/audio`, `/divider`, `/callout`, and `/code`; verify each command updates the note/editor with the expected style change, text scaffold, prompt flow, or image modal without breaking dragging, resizing, or saving after blur.
11. In a note, create `/bulleted`, `/numbered`, `/toggle`, and `/todo` lines, then press `Enter` at end-of-line, mid-line, and on an empty list line; verify bullets/toggles/tasks continue correctly, numbered items auto-increment, and empty list lines exit back to plain text.
12. With the caret on a list line, press `Tab` and `Shift + Tab`; verify list indentation and outdent behave predictably without leaving edit mode.
13. Open the slash menu and selection toolbar near viewport edges on desktop and mobile widths; verify they remain visible and are not clipped by surrounding wall UI.
14. Double-click a standard note with a custom background color, edit text, then blur the editor; verify the note keeps its background color while editing and after exiting edit mode. Repeat with a legacy note that has no stored color and verify it falls back to the default sticky-note yellow instead of rendering transparent.

Expected:
- Wall note editing feels contextual: no heavy always-on toolbar, only a compact selection toolbar when text is highlighted.
- Slash commands appear at the caret, filter live, and remain fully keyboard accessible.
- Formatting shortcuts work directly in the textarea without requiring toolbar interaction.
- Editor overlays stay in front of the note but do not interfere with note drag/resize behavior once edit mode exits.

## Wall Image Notes (2026-03-16)
1. Open /wall and create or select a note with an image URL.
2. Verify the image occupies the full card treatment and there is no empty body text area below it.
3. Check a landscape image and a portrait image; verify each keeps its original aspect ratio without cropping or stretching.
4. If the image note has no text, verify the card shows only the image.
5. Add text to the image note, then verify it renders as a subtle caption below the image with limited lines.
6. Click the image note body and verify it selects the card without opening a large text editor.
7. Click the caption text and verify a compact bottom caption editor appears.
8. Double-click the image note and verify image replacement/editing opens.

Expected:
- Image notes behave like media cards, with the image as the dominant content.
- Card height follows the image aspect ratio closely enough to avoid cropping and large dead space.
- Captions are optional, visually secondary, and edited through a compact caption UI instead of a full note body editor.

## Wall Image Insert Workflows (2026-03-16)
1. Open /wall, create or select a note, type /image, and verify an image insert modal opens instead of a browser prompt.
2. Verify the modal exposes `Upload`, `Paste URL`, and `Unsplash` tabs.
3. In `Upload`, click Select File and upload PNG, JPG/JPEG, WEBP, and GIF files in separate checks; verify each inserts successfully.
4. In `Upload`, drag an image file onto the drop zone and verify it inserts without using the file picker.
5. In `Paste URL`, paste a valid remote image URL and verify it inserts successfully.
6. In `Unsplash`, search for a term, choose one result in `Single` mode, and verify the note image updates or a new image note is created.
7. In `Unsplash`, switch to `Moodboard`, select 3-10 results, insert them, and verify a clustered set of image notes appears near the target area.
8. Copy an image to the clipboard, select a note, press Ctrl/Cmd + V, and verify the selected note updates with the pasted image.
9. Copy an image to the clipboard with no note selected, press Ctrl/Cmd + V, and verify a new image note appears near the viewport center.
10. Drag an image file onto empty canvas space and verify a new image note is created at the drop point.
11. Drag an image file onto an existing note and verify that note's image is replaced.
12. While dragging an image file over the wall, verify the drag overlay appears and stays fully visible in the viewport.

Expected:
- Image insertion supports upload, drag/drop, clipboard paste, direct URL entry, and Unsplash search.
- Unsplash moodboard insertion creates 3-10 image notes in one clustered placement.
- Uploads create an immediate local preview and route through the same image-note rendering path as URL images.
- Dropping on empty canvas creates a new image note; dropping on an existing note replaces its image.
- The insert modal feels like a proper wall UI panel, not a browser alert or prompt.
## Electron Desktop Packaging (2026-02-18)
1. In `agy-studio`, run `npm install`.
2. Run `npm run dist`.
3. Verify installer exists at `agy-studio/release/Agy-Setup-0.1.0.exe`.
4. Launch unpacked app from `agy-studio/release/win-unpacked/Agy.exe`.
5. Verify routes work in desktop app:
   - `/` landing loads
   - `/wall` loads and note interactions work
   - `/page` loads and canvas interactions work
   - `/decks` loads and study workspace renders
   - `/settings` loads after sign-in
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
12. Switch to dark mode on `/decks` and verify deck backgrounds, panels, badges, and modal surfaces render as pure `#000000`, while text and status/icon indicators remain readable.
13. Verify Decks behavior in Electron app build (`agy-studio`) by opening `/decks`, adding one note, and reviewing one card.

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
7. Switch to dark mode, reopen the quote note editor, and verify `Author`, `Source`, and tag input text remains readable while typing and when placeholders are visible.
8. Select a note that uses a light or custom text color, then create another `New Quote` note and verify the new quote still starts with the default readable text color.

Expected:
- Quote notes render with quote styling and attribution footer.
- Author/source attribution persists after refresh.
- Command palette note search matches quote body, author, and source.
- Quote/standard conversion works without losing core note content.
- Dark mode keeps quote attribution and tag editor text/placeholder contrast readable.
- New quote notes do not inherit unreadable text colors from the previously selected note.

## Journal Notes
1. In `/wall`, click `New Journal` from the Tools panel, use `Shift + J`, or run `Create journal note` from the command palette.
2. Verify the new note appears with a warm paper tone, subtle notebook lines, and a handwritten date in the top-right.
3. Double-click the `Journal` note, confirm the editor keeps the lined-paper surface, and enter a multi-line entry.
4. Resize the `Journal` note taller and shorter; verify the writing lines and text spacing remain readable.
5. Drag the note, zoom in/out, blur the editor, then refresh the page.
6. Select a standard note, use `More > Convert to Journal`, and verify the notebook styling and handwritten defaults apply without breaking note text.

Expected:
- Journal notes render like a lightly torn exercise-book page with subtle lines and minimal shadow.
- The top-right date is underlined and persists after refresh.
- Editing, dragging, resizing, selection, and zoom readability behave the same as other notes.
- Standard-to-Journal conversion preserves content while applying Journal styling defaults.

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
2. Verify a backup file is downloaded (filename starts with `agy-backup-`).
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
9. Pan to a crowded part of the wall, press `N` several times, create at least one typed note from the command palette, and paste an image with no note selected.

Expected:
- All shortcuts work without needing mouse for command invocation.
- Newly created notes stay fully inside the visible viewport and do not overlap existing notes when an empty slot is available in-frame.

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
6. Sign out, sign back in with the same account, open `/wall`, and verify the saved settings still apply.
7. Verify `Tools` and `Details` pills remain visible in top toolbar when their respective settings are enabled.

Expected:
- Low-usage display toggles are configured in Settings, not top-level wall chrome.
- Wall respects saved layout and controls-density preferences.
- Settings changes persist across refresh and signed-in sessions.

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
- Sync status updates (`Saving...`, `Synced`, `Offline`, `Error`) behave consistently through edit, offline, recovery, and retry flows.
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
3. Inspect `localStorage["agy-ux-telemetry-v1"]` in DevTools.
4. Export JSON backup from `Export` modal, then import it back.

Expected:
- Unit tests include storage migration and backup compatibility coverage.
- Telemetry snapshot persists local/dev UX timings for:
  `initialInteractMs`, `toolsPanelOpenMs`, `detailsPanelOpenMs`, `searchOpenMs`, `exportOpenMs`, `shortcutsOpenMs`.
- Backup export/import remains compatible with current and legacy-shaped snapshots.


## Horizontal Timeline View
1. Open `/wall` and create or load several notes with different creation times, including at least one journal note, one quote note, one image note, and one Eisenhower Matrix note.
2. Click `Timeline View` in the top toolbar or press `V`.
3. Verify notes render as faithful note cards instead of generic text blocks, and confirm journal notes keep their lined-paper structure while Eisenhower Matrix notes keep a visible four-quadrant layout.
4. Switch `Sort` between `Created Date` and `Last Edited` and verify card order/date chips change accordingly.
5. Switch `Card Size` among `Small`, `Medium`, and `Large` and verify preview depth changes without breaking note identity or clipping important content.
6. Switch `Zoom` among `Overview`, `Standard`, and `Detail`, then use `Ctrl/Cmd + 0` for `Fit All` and `Ctrl/Cmd + +/-` to zoom; verify spacing updates smoothly.
7. Toggle `View Mode` between `Stream` and `Buckets`, switch `Group By` among `Day`, `Week`, and `Month`, and verify section labels, bucket backgrounds, and counts remain readable.
8. Change `Range` among `7D`, `30D`, `90D`, `1Y`, and `All`; verify the note set updates to the expected time window.
9. Use `Earliest`, `Today`, `Latest`, `Selected`, and `Fit All`; verify each action scrolls to the correct point in time.
10. Scroll with the mouse wheel, hold `Shift` while scrolling, and use trackpad pinch or `Ctrl/Cmd + +/-`; verify horizontal panning and zooming behave as labeled.
11. Use `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`, `Home`, and `End` to move between notes and buckets.
12. Drag or click across the bottom scrubber and verify the density graph, selected marker, and note selection stay in sync.
13. Select a note and verify the detail panel shows a fuller preview with readable timestamps, tags, and a prominent `Reveal on Wall` action.
14. Double-click a timeline card or click `Reveal on Wall` and verify the app returns to the wall canvas focused on that note.
15. Toggle the app between light and dark themes and verify the timeline background is pure white in light mode and pure black in dark mode, with controls, borders, and text remaining legible.

Expected:
- Timeline view provides a read-only horizontal chronology that preserves note-type identity.
- Journal and Eisenhower Matrix notes remain recognizable in both cards and the detail panel.
- `Sort`, `Card Size`, `Zoom`, `Group By`, `View Mode`, and `Range` are understandable without guesswork.
- `Fit All`, quick jumps, keyboard navigation, and the density scrubber all move through time predictably.
- Bucket sections, rhythm lines, and selection styling make chronology easy to read at a glance.
- Dark mode uses `#000000` as the main timeline background and light mode uses `#FFFFFF`.
- Timeline cards, scrubber, tooltips, and detail panel remain fully visible and usable on desktop and mobile-sized viewports.
- `Reveal on Wall` exits timeline view and restores note focus in the canvas.
## Wiki Links and Backlinks (`/wall`) (2026-03-16)
1. Open `/wall`, create at least three notes with distinct first-line titles.
2. Edit one note and type `[[`; verify a suggestion menu appears at the caret with existing note titles.
3. Use `ArrowUp/ArrowDown`, `Enter`, `Tab`, and `Esc`; verify keyboard navigation selects a suggestion and closes the menu correctly.
4. Type a partial title inside `[[...` and verify the list filters live.
5. Select an existing note suggestion and blur the editor; verify a structural link is created and the source note shows a muted wiki-link chip.
6. Type `[[Brand New Linked Note]]`, blur the editor, and verify a new note is created automatically and linked from the source note.
7. Click a wiki-link chip on the source note and verify the target note becomes selected and the camera pans/zooms to reveal it.
8. Move the target note off-screen, click the wiki-link chip again, and verify navigation still centers it intelligently.
9. Select the target note and open `Details`; verify a `Backlinks` section lists the source note.
10. Click a backlink entry in `Details`; verify focus jumps back to the referring note.
11. Remove a `[[Linked Note]]` token from the source text, blur the editor, and verify the corresponding wiki-link chip and backlink disappear.
12. Refresh the page and verify wiki links and backlinks persist.

Expected:
- `[[Note Title]]` text creates structural wiki links rather than relying on raw text alone.
- Suggestions open as soon as `[[` is typed, remain keyboard-accessible, and stay fully visible near viewport edges.
- Missing wiki-linked titles create new notes automatically on commit.
- Wiki-link chips are visually distinct but subdued, matching the note/editor palette.
- Clicking a wiki link or backlink selects the target note and intelligently reveals it on the canvas.
- Backlinks always reflect the current structural wiki-link graph after edits and refresh.
## Wall Navigation - Zoom to Fit and Zoom to Selection (2026-03-16)
1. Open `/wall` with several notes spread far apart and at least one zone.
2. Trigger `Zoom to fit all content` from the command palette and verify the camera animates to frame all visible notes/zones with padding.
3. Click the `Fit` action in the floating zoom controls and verify it reaches the same framed result.
4. Select one note, trigger `Zoom to selection`, and verify the camera animates to frame that note with breathing room.
5. Box-select or multi-select several notes, trigger `Zoom to selection` again, and verify the full selection stays visible.
6. Clear selection and verify the `Zoom to selection` command is disabled and the `Sel` zoom-control button is disabled.
7. Start a fit/selection animation, then immediately pan or wheel-zoom manually; verify manual input cancels the animation cleanly.

Expected:
- `Zoom to fit` frames all visible notes and zones with consistent outer padding.
- `Zoom to selection` frames the currently selected notes only.
- Camera movement is eased rather than jumping, and manual pan/zoom interrupts the animation immediately.
- Navigation actions are reachable from both the command palette and the floating zoom controls.

## Wall Quote Note Details Sidebar (2026-03-16)
1. Open `/wall` and select a quote note.
2. Open the `Details` sidebar and verify a `Quote Details` section is visible.
3. Edit `Author` and `Source` in that section.
4. Click away and reselect the note.
5. Verify the quote metadata remains populated.

Expected:
- Selected quote notes expose editable `Author` and `Source` fields in the details sidebar.
- Changes persist like other note metadata edits.


## Details Sidebar Premium Layout (2026-03-16)
1. Open `/wall` in dark mode and open the `Details` sidebar.
2. Verify the panel header stays visible while scrolling and every section uses dark surfaces with no white or light cards.
3. Expand `Recall`, `Word Review`, `Zones`, and `Smart Merge`, then scroll to the bottom and verify the last control is fully reachable with padding beneath it.
4. Keep `Details` open and verify the floating zoom controls remain visible and clickable rather than sitting underneath the panel.
5. Reduce the viewport height and verify the panel body still scrolls cleanly and all expanded sections remain reachable.
6. Collapse and re-expand multiple sections and verify their open/closed state is preserved while the sidebar remains open.

Expected:
- The entire Details sidebar respects the dark theme, including nested cards, inputs, selects, buttons, and empty states.
- The header remains sticky while the body scrolls independently.
- Bottom sections such as `Smart Merge` are never clipped or hidden behind the panel edge.
- Floating zoom controls shift clear of the open Details sidebar and remain usable on smaller screens.
- Section grouping, spacing, and summaries make the sidebar faster to scan than the previous stacked-form layout.

## Eisenhower Matrix Note (`/wall`) (2026-03-17)
1. Open `/wall`, create an `Eisenhower Matrix` note from the tools panel, and verify it appears as a single four-quadrant card.
2. Open the command palette with `Ctrl/Cmd + K`, run `Create Eisenhower Matrix note`, and verify a second matrix note is created at viewport center.
3. Press `Shift + E` and verify the keyboard shortcut creates a new matrix note.
4. Verify the note header shows a date like `Tuesday, March 17` in the top-left and an `Eisenhower Matrix` badge/title in the card header.
5. Click each quadrant (`Do First`, `Schedule`, `Delegate`, `Delete`) and verify the matrix editor opens with the clicked quadrant focused.
6. Edit all four quadrant titles and enter multiline content in each quadrant; click away and verify content persists.
7. Refresh the page and confirm the matrix note, date label, titles, and quadrant content restore correctly.
8. Resize the matrix note smaller and larger; verify the 2x2 layout stays usable, long text wraps, and compact mode still reads clearly.
9. Zoom out and back in; verify the note remains legible enough when compact and returns to the full premium layout when larger.
10. Leave some quadrants empty and fill others heavily; verify placeholders, spacing, and footer task counts still look balanced.
11. Switch light/dark theme if available in the current workspace and verify the floating editor remains readable and focus states stay visible.
12. If wall sync is enabled for the current user, reload from cloud-backed state and verify the matrix payload survives round-trips.

Expected:
- Eisenhower Matrix notes can be created from the UI, command palette, and keyboard shortcut.
- The note renders as one polished card with four clearly labeled, independently editable quadrants.
- Date, footer task count, compact mode, and persistence behave like native wall features rather than an add-on.




## Poetry Note (`/wall`) (2026-03-20)
1. Open `/wall`, open `Tools`, and click `New Poetry`.
2. Verify a new Poetry note appears with the reserved `#B73A3A` color and a loading state before the poem resolves.
3. Verify the note loads a poem title, poet name, and wrapped body text from PoetryDB.
4. Confirm the note height adapts so the full poem text is visible without manual resize when the poem first loads.
5. Open the command palette, run `Create Poetry note`, and verify another Poetry note is created at viewport center.
6. Convert an existing standard note through `Details > Note Type > Poetry` and verify it becomes a Poetry note with the reserved styling.
7. With the Poetry note selected, open `Details > Poetry Search`, choose `Author`, enter a poet such as `Emily Dickinson`, and click `Search Poetry`; verify the note updates to a matching poem and the search selection persists when you reselect the note.
8. Change the search method to `Title`, enter a known title, switch match mode between `Partial` and `Exact`, and verify the fetched result follows the chosen criteria.
9. Click `Reset to Random` and verify the note returns to random-daily search behavior.
10. Open the Poetry floating editor and click `Refresh Poetry`; verify the note refreshes using the note's saved search method rather than always falling back to random.
11. Click `Download Image` and verify a PNG export downloads with poem title and poet metadata.
12. Click `Download PDF` and verify a PDF export downloads with the same poem content.
13. Refresh `/wall` and verify the Poetry note restores with the cached poem metadata, text, and saved Poetry search settings.
14. If cloud sync is enabled, sync, reload, and verify the Poetry payload and saved search settings still render after hydration.
15. Simulate a local date change or wait until the next day, then reopen `/wall`; verify the Poetry note auto-refreshes using the same saved search method for the new local date.

Expected:
- Poetry notes are creatable from `Tools`, the command palette, and note-type conversion in `Details`.
- Poetry text wraps cleanly inside the note and the default note size grows to fit the poem on first load.
- The details sidebar exposes Poetry-only search controls for random, author, title, line text, and line count lookups.
- Poetry notes auto-refresh on local day changes and manual refresh reuses the note's saved search method without creating duplicate notes.
- Poetry notes can be exported directly as PNG or PDF from the floating editor.
- The reserved Poetry color remains fixed and persists through refresh and sync.

## Economist Cover Note (`/wall`) (2026-03-20)
1. Open `/wall`, open `Tools`, and click `Magazine Covers`.
2. Verify five warm-paper magazine-cover notes appear near viewport center, one each for `The Economist`, `Barron's`, `The New Yorker`, `Newsweek`, and `Forbes`.
3. Verify each note loads a cover image and shows the correct magazine title plus issue label instead of all notes collapsing to `The Economist`.
4. Open the command palette, run `Create magazine cover notes`, and verify another full set of magazine-cover notes is created near viewport center.
5. Press `Shift + M` and verify the keyboard shortcut creates another full set of magazine-cover notes.
6. Delete one source from the multi-cover set, then convert an existing standard note through `Details > Note Type > Magazine Cover` and verify it recreates the first missing magazine source instead of defaulting back to Economist.
7. In `Details`, change `Magazine Source` on that selected note to `Barron's`, verify only that note switches source, and verify it refreshes to the latest Barron's cover without changing the other magazine notes.
8. Use `Refresh Cover` and `Open Source` in `Details` for the selected note, then verify the refresh only affects that note and the source link opens the correct archive page for the chosen magazine.
9. Refresh `/wall` while signed in and verify existing magazine-cover notes automatically refresh against their own sources on hydration/login.
10. Duplicate a non-Economist magazine-cover note and verify the duplicate keeps the reserved styling, then refresh it and verify it still resolves the same magazine source.
11. If cloud sync is enabled, sync, reload, and verify the magazine-cover notes still render their cover images and source/date metadata after hydration.
12. Resize the notes smaller and larger on desktop and mobile-sized viewports; verify the cover image remains visible, floating controls stay on-screen, and nothing clips against viewport edges.

Expected:
- The multi-cover action creates one Economist-shell note per magazine source exposed by the local API.
- The note uses the local backend proxy routes rather than calling the local cover API directly from the browser.
- Sign-in or wall hydration refreshes existing magazine-cover notes against their own sources automatically.
- `Details > Note Type > Magazine Cover` prefers the first missing magazine source on the wall when recreating a deleted cover.`r`n- The Details `Magazine Source` picker lets a single selected note switch to a different magazine source without recreating the full set.
- Manual refresh updates the existing note in place without cross-overwriting other magazine notes.
- Cover imagery, source actions, and floating editors remain fully visible on desktop and mobile layouts.
## Currency Note (`/wall`) (2026-03-19)
1. Open `/wall` and verify one indigo `Currency` system note is present near the top-left of the wall.
2. Refresh the page and verify the note still exists.
3. Drag the currency note to a new position, refresh, and verify the new position persists.
4. Try delete flows: keyboard `Delete`, quick actions, duplicate shortcuts, and note merge flows; verify the currency note is not removed, duplicated, or merged away.
5. Verify the note shows the detected or fallback base currency and a `1 <base> -> USD` rate.
6. Verify the note also shows the USD value for `1000` units of the base currency.
7. Open the currency editor, enter a converter amount, and verify the USD output updates instantly.
8. Change the base currency manually to another ISO code such as `CAD`, `EUR`, or `GBP`; verify the note refreshes against USD.
9. Click `Use detected` and verify the note returns to the detected/fallback currency.
10. Click `Refresh` repeatedly and verify requests are debounced rather than spamming duplicate refreshes.
11. Deny geolocation permission, reload `/wall`, and verify the note falls back to IP-based lookup or USD without crashing.
12. Simulate offline or API failure, reload, and verify the note falls back to cached/default values with a readable error state.
13. Switch between light and dark theme and verify the indigo identity remains readable with strong contrast in both.
14. On mobile and desktop widths, verify the currency editor, badges, and floating UI stay fully visible and are not clipped by viewport edges or other wall chrome.

Expected:
- The wall always contains exactly one permanent currency system note.
- The note can be moved but not deleted, duplicated, hidden, or merged away.
- Location detection degrades from geolocation to IP lookup to USD fallback cleanly.
- Exchange-rate fetches are lazy, cached, debounced, and recover gracefully from API failures.
- The note remains legible and premium-looking in both light and dark themes.









## Private Notes (`/wall`) (2026-03-21)
1. Open `/wall`, create a standard note, add visible text, then choose `Details > Privacy > Protect note`.
2. Enter and confirm a passphrase; verify the note switches to a locked private shell and the original text no longer shows on the wall.
3. Click the locked note and verify the unlock modal appears instead of the text editor.
4. Enter the wrong passphrase and verify the note stays locked with an error message.
5. Enter the correct passphrase and verify the note opens in the editor with its original text.
6. Edit the unlocked note, blur the editor, refresh `/wall`, and verify the note returns as a locked shell while the edited text is restored after unlocking again.
7. Wait at least five minutes without interacting, or hide the tab and return; verify the unlocked note auto-locks and the editor closes.
8. Search for text that exists only inside the private note and verify it does not appear in search results while the note is locked.
9. Export Markdown and verify the private note is listed as hidden content rather than exporting plaintext.
10. In `Details > Privacy`, unlock the note, click `Remove protection`, and verify the plaintext note body returns and can be searched again.
11. If cloud sync is enabled, sync, reload, and verify the private note remains locked on reload and can still be opened with the same passphrase.

Expected:
- Private notes behave like sealed note shells on the wall and never render plaintext while locked.
- Passphrases unlock private notes only for the active browser session and are not persisted with the wall snapshot.
- Search, Markdown export, and wiki-link generation exclude locked private note content.
- Refreshing, syncing, hiding the tab, or letting the unlock session expire does not lose encrypted note contents.

## Confidential Workspace Migration

1. Open `/wall` and verify the confidentiality gate appears before normal wall persistence starts.
2. In create mode, toggle `Show passphrase` on and off and verify both passphrase fields switch visibility without changing their values.
3. After the workspace is created, refresh, return to unlock mode, toggle `Show passphrase while unlocking`, and verify the unlock field switches visibility without changing its value.
4. Create a passphrase and confirm the wall unlocks.
5. Reopen the confidentiality gate after a refresh and verify it only offers unlock, not passphrase recreation, for an existing workspace.
6. Add or edit notes, refresh the page, unlock again, and verify wall content restores.
7. Open Export and run `Export Encrypted Backup`. Verify the downloaded file uses encrypted envelope fields rather than readable wall JSON.
8. Import the encrypted backup and verify the wall restores without errors.
8a. In Export, run `Export Legacy Wall JSON`, confirm the warning, and verify the downloaded file is readable wall JSON rather than an encrypted envelope.
8b. In a build based on commit `6bf2013`, import that legacy file and verify notes, zones, camera state, and private-note ciphertext shells restore without format errors.
9. Attempt `Public Sharing Disabled` and verify the app blocks URL sharing.
10. Export PNG, PDF, and Markdown and verify each action warns that it creates a readable copy.
11. Enter a wrong replacement passphrase for an already-encrypted workspace and verify the app relocks into a recovery notice instead of crashing with a crypto error.
12. Retry with the original passphrase and verify unlock succeeds immediately, the local config is repaired from ciphertext validation, and the recovery notice clears.
13. Enter another incorrect passphrase after recovery and verify the gate rejects it before the wall loads with a sync error banner.
14. In unlock mode, run `Run local recovery diagnostic` and verify it reports whether encrypted wall and page snapshots exist on the current device, shows the archived wall recovery snapshot count, and still works even when the gate only shows an inline passphrase error.
15. Open `/page`, unlock with the same passphrase, create or edit blocks, refresh, unlock again, and verify page content restores.
16. If cloud sync is configured with the latest migration, verify wall and page continue to load after a second refresh.

Expected results:

- Wall and page persistence remain blocked until unlock.
- Local restore works through encrypted snapshot storage.
- Encrypted backup export/import works.
- Legacy rollback export produces a readable wall backup that the pre-confidential private-note build can import.
- Public snapshot links are disabled.
- Readable exports require confirmation.
- Existing content remains accessible after migration.


