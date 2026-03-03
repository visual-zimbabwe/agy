create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  parent_id uuid references public.decks(id) on delete cascade,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deck_note_types (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  builtin_key text,
  fields jsonb not null default '[]'::jsonb,
  front_template text not null default '',
  back_template text not null default '',
  css text not null default '',
  is_builtin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, name)
);

create table if not exists public.deck_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  deck_id uuid not null references public.decks(id) on delete cascade,
  note_type_id uuid not null references public.deck_note_types(id) on delete restrict,
  sort_field text not null default '',
  fields jsonb not null default '{}'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  suspended boolean not null default false,
  flagged boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deck_cards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  deck_id uuid not null references public.decks(id) on delete cascade,
  note_id uuid not null references public.deck_notes(id) on delete cascade,
  card_ordinal integer not null default 0,
  prompt text not null default '',
  answer text not null default '',
  state text not null default 'new',
  step integer not null default 0,
  interval_days integer not null default 0,
  ease_factor double precision not null default 2.5,
  reps integer not null default 0,
  lapses integer not null default 0,
  due_at timestamptz,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(note_id, card_ordinal)
);

create table if not exists public.deck_reviews (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  deck_id uuid not null references public.decks(id) on delete cascade,
  card_id uuid not null references public.deck_cards(id) on delete cascade,
  rating text not null,
  state_before text not null,
  state_after text not null,
  interval_days_after integer not null default 0,
  reviewed_at timestamptz not null default now()
);

create table if not exists public.deck_import_presets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  mapping jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, name)
);

create index if not exists idx_decks_owner_parent on public.decks(owner_id, parent_id);
create index if not exists idx_decks_owner_updated on public.decks(owner_id, updated_at desc);
create index if not exists idx_deck_note_types_owner_builtin on public.deck_note_types(owner_id, is_builtin);
create index if not exists idx_deck_notes_owner_deck_updated on public.deck_notes(owner_id, deck_id, updated_at desc);
create index if not exists idx_deck_cards_owner_deck_due on public.deck_cards(owner_id, deck_id, due_at asc);
create index if not exists idx_deck_cards_owner_note on public.deck_cards(owner_id, note_id);
create index if not exists idx_deck_reviews_owner_deck_time on public.deck_reviews(owner_id, deck_id, reviewed_at desc);
create index if not exists idx_deck_import_presets_owner_updated on public.deck_import_presets(owner_id, updated_at desc);

drop trigger if exists set_decks_updated_at on public.decks;
create trigger set_decks_updated_at before update on public.decks
for each row execute function public.set_updated_at();

drop trigger if exists set_deck_note_types_updated_at on public.deck_note_types;
create trigger set_deck_note_types_updated_at before update on public.deck_note_types
for each row execute function public.set_updated_at();

drop trigger if exists set_deck_notes_updated_at on public.deck_notes;
create trigger set_deck_notes_updated_at before update on public.deck_notes
for each row execute function public.set_updated_at();

drop trigger if exists set_deck_cards_updated_at on public.deck_cards;
create trigger set_deck_cards_updated_at before update on public.deck_cards
for each row execute function public.set_updated_at();

drop trigger if exists set_deck_import_presets_updated_at on public.deck_import_presets;
create trigger set_deck_import_presets_updated_at before update on public.deck_import_presets
for each row execute function public.set_updated_at();

alter table public.decks enable row level security;
alter table public.deck_note_types enable row level security;
alter table public.deck_notes enable row level security;
alter table public.deck_cards enable row level security;
alter table public.deck_reviews enable row level security;
alter table public.deck_import_presets enable row level security;

drop policy if exists decks_select_own on public.decks;
create policy decks_select_own on public.decks for select using (owner_id = auth.uid());
drop policy if exists decks_insert_own on public.decks;
create policy decks_insert_own on public.decks for insert with check (owner_id = auth.uid());
drop policy if exists decks_update_own on public.decks;
create policy decks_update_own on public.decks for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists decks_delete_own on public.decks;
create policy decks_delete_own on public.decks for delete using (owner_id = auth.uid());

drop policy if exists deck_note_types_select_own on public.deck_note_types;
create policy deck_note_types_select_own on public.deck_note_types for select using (owner_id = auth.uid());
drop policy if exists deck_note_types_insert_own on public.deck_note_types;
create policy deck_note_types_insert_own on public.deck_note_types for insert with check (owner_id = auth.uid());
drop policy if exists deck_note_types_update_own on public.deck_note_types;
create policy deck_note_types_update_own on public.deck_note_types for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists deck_note_types_delete_own on public.deck_note_types;
create policy deck_note_types_delete_own on public.deck_note_types for delete using (owner_id = auth.uid());

drop policy if exists deck_notes_select_own on public.deck_notes;
create policy deck_notes_select_own on public.deck_notes for select using (owner_id = auth.uid());
drop policy if exists deck_notes_insert_own on public.deck_notes;
create policy deck_notes_insert_own on public.deck_notes for insert with check (owner_id = auth.uid());
drop policy if exists deck_notes_update_own on public.deck_notes;
create policy deck_notes_update_own on public.deck_notes for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists deck_notes_delete_own on public.deck_notes;
create policy deck_notes_delete_own on public.deck_notes for delete using (owner_id = auth.uid());

drop policy if exists deck_cards_select_own on public.deck_cards;
create policy deck_cards_select_own on public.deck_cards for select using (owner_id = auth.uid());
drop policy if exists deck_cards_insert_own on public.deck_cards;
create policy deck_cards_insert_own on public.deck_cards for insert with check (owner_id = auth.uid());
drop policy if exists deck_cards_update_own on public.deck_cards;
create policy deck_cards_update_own on public.deck_cards for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists deck_cards_delete_own on public.deck_cards;
create policy deck_cards_delete_own on public.deck_cards for delete using (owner_id = auth.uid());

drop policy if exists deck_reviews_select_own on public.deck_reviews;
create policy deck_reviews_select_own on public.deck_reviews for select using (owner_id = auth.uid());
drop policy if exists deck_reviews_insert_own on public.deck_reviews;
create policy deck_reviews_insert_own on public.deck_reviews for insert with check (owner_id = auth.uid());
drop policy if exists deck_reviews_update_own on public.deck_reviews;
create policy deck_reviews_update_own on public.deck_reviews for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists deck_reviews_delete_own on public.deck_reviews;
create policy deck_reviews_delete_own on public.deck_reviews for delete using (owner_id = auth.uid());

drop policy if exists deck_import_presets_select_own on public.deck_import_presets;
create policy deck_import_presets_select_own on public.deck_import_presets for select using (owner_id = auth.uid());
drop policy if exists deck_import_presets_insert_own on public.deck_import_presets;
create policy deck_import_presets_insert_own on public.deck_import_presets for insert with check (owner_id = auth.uid());
drop policy if exists deck_import_presets_update_own on public.deck_import_presets;
create policy deck_import_presets_update_own on public.deck_import_presets for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists deck_import_presets_delete_own on public.deck_import_presets;
create policy deck_import_presets_delete_own on public.deck_import_presets for delete using (owner_id = auth.uid());
