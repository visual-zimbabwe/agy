"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export const createSupabaseBrowserClient = () => {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
  }
  return browserClient;
};
