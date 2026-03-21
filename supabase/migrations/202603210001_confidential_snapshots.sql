alter table public.walls
  add column if not exists secure_snapshot jsonb;

alter table public.page_docs
  add column if not exists secure_snapshot jsonb;
