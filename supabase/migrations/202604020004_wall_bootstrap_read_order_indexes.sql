create index if not exists idx_notes_owner_wall_active_updated
  on public.notes(owner_id, wall_id, updated_at desc, id desc)
  where deleted_at is null;

create index if not exists idx_zones_owner_wall_active_updated
  on public.zones(owner_id, wall_id, updated_at desc, id desc)
  where deleted_at is null;
