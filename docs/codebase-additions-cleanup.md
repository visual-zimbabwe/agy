# Codebase Additions And Cleanup Opportunities

Date: 2026-02-11

## Why This List
- Keep delivery speed high while reducing regression risk.
- Continue the architecture cleanup after the frontend milestone completion.
- Focus on concrete items with clear owner-ready outcomes.

## Priority 1: High Impact, Low-Medium Effort
1. Add an automated test baseline.
- Add `vitest` + React Testing Library for command/store-level unit tests.
- Start with `src/features/wall/commands.ts` and `src/features/wall/store.ts`.
- Done when: key wall mutations have deterministic tests and run in CI/local.
2. Add E2E smoke coverage.
- Add Playwright for critical flows: create/edit/drag/search/export/sync auth gate.
- Done when: one `npm run test:e2e` path catches basic runtime regressions.
3. Add CI quality gate.
- Run `npm run lint`, `npm run check:regressions`, and `npm run build` on push/PR.
- Done when: branch protections can rely on this pipeline.
4. Split largest UI hotspots further.
- Current large files: `src/components/WallCanvas.tsx`, `src/components/QuickCaptureBar.tsx`, `src/components/wall/WallFloatingUi.tsx`.
- Extract reusable sub-panels/components to keep files under ~400-500 lines.
- Done when: new feature work no longer lands in orchestration files by default.

## Priority 2: Medium Effort, Strong Maintainability Gain
1. Normalize UI text/icon encoding and copy consistency.
- Fix mojibake-style symbols and prefer explicit ASCII-safe symbols/components.
- Audit labels/tooltips for consistency (`Sync now`, `Reset`, `Keys`, etc.).
2. Strengthen shared class composition.
- Promote repeated utility class strings into `src/components/wall/wallChromeClasses.ts` or UI primitives.
- Done when: repeated surface/button styles are centralized.
3. Add stricter TypeScript and lint guardrails.
- Enable additional TS strictness where safe (`noUncheckedIndexedAccess` staged rollout).
- Add lint rules for file-size warnings or complexity in wall surfaces.
4. Add scripted repo health checks.
- Add `npm run check:types` (if split from build), `npm run check:deadcode` (optional), and duplicate style detection (lightweight script).

## Priority 3: Larger Additions (Strategic)
1. Domain-first module boundaries for wall state/actions.
- Continue moving orchestration logic out of UI components into feature modules/hooks.
2. Add telemetry hooks for UX guardrails (local/dev mode first).
- Track panel open latency, search open time, and initial interact timing.
- Persist local metrics snapshot for manual perf verification.
3. Improve persistence migration safety.
- Add migration tests around `src/features/wall/storage.ts` and backup import/export compatibility checks.

## Suggested Execution Order (Next 2-3 Weeks)
1. CI gate + unit test scaffold.
2. Playwright smoke suite.
3. `WallCanvas` + `WallFloatingUi` decomposition slice.
4. Type/lint guardrail tightening.
5. Storage migration and backup compatibility tests.

## Definition Of Done For This Cleanup Track
1. `lint`, `check:regressions`, `build`, unit tests, and smoke E2E all run in CI.
2. No core wall surface file exceeds 500 lines without a documented exception.
3. Shared UI primitives/class maps are the default path for new UI.
4. Backup/migration behavior has basic automated test coverage.
