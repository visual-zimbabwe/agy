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
13. In `/file` popover `Paste URL` tab, paste a URL (PDF, Drive file, or Maps URL) and verify an embedded file block appears with inferred title and `External` size label.
14. In any text block, type `/image` then press `Enter`; verify the image insert popover shows `Upload`, `Paste URL`, and `Unsplash` tabs.
15. In `/image` > `Unsplash`, search for a term, choose one result, and verify an inline image block is inserted with preview and attribution text.
16. In any text block, type `/cover` then press `Enter`; verify the cover insert popover opens with `Upload`, `Paste URL`, and `Unsplash` tabs.
17. In `/cover` > `Unsplash`, search for a term, choose one result, and verify the page cover updates above the document blocks and persists after refresh.
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

## File Note (`/wall`) (2026-03-26)
1. Open `/wall`, open `Tools`, and click `New File`.
2. Verify a compact file card appears using the dedicated document-card shell rather than a generic sticky note.
3. Double-click the file note and verify the floating editor opens with `Upload` and `Paste URL` tabs plus the same file-card preview.
4. In the floating editor `Upload` tab, choose a local PDF or document and verify the note updates with the file name, inferred document metadata, and download action.
5. Click the download affordance on the card and verify the uploaded file downloads with a readable filename.
6. In the floating editor `Paste URL` tab, paste a direct file URL or share link, save it, and verify the note keeps the filename-style title plus uppercase metadata row.
7. Click `Open` for the link-backed file note and verify it opens in a new tab.
8. Select a standard note, go to `Details > Note Type`, click `File`, and verify the current note converts into the file-note shell without creating a duplicate note.
9. In `Details > File`, upload a local file and verify the converted note updates immediately.
10. In `Details > File`, paste a URL, click `Save Link`, and verify the note keeps the linked file state after blur.
11. Refresh `/wall` and verify uploaded and link-backed file notes restore correctly.
12. If cloud sync is enabled, sync, reload, and verify the file note payload still renders after hydration.

Expected:
- File notes are available from both `Tools` and `Details > Note Type`.
- File notes support local-device upload and link-backed file creation without breaking other note kinds.
- The non-edit shell matches the new document-card frontend: filename-first layout, muted uppercase metadata, and a visible download or open affordance.
- File-note overlays remain visible and unclipped on desktop and mobile wall layouts.

