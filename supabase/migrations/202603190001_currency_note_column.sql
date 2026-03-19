alter table if exists public.notes
  add column if not exists currency jsonb;
