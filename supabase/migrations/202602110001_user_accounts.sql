create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.walls (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'My Wall',
  camera_x double precision not null default 0,
  camera_y double precision not null default 0,
  camera_zoom double precision not null default 1,
  last_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  id text primary key,
  wall_id uuid not null references public.walls(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  text text not null default '',
  tags jsonb not null default '[]'::jsonb,
  text_size text,
  x double precision not null,
  y double precision not null,
  w double precision not null,
  h double precision not null,
  color text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table if not exists public.zones (
  id text primary key,
  wall_id uuid not null references public.walls(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  group_id text,
  x double precision not null,
  y double precision not null,
  w double precision not null,
  h double precision not null,
  color text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table if not exists public.zone_groups (
  id text primary key,
  wall_id uuid not null references public.walls(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  color text not null,
  zone_ids jsonb not null default '[]'::jsonb,
  collapsed boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table if not exists public.links (
  id text primary key,
  wall_id uuid not null references public.walls(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  from_note_id text not null,
  to_note_id text not null,
  type text not null,
  label text not null default '',
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create index if not exists idx_walls_owner_updated on public.walls(owner_id, updated_at desc);
create index if not exists idx_notes_owner_wall_updated on public.notes(owner_id, wall_id, updated_at desc);
create index if not exists idx_zones_owner_wall_updated on public.zones(owner_id, wall_id, updated_at desc);
create index if not exists idx_zone_groups_owner_wall_updated on public.zone_groups(owner_id, wall_id, updated_at desc);
create index if not exists idx_links_owner_wall_updated on public.links(owner_id, wall_id, updated_at desc);

drop trigger if exists set_walls_updated_at on public.walls;
create trigger set_walls_updated_at before update on public.walls
for each row execute function public.set_updated_at();

alter table public.walls enable row level security;
alter table public.notes enable row level security;
alter table public.zones enable row level security;
alter table public.zone_groups enable row level security;
alter table public.links enable row level security;

drop policy if exists walls_select_own on public.walls;
create policy walls_select_own on public.walls for select using (owner_id = auth.uid());
drop policy if exists walls_insert_own on public.walls;
create policy walls_insert_own on public.walls for insert with check (owner_id = auth.uid());
drop policy if exists walls_update_own on public.walls;
create policy walls_update_own on public.walls for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists walls_delete_own on public.walls;
create policy walls_delete_own on public.walls for delete using (owner_id = auth.uid());

drop policy if exists notes_select_own on public.notes;
create policy notes_select_own on public.notes for select using (owner_id = auth.uid());
drop policy if exists notes_insert_own on public.notes;
create policy notes_insert_own on public.notes for insert with check (owner_id = auth.uid());
drop policy if exists notes_update_own on public.notes;
create policy notes_update_own on public.notes for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists notes_delete_own on public.notes;
create policy notes_delete_own on public.notes for delete using (owner_id = auth.uid());

drop policy if exists zones_select_own on public.zones;
create policy zones_select_own on public.zones for select using (owner_id = auth.uid());
drop policy if exists zones_insert_own on public.zones;
create policy zones_insert_own on public.zones for insert with check (owner_id = auth.uid());
drop policy if exists zones_update_own on public.zones;
create policy zones_update_own on public.zones for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists zones_delete_own on public.zones;
create policy zones_delete_own on public.zones for delete using (owner_id = auth.uid());

drop policy if exists zone_groups_select_own on public.zone_groups;
create policy zone_groups_select_own on public.zone_groups for select using (owner_id = auth.uid());
drop policy if exists zone_groups_insert_own on public.zone_groups;
create policy zone_groups_insert_own on public.zone_groups for insert with check (owner_id = auth.uid());
drop policy if exists zone_groups_update_own on public.zone_groups;
create policy zone_groups_update_own on public.zone_groups for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists zone_groups_delete_own on public.zone_groups;
create policy zone_groups_delete_own on public.zone_groups for delete using (owner_id = auth.uid());

drop policy if exists links_select_own on public.links;
create policy links_select_own on public.links for select using (owner_id = auth.uid());
drop policy if exists links_insert_own on public.links;
create policy links_insert_own on public.links for insert with check (owner_id = auth.uid());
drop policy if exists links_update_own on public.links;
create policy links_update_own on public.links for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists links_delete_own on public.links;
create policy links_delete_own on public.links for delete using (owner_id = auth.uid());
