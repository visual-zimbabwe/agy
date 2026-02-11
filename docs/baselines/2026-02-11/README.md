# UX Baseline Capture - 2026-02-11

This baseline packet covers the Day 1-2 guardrail scope from `docs/frontend-improvement-plan.md`.

## Scope
- Routes: `/`, `/login`, `/signup`, `/wall`
- Artifacts:
  - screenshots (desktop and mobile)
  - short user flows
  - wall performance targets

## Screenshot Manifest
- Desktop viewport: `1440x900`
- Mobile viewport: `390x844`
- Naming convention: `<route>-<viewport>.png`

Expected files:
1. `home-desktop.png`
2. `login-desktop.png`
3. `signup-desktop.png`
4. `wall-desktop.png`
5. `home-mobile.png`
6. `login-mobile.png`
7. `signup-mobile.png`
8. `wall-mobile.png`

Capture command:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\capture-ux-baselines.ps1
```

Notes:
- `/wall` capture uses `http://localhost:3000/wall?snapshot=baseline` so a read-only snapshot route can load without authentication.
- If your local `/wall` requires auth state for visual parity, capture an additional `wall-auth-desktop.png` and `wall-auth-mobile.png` after sign-in.
- If headless capture fails with `Access is denied` from Chrome/Edge crashpad, run the command in a normal local terminal session (outside restricted sandboxes) and re-run.

## Short Baseline Flows
1. `/` (Landing)
- Load route.
- Verify hero text, CTA (`Open Wall`), and features section render without layout shift.

2. `/login`
- Load route.
- Verify form fields and primary submit button are visible above fold on desktop and mobile.
- Verify link to `/signup` is visible and keyboard-focusable.

3. `/signup`
- Load route.
- Verify form fields and primary submit button are visible above fold on desktop and mobile.
- Verify link to `/login` is visible and keyboard-focusable.

4. `/wall`
- Load route.
- Verify canvas initializes and top controls are visible.
- Open `Search`, `Quick Capture`, and `Export` once each to confirm baseline modal/panel rendering.

## Wall Performance Targets (Guardrail)
Measure on a warm local dev session with browser performance tooling open.

1. Panel open latency:
- Target: `< 120 ms` from click to visible panel content.
- Surfaces: `Tools`, `Details`, `Export`, `Shortcuts`.

2. Search palette open time:
- Target: `< 100 ms` from `Ctrl/Cmd + K` to input focused and result list painted.

3. Initial interactive time (`/wall`):
- Target: `< 2.5 s` from navigation start to first successful note interaction (select or drag) on a warm cache.

4. Stretch target for larger walls (300 notes loaded):
- Panel open latency: `< 180 ms`
- Search palette open time: `< 140 ms`
