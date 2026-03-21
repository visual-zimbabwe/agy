import { describe, expect, it } from "vitest";

import { decryptPrivateNote, encryptPrivateNote, PRIVATE_NOTE_AUTO_LOCK_MS } from "@/features/wall/private-notes";

describe("private notes", () => {
  it("encrypts and decrypts note text with a passphrase", async () => {
    const encrypted = await encryptPrivateNote("correct horse battery staple", {
      text: "Board meeting notes",
    });

    expect(encrypted.ciphertext).not.toContain("Board meeting notes");
    expect(encrypted.updatedAt).toBeGreaterThanOrEqual(encrypted.protectedAt);

    const decrypted = await decryptPrivateNote("correct horse battery staple", encrypted);
    expect(decrypted).toEqual({ text: "Board meeting notes" });
  });

  it("uses a short-lived unlock session timeout", () => {
    expect(PRIVATE_NOTE_AUTO_LOCK_MS).toBe(5 * 60 * 1000);
  });
});
