create index if not exists idx_notes_owner_wall_id_active
  on public.notes(owner_id, wall_id, id)
  where deleted_at is null;

create index if not exists idx_zones_owner_wall_id_active
  on public.zones(owner_id, wall_id, id)
  where deleted_at is null;

create index if not exists idx_zone_groups_owner_wall_id_active
  on public.zone_groups(owner_id, wall_id, id)
  where deleted_at is null;

create index if not exists idx_note_groups_owner_wall_id_active
  on public.note_groups(owner_id, wall_id, id)
  where deleted_at is null;

create index if not exists idx_links_owner_wall_id_active
  on public.links(owner_id, wall_id, id)
  where deleted_at is null;
