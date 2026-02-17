alter table if exists public.notes
  add column if not exists note_kind text default 'standard',
  add column if not exists quote_author text,
  add column if not exists quote_source text;
