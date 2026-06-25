import { describe, expect, it } from "vitest";

import { resolveProfileAvatarUrl } from "@/lib/profile";

describe("resolveProfileAvatarUrl", () => {
  it("rewrites localhost Supabase storage URLs to the app proxy path", () => {
    expect(
      resolveProfileAvatarUrl(
        "http://localhost:18000/storage/v1/object/public/profile-images/user-1/avatar.webp",
      ),
    ).toBe("/supabase/storage/v1/object/public/profile-images/user-1/avatar.webp");
  });

  it("keeps app-relative proxy URLs unchanged", () => {
    const url = "/supabase/storage/v1/object/public/profile-images/user-1/avatar.webp";
    expect(resolveProfileAvatarUrl(url)).toBe(url);
  });

  it("keeps external OAuth avatar URLs unchanged", () => {
    const url = "https://lh3.googleusercontent.com/a/example";
    expect(resolveProfileAvatarUrl(url)).toBe(url);
  });

  it("drops device-local blob and data URLs", () => {
    expect(resolveProfileAvatarUrl("blob:http://localhost:3000/abc")).toBeNull();
    expect(resolveProfileAvatarUrl("data:image/png;base64,abc")).toBeNull();
  });
});