## Code Note (`/wall`) (2026-03-28)
1. Open `/wall`, create or convert a note that starts with a fenced code block such as ```py plus a few lines of Python.
2. Verify the wall note renders as the dark editor-card shell instead of a plain paper note.
3. Verify the top chrome shows the three traffic-light dots on the left, an uppercase filename on the right, and a copy-style glyph.
4. Verify the code body uses a monospace font with syntax-tinted lines rather than plain paragraph text.
5. Open timeline view for the same note and verify it keeps the same dark editor-card shell because timeline reuses the wall renderer.

Expected:
- Code notes on `/wall` use the dark editor-card frontend rather than the default paper note shell.
- The code-note shell includes editor chrome, uppercase filename treatment, and syntax-colored code lines.
- Timeline copies match the same wall-rendered code-note frontend.
## Audio Note (`/wall`) (2026-03-26)
1. Open `/wall`, open `Tools`, and click `New Audio`.
2. Verify an audio card appears using the dedicated audio card frontend: icon tile, serif title, terracotta waveform, and top-right download/open actions.
3. Double-click the audio note and verify the floating editor opens with `Upload` and `Paste URL` tabs plus the same audio-card preview.
4. In the floating editor `Upload` tab, choose a local audio file and verify the note updates with the audio title, metadata, and duration-aware footer when available.
5. Click the in-note download action and verify the uploaded audio downloads with a readable filename.
6. In the floating editor `Paste URL` tab, paste a direct audio URL, save it, and verify the note keeps the audio-card layout with link-backed metadata.
7. Click the in-note open action for the link-backed audio note and verify it opens in a new tab.
8. Select a standard note, go to `Details > Note Type`, click `Audio`, and verify the current note converts into the audio-note shell without creating a duplicate note.
9. In `Details > Audio`, upload a local audio file and verify the converted note updates immediately.
10. In `Details > Audio`, paste an audio URL, click `Save Link`, and verify the note keeps the linked audio state after blur.
11. Use `Open Audio` and `Download Audio` from `Details` and verify both actions work for the current source mode.
12. Refresh `/wall` and verify uploaded and link-backed audio notes restore correctly.
13. If cloud sync is enabled, sync, reload, and verify the audio note payload still renders after hydration.

Expected:
- Audio notes are available from both `Tools` and `Details > Note Type`.
- Audio notes use the dedicated audio frontend in both the Konva wall renderer and the React preview/editor surfaces.
- Audio note uploads and link-backed notes both persist through local storage and cloud sync.
- Open/download actions remain visible and usable without clipping on the wall or in floating/details editors.

## Video Note (`/wall`) (2026-03-26)
1. Open `/wall`, open `Tools`, and click `New Video`.
2. Verify a poster-led video card appears using the new editorial video frontend: large media preview, centered terracotta play button, duration rail, filename footer, and open/download affordances.
3. Double-click the video note and verify the floating editor opens with `Upload` and `Paste URL` tabs plus an inline playable video preview.
4. In the floating editor `Upload` tab, choose a local video file and verify the note updates with the video filename, metadata, generated poster, and duration when available.
5. Rename the video in the floating editor and verify the filename footer updates without breaking playback or download.
6. Click the play affordance on the wall card and verify the poster swaps into an inline playable video on the note without opening the editor.
7. Click the in-note download action and verify the uploaded video downloads with the renamed filename.
8. In the floating editor `Paste URL` tab, paste a direct video URL or embeddable provider URL such as YouTube, save it, and verify the note keeps the video-card layout with link-backed metadata and playable preview.
9. Click `Open Video` for the link-backed video note and verify it opens the target video URL in a new tab.
10. Select a standard note, go to `Details > Note Type`, click `Video`, and verify the current note converts into the dedicated video-note shell without creating a duplicate note.
11. In `Details > Video`, upload a local video, then rename it, and verify the converted note updates immediately.
12. In `Details > Video`, paste a direct video URL, click `Save Link`, and verify the note keeps the linked video state after blur.
13. Use `Open Video` and `Download Video` from `Details` and verify both actions work for the current source mode.
14. Refresh `/wall` and verify uploaded and link-backed video notes restore correctly, including poster and filename.
15. If cloud sync is enabled, sync, reload, and verify the video note payload still renders after hydration.

Expected:
- Video notes are available from both `Tools` and `Details > Note Type`.
- Video notes use the dedicated editorial video frontend in both the Konva wall renderer and the React preview/editor surfaces.
- Video note uploads, direct video links, and embeddable provider links all persist through local storage and cloud sync.
- Clicking the wall-card play affordance plays the video inline on the note without opening the editor.
- Video-note overlays remain visible and unclipped on desktop and mobile wall layouts.

## NASA APOD Note (`/wall`) (2026-03-20)
1. Open `/wall`, open `Tools`, and click `New APOD`.
2. Verify a new APOD note appears and loads the current Astronomy Picture of the Day instead of a blank image card.
3. Verify the note shows the APOD title, date, and readable source metadata.
4. Open the command palette, run `Create APOD note`, and verify another APOD note is created at viewport center.
5. Press `Shift + A` and verify the same APOD note creation flow works from the keyboard.
6. Convert an existing standard note through `Details > Note Type > APOD` and verify it becomes an APOD note and fetches the latest APOD payload.
7. In the APOD floating editor, click `Refresh Now` and verify the note refetches data without creating a duplicate note.
8. Click `Open Source` and verify the NASA APOD page opens in a new tab.
9. Click `Download Image` and verify the current APOD image downloads locally with a readable filename. If the current APOD entry is a direct video file, verify the control switches to `Download Video` and downloads the video instead.
10. Resize the APOD note smaller and larger, then zoom out and back in; verify the media remains sharp and uses a contained layout rather than stretching into a blurry crop.
11. Collapse back to the default note size and verify the image preview is still crisp.
12. Refresh `/wall` and verify the APOD note restores with its cached metadata and image.
13. If cloud sync is enabled, sync, reload, and verify the APOD payload still renders after hydration.
14. If the current APOD entry is a video, verify the wall card stays readable with a video badge/thumbnail and opening the APOD editor shows playable embedded or direct video when the provider is supported.
15. Leave the wall open across a date boundary or mock a new day, then trigger visibility/focus recovery and verify the APOD note updates to the new day instead of staying stale.

Expected:
- APOD notes are creatable from `Tools`, command palette, keyboard shortcut, and note-type conversion.
- APOD note data is fetched through the app backend using the configured NASA API key rather than from the browser directly.
- APOD notes auto-refresh for a new day, while manual refresh remains available.
- Supported APOD video entries remain readable on the wall and play inside the APOD editor instead of failing as broken images.
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
3. Confirm it renders as the dark Throne card with the gold shield accent and shows a Game of Thrones quote.
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
15. Create a new standard note and verify it uses the white `Quick Thought` shell by default. Then open `Details > Note Type`, confirm `Default` is the first option, convert the note to another type and back to `Default`, and verify the note returns to the standard shell without leftover specialized UI.

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
## Decks Route and Workflow (2026-03-03)
1. Sign in and open `/decks` from landing and from `/wall` toolbar.
2. In deck sidebar, create a root deck and one child deck.
3. In the top decks header, click `Wall`, `Page`, and `Media` and verify each route opens directly without losing access to the decks workspace.
4. On `/decks/decks`, verify the top-right gear opens `/settings` and the `Study` action opens the deck study surface instead of showing an unlabeled icon-only shortcut.
5. On `/decks/decks`, click `Add Note`, choose a deck and note type, and create one note using each built-in note type (Basic, reversed, optional reversed, cloze).
6. Try creating the same note again in the same deck and note type, varying only field order, surrounding whitespace, or line endings, and verify the app rejects it as a duplicate.
7. Start study on parent deck with `Include child decks` enabled; confirm cards from child deck appear.
8. Exclude the child deck and confirm child cards are removed from current queue.
9. In study view, click `Show Answer`, then rate cards with `Again/Hard/Good/Easy`.
10. Open `Browse`, search cards, select rows, and run bulk `Suspend`, `Unsuspend`, and `Delete`.
11. In Browse editor, edit prompt/answer and save.
12. Open `Stats`, switch ranges (`7d`, `30d`, `90d`, `1y`, `deck_life`) and verify summary/workload updates.
13. Open `Import File`, upload sample `.csv` or tab-delimited `.txt`, map columns, import notes.
14. Re-import the same rows into the same deck and verify the import stops with a duplicate-note error instead of adding another copy.
15. Save an import preset, close modal, reopen, and apply the saved preset.
16. Switch to dark mode on `/decks` and verify deck backgrounds, panels, badges, and modal surfaces render as pure `#000000`, while text and status/icon indicators remain readable.
17. Reload `/decks/decks` after creating a note and verify the selected deck counts update and the generated card appears in `Browse Cards`.

