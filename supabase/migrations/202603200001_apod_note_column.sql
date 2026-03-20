alter table public.notes
  add column if not exists apod jsonb;
