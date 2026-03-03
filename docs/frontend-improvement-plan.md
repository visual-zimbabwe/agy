# Frontend Improvement Plan

Using `frontend-design`: the biggest frontend win is to separate visual system work from `WallCanvas` decomposition, then redesign key surfaces around one strong, consistent aesthetic.

## Recommended Direction
- Choose one bold visual direction for the product and apply it end-to-end (landing, auth, wall chrome, modals), instead of today's mixed styles.
- Keep canvas interactions stable while you refactor UI architecture in parallel.

## Plan (Phased)
1. **Baseline + Guardrails (Day 1-2)** (Done)
- Capture current UX baselines: screenshots + short flows for `/`, `/login`, `/signup`, `/wall`.
- Add lightweight frontend quality checklist in `docs/qa.md`: keyboard nav, focus states, contrast, panel overlap behavior.
- Define performance targets for wall UI (panel open latency, search palette open time, initial interactive time).

2. **Design System Foundation (Week 1)** (Done)
- Create design tokens in `src/app/globals.css` for color, spacing, radius, shadows, motion, z-index.
- Replace scattered hardcoded surface/button styles with reusable primitives (`Button`, `Panel`, `ModalShell`, `Field`, `Badge`) in `src/components/ui/`.
- Standardize typography stack (display + body + mono), and remove ad-hoc per-component font decisions.
- Normalize overlays/modals (`SearchPalette`, `ExportModal`, `ShortcutsHelp`, `QuickCaptureBar`) to one shared shell and interaction model.

3. **Wall UI Decomposition (Week 1-2)** (Done)
- Break `src/components/WallCanvas.tsx` (3846 lines) into focused modules:
  - `WallStage` (Konva drawing + camera),
  - `WallToolbar`,
  - `ToolsPanel`,
  - `DetailsPanel`,
  - `TimelineDock`,
  - `PresentationDock`,
  - feature hooks (`useWallKeyboard`, `useWallSelection`, `useWallExport`, `useWallTimeline`).
- Move pure view helpers/constants out of `WallCanvas.tsx` (icons, style maps, color helpers).
- Keep behavior parity by refactoring in slices (one panel at a time) and verifying after each slice.

4. **Interaction Polish (Week 2)** (Done)
- Add coherent motion system: entry transitions for panels/modals, subtle hover/active states, reduced-motion fallback.
- Improve focus and keyboard ergonomics across command surfaces (search, quick capture, export, account menu).
- Resolve visual noise/duplication in wall chrome (too many similar zinc-bordered controls competing for attention).

5. **Aesthetic Pass Across Routes (Week 2-3)** (Done)
- Redesign landing/auth/wall chrome with the same visual language.
- Make landing and auth feel like part of the same product as the canvas (currently they feel separate).

6. **Hardening + Documentation (Week 3)** (Done)
- Run `npm run lint`, `npm run build`, and full `docs/qa.md` checks.
- Add frontend architecture notes (component boundaries and token usage) so new features don't regress into one-file growth.
- Update `docs/product-improvements.md` with frontend milestones and completion criteria.

## Top Priority Backlog (Do First)
1. Tokenize styles + reusable UI primitives.
2. Extract modal/panel shells.
3. Start `WallCanvas` split with `WallToolbar` and `DetailsPanel`.
4. Unify landing/auth styling with the new system.

## Success Criteria
- `WallCanvas.tsx` reduced substantially (target: <1200 lines, then continue down).
- Shared UI primitives used by all modal/panel surfaces.
- Consistent typography/color/motion across `/`, auth pages, and `/wall`.
- QA checklist expanded and passing with `lint` + `build`.
