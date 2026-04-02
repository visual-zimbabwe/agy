create index if not exists idx_wall_changes_owner_wall_revision
  on public.wall_changes(owner_id, wall_id, revision asc);

create index if not exists idx_wall_changes_owner_wall_entity_revision
  on public.wall_changes(owner_id, wall_id, entity_type, entity_id, revision desc);
