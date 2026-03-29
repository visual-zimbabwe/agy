"use client";

import type { Session, User } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const defaultBrowserAuthErrorMessage = "Authentication service is unavailable. Check your connection and try again.";

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

export const getSupabaseBrowserSessionSafely = async (): Promise<{ session: Session | null; error: Error | null }> => {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getSession();
    return {
      session: data.session,
      error: error ? toError(error.message) : null,
    };
  } catch (error) {
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
    return {
      user: data.user,
      error: error ? toError(error.message) : null,
    };
  } catch (error) {
    return {
      user: null,
      error: toError(error),
    };
  }
};
