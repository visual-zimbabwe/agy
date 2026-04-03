import type { User } from "@supabase/supabase-js";

export type AppUserProfile = {
  email: string;
  preferredName: string;
  avatarUrl: string | null;
};

const readString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export const readUserProfile = (
  user: Pick<User, "email" | "user_metadata"> | null | undefined,
  fallbackEmail = "Signed in",
): AppUserProfile => {
  const metadata = (user?.user_metadata ?? null) as Record<string, unknown> | null;
  const preferredName =
    readString(metadata?.preferred_name) ||
    readString(metadata?.full_name) ||
    readString(metadata?.name) ||
    readString(metadata?.display_name);
  const avatarUrl =
    readString(metadata?.avatar_url) ||
    readString(metadata?.picture) ||
    readString(metadata?.avatar);

  return {
    email: readString(user?.email) || fallbackEmail,
    preferredName,
    avatarUrl: avatarUrl || null,
  };
};
