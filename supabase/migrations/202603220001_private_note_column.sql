alter table public.notes
add column if not exists private_note jsonb;