Expected:
- Decks route is reachable from both landing and wall.
- Decks header provides direct route access to Wall, Page, and Media, and no longer relies on an unlabeled icon for study navigation.
- Add Note/Browse/Stats/Study/Import flows work end-to-end.
- Duplicate deck notes are rejected for both manual creation and import.
- Parent study optionally includes children and supports exclusions.
- Card scheduling updates queue counts after rating.
- Import mapping presets persist via cloud data and reload correctly.
- Decks route/features work correctly in the web app.

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
2. Verify the new note appears as a warm white editorial card with a small serif date label and generous interior margins.
3. Double-click the `Journal` note, confirm the editor keeps the white editorial card surface with the small serif date label, and enter a multi-line entry.
4. Resize the `Journal` note taller and shorter; verify the serif title/body spacing remains readable and the date/title block keeps its margins.
5. Drag the note, zoom in/out, blur the editor, then refresh the page.
6. Select a standard note, use `More > Convert to Journal`, and verify the editorial Journal styling and serif defaults apply without breaking note text.

Expected:
- Journal notes render like the editorial Journal card from the new notes frontend: white paper stock, subtle warm shadow, a small italic date label, and `Newsreader`-style serif title/body treatment.
- The date label stays visible and aligned after refresh.
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
5. On `/login`, click `Forgot password?`, submit `/forgot-password`, open the recovery link to `/reset-password`, set a new password, and verify the new password works on `/login`.
6. Create notes/zones/links, wait for `Last synced` to update, refresh page, verify data persists.
7. Click `Sync now` and confirm sync completes without error banner.
8. Sign in on a second browser/device with same account and verify wall content appears after sync.
9. Modify wall on device B, sync, then refresh device A and verify updates propagate.
10. Turn off network, make local edits, turn network back on, click `Sync now`, verify changes persist and error clears.
11. Sign in with a second account and verify it does not see the first account's wall.
12. While signed in, set a note's `Horizontal align`, `Vertical align`, and `Text color`; wait for sync, then close browser, restart `npm run dev`, and reopen `/wall`.
13. While signed in on `/wall`, clear or expire the session, trigger `Sync now`, and verify the app redirects to `/login` with a session-expired message instead of showing raw `Unauthorized`.
14. Repeat the expired-session check from `/settings` by saving settings after the session is cleared; verify redirect to `/login` and that re-sign-in returns to `/settings`.
15. On `/login` and `/signup`, simulate the auth service being unreachable and verify the form shows a readable transport error instead of throwing an uncaught browser exception.
16. On `/`, `/forgot-password`, `/reset-password`, and `/settings`, simulate the auth service being unreachable and verify the app falls back to local/default state or inline error messaging without uncaught `Failed to fetch` / `AuthRetryableFetchError` console failures.

