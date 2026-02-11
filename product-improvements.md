# Product Improvements

1. Usability polish pass
- Add iconography to top bar/left rail and tighten spacing hierarchy.
- Add tooltips for all controls with shortcut hints.
- Improve mobile/tablet behavior (collapsible side panels).

2. Performance and correctness
- Profile drag/multi-select with 300+ notes and optimize re-renders.
- Add memoization around heavy derived lists (recall/tag groups/paths) where needed.
- Add regression checks for the two hook/state errors you hit.

3. Undo/redo hardening
- Group related operations into single history entries (bulk move, align, template apply).
- Add visible history depth indicator and “clear history” safety option.

4. Tests
- Add unit tests for command functions and store reducers.
- Add E2E smoke tests for create/edit/drag/persist/search/export/linking.
- Include a test for dependency-array stability in presentation/timeline toggles.

5. Information architecture cleanup
- Move some right-panel sections into collapsible accordions.
- Keep context bar minimal and show only truly selection-relevant actions.
- Add “Customize layout” toggles to hide panels per user preference.

6. Data and backup safety
- Add explicit “Export JSON / Import JSON” for full wall backup/restore.
- Add optional auto-backup download reminder (daily/weekly).

7. Docs
- Update `README.md` with the new layout map and shortcuts.
- Add a “Power User Workflow” doc and a quick-start GIF checklist.
