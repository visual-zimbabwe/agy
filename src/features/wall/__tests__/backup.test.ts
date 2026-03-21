import { describe, expect, it } from "vitest";

import { parseBackupJson, shouldPromptBackupReminder } from "@/features/wall/backup";

describe("backup compatibility", () => {
  it("parses current backup schema", () => {
    const parsed = parseBackupJson(
      JSON.stringify({
        notes: {},
        zones: {},
        zoneGroups: {},
        noteGroups: {},
        links: {},
        camera: { x: 0, y: 0, zoom: 1 },
      }),
    );

    expect(parsed).toBeTruthy();
    expect(parsed?.camera.zoom).toBe(1);
  });

  it("parses legacy backup schema without zoneGroups and links", () => {
    const parsed = parseBackupJson(
      JSON.stringify({
        notes: {},
        zones: {},
        camera: { x: 0, y: 0, zoom: 1 },
      }),
    );

    expect(parsed).toBeTruthy();
    expect(parsed?.zoneGroups).toEqual({});
    expect(parsed?.noteGroups).toEqual({});
    expect(parsed?.links).toEqual({});
  });

  it("returns null for invalid backup payload", () => {
    const parsed = parseBackupJson("not-json");
    expect(parsed).toBeNull();
  });

  it("computes reminder cadence windows", () => {
    const now = 1_000 * 60 * 60 * 24 * 30;
    expect(shouldPromptBackupReminder("off", 0, now)).toBe(false);
    expect(shouldPromptBackupReminder("daily", now - 25 * 60 * 60 * 1000, now)).toBe(true);
    expect(shouldPromptBackupReminder("daily", now - 2 * 60 * 60 * 1000, now)).toBe(false);
    expect(shouldPromptBackupReminder("weekly", now - 8 * 24 * 60 * 60 * 1000, now)).toBe(true);
  });

  it("keeps private note payloads in parsed backups", () => {
    const parsed = parseBackupJson(
      JSON.stringify({
        notes: {
          p1: {
            id: "p1",
            text: "",
            noteKind: "journal",
            tags: [],
            x: 0,
            y: 0,
            w: 220,
            h: 160,
            color: "#FEEA89",
            createdAt: 1,
            updatedAt: 2,
            privateNote: {
              version: 1,
              salt: "salt",
              iv: "iv",
              ciphertext: "cipher",
              protectedAt: 10,
              updatedAt: 11,
            },
          },
        },
        zones: {},
        zoneGroups: {},
        noteGroups: {},
        links: {},
        camera: { x: 0, y: 0, zoom: 1 },
      }),
    );

    expect(parsed?.notes.p1?.privateNote?.ciphertext).toBe("cipher");
  });

});