Expected:
- `/wall` is protected for unauthenticated users.
- Sync status updates (`Saving...`, `Synced`, `Offline`, `Error`) behave consistently through edit, offline, recovery, and retry flows.
- Cross-device sync works for create/edit/delete.
- Accounts remain isolated via RLS.
- Note formatting (`textAlign`, `textVAlign`, `textColor`) survives app/browser restarts and cloud rehydration.
- Expired authenticated sessions redirect to `/login` cleanly for wall sync and settings saves without surfacing raw backend auth strings.
- Login and signup surface network/auth transport failures as inline form errors.
- Browser-side auth bootstrap and recovery flows degrade cleanly when Supabase auth is temporarily unreachable.

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

## Cloud Sync Regression - Large Snapshot Retry (2026-03-30)
1. Sign in to an account with cloud sync enabled.
2. Create or import a wall with several hundred notes or a similarly large mixed snapshot.
3. Click `Sync now`.
4. Keep the sync status panel open until the request finishes.
5. Reload `/wall`.
6. Trigger another `Sync now` after a small edit.

Expected:
- Sync completes without surfacing `canceling statement due to statement timeout`.
- Reloaded wall content matches the pre-reload snapshot.
- A follow-up sync after a small edit also completes successfully.

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
1. Open `/wall` and create or load several notes with different creation times, including at least one journal note, one quote note, one image note, and one pinned note.
2. Click `Timeline View` in the top toolbar or press `V`.
3. Verify the timeline opens as a vertical editorial stream with a warm paper background, a centered timeline rail, and day markers such as `Today` or `Yesterday`.
4. Verify notes render with the same specialized frontend shells used on `/wall` instead of generic cards, including readable journal, quote, image, and pinned-note treatments.
5. Verify a note that fits on the wall keeps the same visible width and height in timeline view rather than shrinking into a smaller preview card.
6. Verify unpinned notes alternate to the left and right of the center rail on desktop-sized viewports.
7. Verify pinned notes render centered in the timeline stream rather than joining the left-right alternation.
8. Scroll through the timeline and verify each note shows a compact timestamp beneath the card without clipping or overlapping the surrounding layout.
9. Resize the wall note larger, reopen timeline view, and verify the timeline copy grows with it at the same width and height as the wall note instead of shrinking into a fitted preview.
10. Verify clicking a note does not open details, does not reveal the note on the wall, and does not enter any editor flow.
11. Press `Escape` or click `Close` and verify the app exits timeline view.
12. Resize to a mobile-sized viewport and verify the timeline collapses into a readable single-column stream while keeping date markers and timestamps visible.

