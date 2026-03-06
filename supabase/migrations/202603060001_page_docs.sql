create table if not exists public.page_docs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  doc_id text not null,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, doc_id)
);

create index if not exists idx_page_docs_owner_updated on public.page_docs(owner_id, updated_at desc);
create index if not exists idx_page_docs_owner_doc on public.page_docs(owner_id, doc_id);

drop trigger if exists set_page_docs_updated_at on public.page_docs;
create trigger set_page_docs_updated_at before update on public.page_docs
for each row execute function public.set_updated_at();

alter table public.page_docs enable row level security;

drop policy if exists page_docs_select_own on public.page_docs;
create policy page_docs_select_own on public.page_docs for select using (owner_id = auth.uid());
drop policy if exists page_docs_insert_own on public.page_docs;
create policy page_docs_insert_own on public.page_docs for insert with check (owner_id = auth.uid());
drop policy if exists page_docs_update_own on public.page_docs;
create policy page_docs_update_own on public.page_docs for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists page_docs_delete_own on public.page_docs;
create policy page_docs_delete_own on public.page_docs for delete using (owner_id = auth.uid());
