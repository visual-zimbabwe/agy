alter table public.zones
add column if not exists kind text not null default 'frame';