Expected:
- Timeline view provides a read-only chronological review surface rather than an interactive editor or detail browser.
- Timeline notes preserve the same note-type identity and visual treatment used on `/wall`.
- Timeline notes preserve the same wall note dimensions rather than shrinking into a smaller fitted timeline card.
- The centered date rail, day chips, and timestamp labels remain fully visible on desktop and mobile-sized viewports.
- Notes cannot be opened, edited, or revealed from timeline view.
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
- Poetry cards follow the dedicated Poetry shell with the faint source eyebrow, centered poem body, and separated poet footer row.
- The details sidebar exposes Poetry-only search controls for random, author, title, line text, and line count lookups.
- Poetry notes auto-refresh on local day changes and manual refresh reuses the note's saved search method without creating duplicate notes.
- Poetry notes can be exported directly as PNG or PDF from the floating editor.
- The reserved Poetry color remains fixed and persists through refresh and sync.

## Economist Cover Note (`/wall`) (2026-03-20)
1. Open `/wall`, open `Tools`, and click `Magazine Covers`.
2. Verify warm-paper magazine-cover notes appear near viewport center for each source exposed by the local API, including `The Economist`, `Barron's`, `The New Yorker`, `Newsweek`, `Forbes`, and `The Week`.
3. Verify each created note loads a cover image, does not repeat the masthead at the top of the cover, shows the main story above the magazine name at bottom left, and shows the issue date only once instead of all notes collapsing to `The Economist`.
4. Verify `The Week` creates multiple distinct cartoon notes when the upstream API returns multiple images instead of collapsing that source to a single card.
5. Open the command palette, run `Create magazine cover notes`, and verify another full set of magazine-cover notes is created near viewport center.
6. Press `Shift + M` and verify the keyboard shortcut creates another full set of magazine-cover notes.
7. Delete one source from the multi-cover set, then convert an existing standard note through `Details > Note Type > Magazine Cover` and verify it recreates the first missing magazine source instead of defaulting back to Economist.
8. In `Details`, change `Magazine Source` on that selected note to `Barron's`, verify only that note switches source, and verify it refreshes to the latest Barron's cover without changing the other magazine notes.
9. Use `Refresh Cover` and `Open Source` in `Details` for the selected note, then verify the refresh only affects that note and the source link opens the correct archive page for the chosen magazine.
10. Refresh `/wall` while signed in and verify existing magazine-cover notes automatically refresh against their own sources on hydration/login.
11. Duplicate a non-Economist magazine-cover note and verify the duplicate keeps the reserved styling, then refresh it and verify it still resolves the same magazine source.
12. If cloud sync is enabled, sync, reload, and verify the magazine-cover notes still render their cover images and source/date metadata after hydration.
13. Resize the notes smaller and larger on desktop and mobile-sized viewports; verify the cover image remains visible, floating controls stay on-screen, and nothing clips against viewport edges.
14. Simulate an upstream failure for the `economist` source after at least one successful load, then reload or sign in again and verify the existing Economist note keeps its last cached cover instead of degrading to an empty/error state.

