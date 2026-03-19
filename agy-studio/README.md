# Agy

Electron desktop wrapper for the `agy` Next.js app.

## Commands

- `npm install`
- `npm run dev`
- `npm run dist`
- `npm run dist:publish`

## How it works

1. `npm run build:web` builds the web app from the parent folder with `NEXT_OUTPUT=standalone`.
2. `npm run prep:web` copies the standalone server, static assets, and `public/` into `.dist/web`.
3. `electron-builder` packages Electron and bundles `.dist/web` into app resources.

## Release outputs

- Windows installer: `agy-studio/release/Agy-Setup-<version>.exe`
- macOS DMG: `agy-studio/release/Agy-<version>.dmg`
- Linux AppImage: `agy-studio/release/Agy-<version>.AppImage`

## Notes

- Configure code signing before distributing production installers.
- Optional runtime port override: `AGY_DESKTOP_PORT`.
- Auto-update feed URL:
  - optional for `npm run dist`
  - required for `npm run dist:publish`
  - required at app runtime to enable update checks in packaged app

## Release Environment

- Windows signing (optional but recommended for production):
  - `CSC_LINK` / `CSC_KEY_PASSWORD` or `WIN_CSC_LINK` / `WIN_CSC_KEY_PASSWORD`
- macOS signing/notarization:
  - `APPLE_ID`
  - `APPLE_APP_SPECIFIC_PASSWORD`
  - `APPLE_TEAM_ID`
- Auto-update publishing:
  - `AGY_AUTO_UPDATE_URL`


