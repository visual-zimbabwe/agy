"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseAnonKey, getSupabaseBrowserUrl } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

const resolveSupabaseBrowserUrl = () => {
  const rawUrl = getSupabaseBrowserUrl();
  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }

  if (typeof window !== "undefined") {
    return new URL(rawUrl, window.location.origin).toString();
  }

  return new URL(rawUrl, "http://localhost").toString();
};

const getSupabaseBrowserStorageKey = () => {
  const baseUrl = new URL(resolveSupabaseBrowserUrl());
  return `sb-${baseUrl.hostname.split(".")[0]}-auth-token`;
};

export const createSupabaseBrowserClient = () => {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(resolveSupabaseBrowserUrl(), getSupabaseAnonKey());
  }
  return browserClient;
};

export const createFreshSupabaseBrowserClient = () =>
  createBrowserClient<Database>(resolveSupabaseBrowserUrl(), getSupabaseAnonKey(), { isSingleton: false });

export const resetSupabaseBrowserClient = () => {
  browserClient = undefined;
};

export { getSupabaseBrowserStorageKey };
