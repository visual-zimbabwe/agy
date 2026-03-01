# Idea Wall Mobile (Expo)

Native mobile port of Idea Wall Studio using React Native + Expo, saved in a separate folder so the existing Electron/Next.js app remains unchanged.

## Included in second pass

- Single Expo codebase for iOS + Android.
- Infinite-style wall with pan + zoom.
- Notes:
  - standard, quote, and canon note creation
  - drag/edit/color/tags/delete/duplicate
- Zones:
  - create, drag, edit label, delete
- Links:
  - create by selecting "Start Link" on one note then tapping another
  - type switching and delete
- Templates:
  - brainstorm, retro, strategy map
- Search overlay with camera jump.
- Implicit cluster outlines (non-destructive).
- Undo/redo history.
- Local-first persistence with AsyncStorage.
- JSON import/export flow (share export, paste import JSON).

## Run locally

1. `cd idea-wall-mobile`
2. `npm install`
3. `npm run start`
4. Press `a` for Android (or open Expo Go and scan the QR code).

## Publish with your Expo account

1. `cd idea-wall-mobile`
2. `npx expo login`
3. `npx expo whoami` (should show `kkadogo`)
4. `npx expo start`

## Notes

- Existing `idea-wall-studio` remains available and untouched.
- Mobile implementation targets feature parity categories with touch-first UX; layout and interaction details are adapted for phone screens.
