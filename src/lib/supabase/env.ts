const required = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

const optional = (value: string | undefined) => value?.trim() || undefined;

export const getSupabaseBrowserUrl = () =>
  optional(process.env.NEXT_PUBLIC_SUPABASE_BROWSER_URL) ??
  required(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");

export const getSupabaseServerUrl = () =>
  optional(process.env.SUPABASE_SERVER_URL) ??
  required(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");

export const getSupabaseProxyTarget = () =>
  optional(process.env.SUPABASE_PROXY_TARGET) ?? getSupabaseServerUrl();

export const getSupabaseAnonKey = () =>
  required(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY");

export const getSupabaseServiceRoleKey = () =>
  required(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY");
