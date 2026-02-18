# Idea Wall Studio

Electron desktop wrapper for the `idea-wall` Next.js app.

## Commands

- `npm install`
- `npm run dev`
- `npm run dist`

## How it works

1. `npm run build:web` builds the web app from the parent folder with `NEXT_OUTPUT=standalone`.
2. `npm run prep:web` copies the standalone server, static assets, and `public/` into `.dist/web`.
3. `electron-builder` packages Electron and bundles `.dist/web` into app resources.

## Release outputs

- Windows installer: `idea-wall-studio/release/Idea Wall Studio-Setup-<version>.exe`
- macOS DMG: `idea-wall-studio/release/Idea Wall Studio-<version>.dmg`
- Linux AppImage: `idea-wall-studio/release/Idea Wall Studio-<version>.AppImage`

## Notes

- Configure code signing before distributing production installers.
- Optional runtime port override: `IDEA_WALL_DESKTOP_PORT`.
