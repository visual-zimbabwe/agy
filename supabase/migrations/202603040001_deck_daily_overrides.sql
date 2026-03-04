create table if not exists public.deck_daily_overrides (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  deck_id uuid not null references public.decks(id) on delete cascade,
  study_date date not null,
  extra_new_limit integer not null default 0,
  extra_review_limit integer not null default 0,
  new_served_count integer not null default 0,
  review_served_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, deck_id, study_date)
);

create index if not exists idx_deck_daily_overrides_owner_deck_date
  on public.deck_daily_overrides(owner_id, deck_id, study_date desc);

drop trigger if exists set_deck_daily_overrides_updated_at on public.deck_daily_overrides;
create trigger set_deck_daily_overrides_updated_at before update on public.deck_daily_overrides
for each row execute function public.set_updated_at();

alter table public.deck_daily_overrides enable row level security;

drop policy if exists deck_daily_overrides_select_own on public.deck_daily_overrides;
create policy deck_daily_overrides_select_own on public.deck_daily_overrides
for select using (owner_id = auth.uid());

drop policy if exists deck_daily_overrides_insert_own on public.deck_daily_overrides;
create policy deck_daily_overrides_insert_own on public.deck_daily_overrides
for insert with check (owner_id = auth.uid());

drop policy if exists deck_daily_overrides_update_own on public.deck_daily_overrides;
create policy deck_daily_overrides_update_own on public.deck_daily_overrides
for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists deck_daily_overrides_delete_own on public.deck_daily_overrides;
create policy deck_daily_overrides_delete_own on public.deck_daily_overrides
for delete using (owner_id = auth.uid());
