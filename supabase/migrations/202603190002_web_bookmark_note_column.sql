alter table public.notes
  add column if not exists bookmark jsonb;
