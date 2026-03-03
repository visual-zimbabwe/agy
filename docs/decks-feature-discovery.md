# Decks Feature Discovery Log

Date: 2026-03-03

## User Request

Introduce **Decks** in the project:
- A deck is an organized group of flashcards studied together.
- Clicking a deck starts a study session with:
  - New cards
  - Learning cards
  - To Review cards

Add a global Decks toolbar with:
1. `Decks` (go back to deck list)
2. `Add` (popup to create flashcards, choose deck + note type)
3. `Browse` (card browser to search/edit/tag/delete across decks)
4. `Stats` (graphs and learning analytics)

Before implementation:
- Ask at least 20 questions
- One question at a time
- Save Q&A in this file

## Q&A

### Q1
Do you want Decks to live inside the existing `/wall` experience, or as a separate route (for example `/decks`)?

Answer: Separate route. User also asked for a short explanation of how this model works.

### Q2
Should `/decks` be accessible from the main landing page and from inside `/wall` (for quick switching)?

Answer: Yes, from both.

### Q3
Do you want Decks to be local-first (saved locally by default), cloud-synced when signed in, or cloud-only?

Answer: Cloud-synced always (user must be signed in).

### Q4
Should users be able to create nested decks (parent/child), or only a single flat list of decks?

Answer: Nested decks.

### Q5
When studying a parent deck, should it include cards from all child decks by default?

Answer: Yes.

### Q6
Should users be able to exclude specific child decks from a parent study session?

Answer: Yes.

### Q7
For the `Add` popup, should card creation support single card only at first, or both single and bulk add?

Answer: `Add` is for single-card creation only. Bulk adds should use a separate Import File feature (e.g., `.csv`, `.txt`).

### Q8
Where should the Import File feature live: in the deck toolbar as its own button, or inside the `Browse` screen?

Answer: Deck toolbar as its own button.

### Q9
For imported `.csv` and `.txt`, do you want users to map columns/fields manually during import (for example Front, Back, Tags, Deck)?

Answer: Yes.

### Q10
Should the app save reusable import mapping presets (so users don’t remap every time)?

Answer: Yes.

### Q11
Should Note Types be user-customizable (create/edit templates), or fixed built-in types only for v1?

Answer: Fully user-customizable.
- Clarification: Users create **Notes**, not cards directly.
- Built-in starter Note Types (Anki-style):
  1. Basic
  2. Basic (and reversed card)
  3. Basic (optional reversed card)
  4. Cloze
- Must support:
  - Custom fields (unlimited, e.g., Word/Definition/Example/Audio)
  - HTML-based front/back layout customization
  - CSS styling customization (colors/fonts/alignment)

### Q12
For scheduling/review logic, do you want Anki-style spaced repetition behavior (Again/Hard/Good/Easy with intervals), or a simpler custom algorithm first?

Answer: Anki-style.

### Q13
Do you want to match Anki’s latest algorithm as closely as possible (SM-2 successor behavior), or just keep Anki-like controls with our own implementation?

Answer: Create our own algorithm implementation, using best judgment, while preserving Anki-style controls.

### Q14
During study, should answer buttons be exactly `Again / Hard / Good / Easy`?

Answer: Yes, with a specific Study Now flow:
- Focus mode strips menus for active recall.
- First show Front Template only.
- Bottom control starts as single `Show Answer` button.
- Keyboard shortcuts: `Space` or `Enter` for Show Answer.
- After showing answer, display Back Template (typically question + answer).
- Replace `Show Answer` with rating buttons: `Again / Hard / Good / Easy`.

### Q15
Do you want keyboard shortcuts for rating buttons too (for example `1=Again, 2=Hard, 3=Good, 4=Easy`)?

Answer: No. User can click rating buttons.

### Q16
In `Browse`, should users be able to edit note fields inline in a table, or open a side editor panel when a row is selected?

Answer: Browser should be a powerful spreadsheet-like management window with this layout:
- Left Sidebar:
  - Filter tree for Decks, Note Types, Tags
  - Quick filters like Added Today, Suspended, Flagged
- Top Right Card List:
  - Spreadsheet rows/cards with columns like Sort Field, Deck, Due Date
  - Search bar with search-string support (example style: `tag:medical deck:Biology -is:suspended`)
- Bottom Right Editor:
  - Live editing for selected card/note content
  - Supports text, images, and audio
  - Auto-save behavior
  - Cards/Fields actions to change note type/layout settings for selected item

### Q17
Should `Browse` support selecting multiple rows and doing bulk actions (for example tag, move deck, suspend, delete)?

Answer: Yes. Bulk actions are a core purpose of Browse (file-explorer/spreadsheet style multi-select and apply-one-command-to-many).

### Q18
For `Stats`, should analytics be available at three levels: whole collection, specific deck, and specific subdeck?

Answer: Yes.

### Q19
Do you want date-range filters in Stats (for example 7 days, 30 days, 90 days, all time)?

Answer: Yes. Required ranges:
- 7 days
- 30 days
- 90 days
- 1 year
- Deck life (monthly data across the full history of that deck)

### Q20
Should `Stats` include forecast-style metrics like "cards due tomorrow" and "expected review workload over next 7 days"?

Answer: Yes.

### Q21
Do you want media on cards (images/audio) to be stored in cloud storage with signed access, or embedded directly in note content?

Answer: Leave media support out for now.

### Q22
Do you want me to start implementation now based on these answers?
