alter table if exists public.notes
  add column if not exists pinned boolean not null default false,
  add column if not exists highlighted boolean not null default false;

create table if not exists public.note_groups (
  id text primary key,
  wall_id uuid not null references public.walls(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  color text not null,
  note_ids jsonb not null default '[]'::jsonb,
  collapsed boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create index if not exists idx_note_groups_owner_wall_updated
  on public.note_groups(owner_id, wall_id, updated_at desc);

alter table public.note_groups enable row level security;

drop policy if exists note_groups_select_own on public.note_groups;
create policy note_groups_select_own on public.note_groups for select using (owner_id = auth.uid());
drop policy if exists note_groups_insert_own on public.note_groups;
create policy note_groups_insert_own on public.note_groups for insert with check (owner_id = auth.uid());
drop policy if exists note_groups_update_own on public.note_groups;
create policy note_groups_update_own on public.note_groups for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists note_groups_delete_own on public.note_groups;
create policy note_groups_delete_own on public.note_groups for delete using (owner_id = auth.uid());
