const required = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

export const getSupabaseUrl = () => required(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");

export const getSupabaseAnonKey = () =>
  required(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY");

export const getSupabaseServiceRoleKey = () =>
  required(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY");
