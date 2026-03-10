create table if not exists public.account_settings (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'system',
  startup_behavior text not null default 'continue_last',
  startup_default_page text not null default '/wall',
  auto_timezone boolean not null default true,
  manual_timezone text not null default 'UTC',
  keyboard_color_slots jsonb not null default '[]'::jsonb,
  wall_layout_prefs jsonb not null default '{}'::jsonb,
  controls_mode text not null default 'basic',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_settings_theme_check check (theme in ('system', 'light', 'dark')),
  constraint account_settings_startup_behavior_check check (startup_behavior in ('default_page', 'continue_last')),
  constraint account_settings_startup_default_page_check check (startup_default_page in ('/wall', '/decks')),
  constraint account_settings_controls_mode_check check (controls_mode in ('basic', 'advanced'))
);

create index if not exists idx_account_settings_updated on public.account_settings(updated_at desc);

drop trigger if exists set_account_settings_updated_at on public.account_settings;
create trigger set_account_settings_updated_at before update on public.account_settings
for each row execute function public.set_updated_at();

alter table public.account_settings enable row level security;

drop policy if exists account_settings_select_own on public.account_settings;
create policy account_settings_select_own on public.account_settings for select using (owner_id = auth.uid());
drop policy if exists account_settings_insert_own on public.account_settings;
create policy account_settings_insert_own on public.account_settings for insert with check (owner_id = auth.uid());
drop policy if exists account_settings_update_own on public.account_settings;
create policy account_settings_update_own on public.account_settings for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists account_settings_delete_own on public.account_settings;
create policy account_settings_delete_own on public.account_settings for delete using (owner_id = auth.uid());
