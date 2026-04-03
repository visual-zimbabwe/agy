import { createClient } from "@supabase/supabase-js";

import { getSupabaseServerUrl, getSupabaseServiceRoleKey } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

export const createSupabaseAdminClient = () =>
  createClient<Database>(getSupabaseServerUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
