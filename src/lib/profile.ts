import type { User } from "@supabase/supabase-js";

export type AppUserProfile = {
  email: string;
  preferredName: string;
  avatarUrl: string | null;
};

const profileImagesBucket = "profile-images";
const profileImageStoragePathPattern = /\/storage\/v1\/object\/public\/profile-images\/(.+)$/i;

const readString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/** Rewrites Supabase storage URLs to the app proxy path so avatars load on any device/origin. */
export const resolveProfileAvatarUrl = (avatarUrl: string | null | undefined): string | null => {
  const raw = readString(avatarUrl);
  if (!raw) {
    return null;
  }

  if (raw.startsWith("blob:") || raw.startsWith("data:")) {
    return null;
  }

  if (raw.startsWith("/supabase/")) {
    return raw;
  }

  const storageMatch = raw.match(profileImageStoragePathPattern);
  if (storageMatch) {
    return `/supabase/storage/v1/object/public/${profileImagesBucket}/${storageMatch[1]}`;
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  return raw;
};

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
  const avatarUrl = resolveProfileAvatarUrl(
    readString(metadata?.avatar_url) || readString(metadata?.picture) || readString(metadata?.avatar),
  );

  return {
    email: readString(user?.email) || fallbackEmail,
    preferredName,
    avatarUrl,
  };
};
