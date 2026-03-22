import { describe, expect, it } from "vitest";

import { canProtectNote, decryptPrivateNote, encryptPrivateNote, PRIVATE_NOTE_AUTO_LOCK_MS } from "@/features/wall/private-notes";

describe("private notes", () => {
  it("encrypts and decrypts hidden note payloads with a password", async () => {
    const encrypted = await encryptPrivateNote("correct horse battery staple", {
      noteKind: "apod",
      text: "Board meeting notes",
      tags: ["secret", "apollo"],
      imageUrl: "https://example.com/image.jpg",
      apod: {
        status: "ready",
        title: "Leaving Earth",
      },
    });

    expect(encrypted.ciphertext).not.toContain("Board meeting notes");
    expect(encrypted.updatedAt).toBeGreaterThanOrEqual(encrypted.protectedAt);

    const decrypted = await decryptPrivateNote("correct horse battery staple", encrypted);
    expect(decrypted).toEqual({
      noteKind: "apod",
      text: "Board meeting notes",
      quoteAuthor: undefined,
      quoteSource: undefined,
      canon: undefined,
      eisenhower: undefined,
      currency: undefined,
      bookmark: undefined,
      apod: {
        status: "ready",
        title: "Leaving Earth",
      },
      poetry: undefined,
      imageUrl: "https://example.com/image.jpg",
      tags: ["secret", "apollo"],
      vocabulary: undefined,
    });
  });

  it("allows protection for any note type", () => {
    expect(canProtectNote({ id: "n1" })).toBe(true);
  });

  it("uses a short-lived unlock session timeout", () => {
    expect(PRIVATE_NOTE_AUTO_LOCK_MS).toBe(5 * 60 * 1000);
  });
});