Expected:
- The multi-cover action creates one or more Economist-shell notes per magazine source exposed by the local API, depending on how many distinct images the source returns.
- The note uses the local backend proxy routes rather than calling the local cover API directly from the browser.
- Sign-in or wall hydration refreshes existing magazine-cover notes against their own sources automatically.
- `Details > Note Type > Magazine Cover` prefers the first missing magazine source on the wall when recreating a deleted cover.`r`n- The Details `Magazine Source` picker lets a single selected note switch to a different magazine source without recreating the full set.
- Manual refresh updates the existing note in place without cross-overwriting other magazine notes.
- Cover imagery, source actions, and floating editors remain fully visible on desktop and mobile layouts.
- When the upstream Economist cover source is temporarily unavailable, existing Economist notes fall back to the last successful cached cover and back off repeated refresh attempts for a short period.
## Currency Note (`/wall`) (2026-03-19)
1. Open `/wall` and verify one indigo `Currency` system note is present near the top-left of the wall.
2. Refresh the page and verify the note still exists.
3. Drag the currency note to a new position, refresh, and verify the new position persists.
4. Try delete flows: keyboard `Delete`, quick actions, duplicate shortcuts, and note merge flows; verify the currency note is not removed, duplicated, or merged away.
5. Verify the note shows the detected or fallback base currency as a `USD / <base>` pair and displays the inverse `<base> per 1 USD` rate.
6. Verify the note footer shows the currency source and a relative update timestamp, and verify the green change badge renders without clipping.
7. Open the currency editor, enter a converter amount, and verify the USD output updates instantly.
8. Change the base currency manually to another ISO code such as `CAD`, `EUR`, or `GBP`; verify the note refreshes against USD.
9. Click `Use detected` and verify the note returns to the detected/fallback currency.
10. Click `Refresh` repeatedly and verify requests are debounced rather than spamming duplicate refreshes.
11. Deny geolocation permission, reload `/wall`, and verify the note falls back to IP-based lookup or USD without crashing.
12. Simulate offline or API failure, reload, and verify the note falls back to cached/default values with a readable error state.
13. Switch between light and dark theme and verify the indigo identity remains readable with strong contrast in both.
14. On mobile and desktop widths, verify the currency editor, badges, and floating UI stay fully visible and are not clipped by viewport edges or other wall chrome.
15. If the signed-in account has multiple cloud wall records, sign out and back in, reopen `/wall`, and verify the app restores the last real wall you were working on rather than landing on a wall that only contains the currency system note.

Expected:
- The wall always contains exactly one permanent currency system note.
- The note can be moved but not deleted, duplicated, hidden, or merged away.
- Location detection degrades from geolocation to IP lookup to USD fallback cleanly.
- Exchange-rate fetches are lazy, cached, debounced, and recover gracefully from API failures.
- The note remains legible and premium-looking in both light and dark themes.
- Sign-in should not switch the user onto a stray cloud wall whose only visible content is the currency system note.









## Private Notes (`/wall`) (2026-03-21)
1. Open `/wall`, create a standard note, add visible text, then choose `Details > Privacy > Protect note`.
2. Enter and confirm a password; verify the note switches to a locked private shell and the original content no longer shows on the wall.
3. Click the locked note and verify the unlock modal appears instead of the text editor.
4. Enter the wrong password and verify the note stays locked with an error message.
5. Enter the correct password and verify the note unlocks successfully.
6. Remove protection from the unlocked note and verify the original note type and content return intact.
7. Wait at least five minutes without interacting, or hide the tab and return; verify the unlocked note auto-locks and the editor closes.
8. Search for text that exists only inside the private note and verify it does not appear in search results while the note is locked.
9. Export Markdown and verify the private note is listed as hidden content rather than exporting plaintext.
10. In `Details > Privacy`, unlock the note, click `Remove protection`, and verify the plaintext note body returns and can be searched again.
11. Repeat the flow with an image, bookmark, or APOD note and verify the note restores its original media or card payload after unlocking and removing protection.
12. If cloud sync is enabled, sync, reload, and verify the private note remains locked on reload and can still be opened with the same password.

Expected:
- Private notes behave like sealed note shells on the wall and never render plaintext while locked.
- Passwords unlock private notes only for the active browser session and are not persisted with the wall snapshot.
- Search, Markdown export, and wiki-link generation exclude locked private note content.
- Refreshing, syncing, hiding the tab, or letting the unlock session expire does not lose encrypted note contents.


