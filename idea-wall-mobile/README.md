# Idea Wall Mobile (Expo)

Native mobile port of Idea Wall Studio using React Native + Expo, saved in a separate folder so the existing Electron/Next.js app remains unchanged.

## Included in this migration

- Single Expo codebase for iOS + Android.
- Infinite-style wall surface with pan + zoom.
- Create, drag, edit, duplicate, delete, and color notes.
- Search notes by text.
- Undo/redo.
- Local-first persistence with AsyncStorage.

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

- This is a native mobile foundation, not a full 1:1 of every advanced desktop/web wall feature yet.
- Existing `idea-wall-studio` remains available and untouched.
