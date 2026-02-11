# Frontend Architecture Notes

## Purpose
Keep the UI maintainable as features grow by enforcing module boundaries, shared tokens, and reusable primitives across `/`, auth routes, and `/wall`.

## Route Surface Architecture
1. `src/app/page.tsx`:
- Marketing and product framing for the wall.
- Uses shared route shell treatment (`.route-shell`) and tokenized surface styles.
2. `src/app/login/page.tsx` and `src/app/signup/page.tsx`:
- Auth-specific forms and account messaging only.
- Built from shared primitives (`Panel`, `Button`, `Field`) instead of route-local styles.
3. `src/app/wall/page.tsx`:
- Authentication gate + wall mount point.
- UI implementation lives in components under `src/components/` and `src/components/wall/`.

## Wall Component Boundaries
1. `src/components/WallCanvas.tsx`:
- Composition root and state orchestration.
- Wires feature hooks and passes data/events to child surfaces.
- Avoid adding new visual-only logic or duplicated style maps here.
2. `src/components/wall/WallStage.tsx`:
- Konva stage and camera interaction surface.
3. `src/components/wall/WallToolbar.tsx`, `src/components/wall/WallHeaderBar.tsx`:
- Top command surfaces and layout toggles.
4. `src/components/wall/WallToolsPanel.tsx` and `src/components/wall/WallDetailsSidebar.tsx`:
- Left/right panel UI.
5. `src/components/wall/WallFloatingUi.tsx` and `src/components/wall/WallGlobalModals.tsx`:
- Floating controls and modal layer.
6. `src/components/wall/useWall*.ts` hooks:
- Isolated behavior modules (keyboard, selection, export, timeline, view state, actions).

## Shared UI Primitive Rules
1. `src/components/ui/Button.tsx`:
- Primary action styling and variants.
2. `src/components/ui/Panel.tsx`:
- Elevated containers and glass/muted surfaces.
3. `src/components/ui/Field.tsx`:
- Inputs, labels, and focus behavior.
4. `src/components/ui/ModalShell.tsx`:
- Overlay and modal framing.
5. `src/components/ui/Badge.tsx`:
- Lightweight metadata chips.

Rule: new surfaces should be composed from these primitives before introducing route-specific custom classes.

## Token Usage Rules
1. Source of truth:
- `src/app/globals.css` (`--color-*`, `--radius-*`, `--shadow-*`, `--motion-*`, route shell tokens).
2. Usage pattern:
- Use token variables directly (`var(--color-border)`) in Tailwind arbitrary values when needed.
- Prefer existing class maps in `src/components/wall/wallChromeClasses.ts` for wall chrome controls.
3. Do not introduce:
- Hardcoded one-off zinc/gray palettes when equivalent tokens exist.
- Route-local gradients or typography stacks that diverge from the shared visual language.

## Growth Guardrails
1. If a wall file exceeds ~500 lines, extract by responsibility (view surface, behavior hook, or helper map).
2. If a style pattern repeats in 3+ places, convert it into a primitive variant or shared class map.
3. For new route-level surfaces, start from `.route-shell` and tokenized panel/button primitives.
4. Validate with:
- `npm run lint`
- `npm run check:regressions`
- `npm run build`
- Relevant steps in `docs/qa.md`
