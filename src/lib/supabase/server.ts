import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookieList) {
        for (const cookie of cookieList) {
          cookieStore.set(cookie.name, cookie.value, cookie.options);
        }
      },
    },
  });
};
