"use client";

import type { Session, User } from "@supabase/supabase-js";

import {
  createSupabaseBrowserClient,
  getSupabaseBrowserStorageKey,
  resetSupabaseBrowserClient,
} from "@/lib/supabase/client";

const defaultBrowserAuthErrorMessage = "Authentication service is unavailable. Check your connection and try again.";
const staleRefreshTokenPattern = /(invalid refresh token|refresh token not found)/i;

const toError = (error: unknown, fallback = defaultBrowserAuthErrorMessage) => {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === "string" && error.trim()) {
    return new Error(error);
  }
  return new Error(fallback);
};

export const getBrowserAuthErrorMessage = (error: unknown, fallback = defaultBrowserAuthErrorMessage) =>
  toError(error, fallback).message || fallback;

const isStaleRefreshTokenError = (error: unknown) => staleRefreshTokenPattern.test(toError(error).message);

const clearCookie = (name: string) => {
  document.cookie = `${encodeURIComponent(name)}=; Max-Age=0; path=/; SameSite=Lax`;
};

const clearSupabaseBrowserAuthCookies = () => {
  if (typeof document === "undefined") {
    return;
  }

  const storageKey = getSupabaseBrowserStorageKey();
  const removablePrefixes = [
    storageKey,
    `${storageKey}-user`,
    `${storageKey}-code-verifier`,
  ];
  const cookieNames = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => decodeURIComponent(entry.split("=")[0] ?? ""));

  for (const cookieName of cookieNames) {
    if (removablePrefixes.some((prefix) => cookieName === prefix || cookieName.startsWith(`${prefix}.`))) {
      clearCookie(cookieName);
    }
  }
};

const recoverFromStaleRefreshToken = (error: unknown) => {
  if (!isStaleRefreshTokenError(error)) {
    return false;
  }

  clearSupabaseBrowserAuthCookies();
  resetSupabaseBrowserClient();
  return true;
};

export const getSupabaseBrowserSessionSafely = async (): Promise<{ session: Session | null; error: Error | null }> => {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getSession();
    if (error && recoverFromStaleRefreshToken(error.message)) {
      return {
        session: null,
        error: null,
      };
    }
    return {
      session: data.session,
      error: error ? toError(error.message) : null,
    };
  } catch (error) {
    if (recoverFromStaleRefreshToken(error)) {
      return {
        session: null,
        error: null,
      };
    }
    return {
      session: null,
      error: toError(error),
    };
  }
};

export const getSupabaseBrowserUserSafely = async (): Promise<{ user: User | null; error: Error | null }> => {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getUser();
    if (error && recoverFromStaleRefreshToken(error.message)) {
      return {
        user: null,
        error: null,
      };
    }
    return {
      user: data.user,
      error: error ? toError(error.message) : null,
    };
  } catch (error) {
    if (recoverFromStaleRefreshToken(error)) {
      return {
        user: null,
        error: null,
      };
    }
    return {
      user: null,
      error: toError(error),
    };
  }
};