## Wall Atelier Frontend (`/wall`) (2026-03-26)
1. Open `/wall` on desktop and verify the atelier chrome loads: floating top navigation, centered bottom omnibar dock, right-side zoom rail, and lower-left sync footer.
2. Verify the top navigation shows `Wall`, `Decks`, `Page`, `Timeline`, and `Media`, with `Wall` highlighted in the default wall view.
3. Click into the bottom dock and verify it is a real inline input that expands in place above the dock instead of opening a separate modal search palette.
4. Type plain note text and verify the omnibar shows grouped `Suggestions`, `Actions`, and `Notes`, and that the visible wall notes filter in sync with the query.
5. Enter query tokens such as `tag:<existing-tag>`, `type:quote`, `is:pinned`, and `tool:details`; verify matching chips appear, wall visibility respects the note filters, and the action group prioritizes matching panel/tool actions.
6. Press `Ctrl/Cmd + K`, confirm the omnibar input receives focus, then use `ArrowUp`, `ArrowDown`, `Enter`, and `Esc` to navigate suggestions, actions, and note results.
7. Type `/` plus an action query and verify note results are suppressed while action results remain keyboard navigable.
8. Use the `Tools` and `Details` buttons in the bottom dock and the corresponding round buttons in the header; verify each panel opens and closes without clipping against viewport edges.
9. Use the right zoom rail for `+`, `-`, `Fit`, `100%`, and selection focus; verify actions still affect the existing wall camera correctly.
10. Verify standard paper notes, quote notes, poetry notes, journal notes, bookmark cards, image/media cards, private-note shells, joker/throne cards, and magazine-cover notes all render while remaining draggable/selectable/editable.
11. Check desktop and mobile-width layouts and confirm the floating header, omnibar dock, details sidebar, tools panel, and zoom rail remain visible and usable without obscuring critical content.

Expected:
- `/wall` uses the atelier presentation layer without breaking existing wall behaviors.
- The bottom dock is the canonical omnibar surface; `Ctrl/Cmd + K` focuses that same inline omnibar instead of opening a second search UI.
- Query tokens remain visible as removable chips and drive wall filtering for tags, note types, and note state.
- Floating chrome stays inside the viewport and preserves access to tools, details, search, sync status, and zoom actions.
- Existing wall interactions such as selection, drag, edit, panel toggles, and camera control continue to work behind the new frontend.

## Media Player (`/media`) (2026-03-28)
1. Open `/wall` and confirm there is at least one audio note and one video note on the wall. If needed, create them using the existing media-note flows.
2. Open `/media` and verify the page loads without affecting wall state or mutating existing notes.
3. Verify the right-side `Studio Library` is auto-populated from current wall media notes and groups entries into `Video fragments` and `Audio fragments`.
4. Confirm the first available video note is selected by default; if there are no videos, verify the first audio note is selected instead.
5. Select a direct-upload or direct-link video and verify it plays in the main stage with working play/pause, previous/next, seek, and volume controls.
6. Select an audio note and verify the audio stage updates to the audio-specific visualization while playback controls still work.
7. Select a YouTube/Vimeo-style linked video note, if present, and verify the embedded player renders in the stage or the page falls back to `Open Original` rather than breaking layout.
8. While `/media` is open, add another audio or video note on `/wall` in a separate tab/window and verify the `Studio Library` updates automatically without a manual refresh.
9. Remove or rename a media note on `/wall` and verify `/media` reflects the change automatically and keeps a valid active selection.
10. Test desktop and mobile-width layouts and verify the player, controls, metadata panel, and library remain visible in viewport without clipped floating UI.

Expected:
- `/media` reads from the same persisted wall snapshot as `/wall` instead of maintaining a separate media collection.
- Audio and video notes appear automatically and stay in sync as wall media changes.
- The media player route does not break existing wall note creation, editing, persistence, or playback behaviors.
- Direct media sources use the route-level playback controls, while embedded/link-only media degrade gracefully.

## Joker Note (`/wall`) (2026-03-25)
1. Open `/wall` and locate the Joker note or create one from `Tools`.
2. Verify the note uses the warm amber card, compact `SOURCE: JOKES API` label, top-right smile mark, lighter question copy, and bold punchline separated by a thin divider.
3. Resize the Joker note smaller and larger, then zoom out and back in; verify the question and punchline remain legible, stay inside the card bounds, and preserve the same visual hierarchy in both the wall canvas and detail/preview surfaces.

Expected:
- Joker notes match the new note frontend reference instead of the older placeholder look.
- The live Konva wall rendering and the React preview use the same Joker hierarchy and ornamentation.






