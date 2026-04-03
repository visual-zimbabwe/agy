import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseAnonKey, getSupabaseServerUrl } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseServerUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookieList) {
        try {
          for (const cookie of cookieList) {
            cookieStore.set(cookie.name, cookie.value, cookie.options);
          }
        } catch {
          // In Server Components, Next.js exposes a read-only cookie store.
          // Route Handlers and Server Actions can still write cookies.
        }
      },
    },
  });
};
