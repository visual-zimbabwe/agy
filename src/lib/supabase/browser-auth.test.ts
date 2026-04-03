import { beforeEach, describe, expect, it, vi } from "vitest";

const createFreshSupabaseBrowserClient = vi.fn();
const resetSupabaseBrowserClient = vi.fn();
const getSupabaseBrowserStorageKey = vi.fn(() => "sb-test-auth-token");

vi.mock("@/lib/supabase/client", () => ({
  createFreshSupabaseBrowserClient,
  resetSupabaseBrowserClient,
  getSupabaseBrowserStorageKey,
}));

describe("browser auth helpers", () => {
  beforeEach(() => {
    document.cookie = "sb-test-auth-token=stale; path=/";
    document.cookie = "sb-test-auth-token.0=stale-chunk; path=/";
    document.cookie = "sb-test-auth-token-user=user; path=/";
    document.cookie = "unrelated-cookie=keep; path=/";
  });

  it("clears stale auth cookies when getSession hits an invalid refresh token", async () => {
    createFreshSupabaseBrowserClient.mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: { message: "Invalid Refresh Token: Refresh Token Not Found" },
        }),
      },
    });

    const { getSupabaseBrowserSessionSafely } = await import("@/lib/supabase/browser-auth");
    const result = await getSupabaseBrowserSessionSafely();

    expect(result).toEqual({ session: null, error: null });
    expect(resetSupabaseBrowserClient).toHaveBeenCalledTimes(1);
    expect(document.cookie).not.toContain("sb-test-auth-token=");
    expect(document.cookie).not.toContain("sb-test-auth-token.0=");
    expect(document.cookie).not.toContain("sb-test-auth-token-user=");
    expect(document.cookie).toContain("unrelated-cookie=keep");
  });

  it("preserves non-stale auth errors", async () => {
    createFreshSupabaseBrowserClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "Network request failed" },
        }),
      },
    });

    const { getSupabaseBrowserUserSafely } = await import("@/lib/supabase/browser-auth");
    const result = await getSupabaseBrowserUserSafely();

    expect(result.user).toBeNull();
    expect(result.error?.message).toBe("Network request failed");
    expect(resetSupabaseBrowserClient).not.toHaveBeenCalled();
    expect(document.cookie).toContain("sb-test-auth-token=");
  });
});