## Image Note (`/wall`) (2026-03-26)
1. Open `/wall`, open `Tools`, and click `New Image`.
2. Verify a dedicated image note appears with the new editorial photo shell instead of the older grayscale fallback card.
3. Double-click the image note and verify the floating editor opens with filename, caption, `Upload`, and `Paste URL` controls plus the same image-note preview.
4. In the floating editor `Upload` tab, choose a local image and verify the note updates with the uploaded image plus the stored filename.
5. Rename the image file name in the floating editor and verify the new name persists after blur.
6. In the floating editor `Paste URL` tab, save a direct remote image URL and verify the note renders the linked image.
7. Use `Open Image` and verify upload-backed notes open the local asset while link-backed notes open the remote image URL.
8. Use `Download Image` and verify both upload-backed and link-backed images download with a readable filename.
9. Select a standard note, go to `Details > Note Type`, click `Image`, and verify the note converts into the image note shell without creating a duplicate note.
10. In `Details > Image`, upload an image, save a link, rename the image file name, edit the caption, and verify each change updates the selected image note in place.
11. Refresh `/wall` and verify uploaded and link-backed image notes restore correctly.
12. If cloud sync is enabled, sync, reload, and verify the image note still renders with its filename metadata and actions after hydration.

Expected:
- Image notes are available from both `Tools` and `Details > Note Type`.
- Image notes support local upload, direct image links, filename rename, caption editing, open, and download from both the floating editor and the details sidebar.
- The new image note shell matches the editorial frontend direction and persists through refresh and sync.


## Wall Product Tour (`/wall`) (2026-03-26)
1. Open `/wall` in a browser profile that has not dismissed or completed the product tour.
2. Verify the guided tour starts with a centered welcome card, followed by the canvas and omnibar orientation steps.
3. Advance to the `Create your first note` step and confirm the `Tools` panel is opened automatically with the `New Note` action highlighted.
4. Click `New Note` and verify the tour advances once the note is created.
5. Advance to the recovery step, click `Fit` on the zoom rail, and verify the tour completes with a final success state.
6. After completion, confirm a contextual tip can appear on the `Details` sidebar when a note is selected.
7. Focus the omnibar after the tour and verify a follow-up tip can appear explaining `tag:`, `type:`, `is:`, and `tool:` tokens.
8. Refresh `/wall` and verify the completed tour does not auto-start again.
9. Open wall `Settings`, use `Workspace > Replay tour`, and verify the product tour restarts from step 1.
10. Open the omnibar command palette, run `Replay product tour`, and verify it also restarts the tour.
11. Repeat on a narrow/mobile-width viewport and confirm coachmarks stay visible, do not clip against the tools panel, details panel, or zoom rail, and do not block core wall interactions.

Expected:
- `/wall` ships a hybrid progressive product tour rather than a long blocking wizard.
- The guided spine teaches wall orientation, omnibar usage, first note creation, and fit-based recovery.
- Contextual tips appear only after relevant behavior, then persist as seen locally.
- Tour dismissal/completion survives refresh, and replay remains available from settings and the command palette.
## Help Center (`/wall` and `/help`) (2026-03-27)
1. Open `/wall`, open the profile menu, click `Help center`, and verify a quick-help modal opens instead of the keyboard shortcuts modal.
2. Verify the quick-help modal shows category browse controls, a central help search field, quick actions, and an article preview area without clipping against the viewport.
3. In the quick-help modal, search for `search`, `export`, and `sync`; verify relevant help articles appear and the preview panel updates when you select one.
4. In the quick-help modal, click `Open shortcuts`; verify the help modal closes and the dedicated shortcuts modal opens.
5. Reopen the help modal and click `Open settings`; verify the help modal closes and the embedded wall settings modal opens.
6. Reopen the help modal and click `Replay tour`; verify the help modal closes and the wall product tour starts.
7. Use `Ctrl/Cmd + K`, search `help`, run `Open help center`, and verify the same quick-help modal opens.
8. Use `Ctrl/Cmd + K`, search `tool:help`, and verify help-related actions are prioritized.
9. From the quick-help modal, click `Read full article` or `Open full library`; verify the app navigates to `/help` and shows the selected article or overview library.
10. On `/help`, verify the page shows sidebar category navigation, searchable article cards, and article detail views with related reading links.

Expected:
- Wall help is now a hybrid system: quick in-context help on `/wall` plus a route-based `/help` library.
- Keyboard shortcuts remain available, but they are a subsection of help rather than the entire help experience.
- Help actions are discoverable from both the profile menu and the wall omnibar.
- The quick-help modal and `/help` route share the same article inventory and stay visually within the viewport.

