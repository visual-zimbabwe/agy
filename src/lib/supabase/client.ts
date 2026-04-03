"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

const getSupabaseBrowserStorageKey = () => {
  const baseUrl = new URL(getSupabaseUrl());
  return `sb-${baseUrl.hostname.split(".")[0]}-auth-token`;
};

export const createSupabaseBrowserClient = () => {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
  }
  return browserClient;
};

export const createFreshSupabaseBrowserClient = () =>
  createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), { isSingleton: false });

export const resetSupabaseBrowserClient = () => {
  browserClient = undefined;
};

export { getSupabaseBrowserStorageKey };
