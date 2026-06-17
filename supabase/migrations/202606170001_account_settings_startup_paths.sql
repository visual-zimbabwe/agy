alter table public.account_settings
  drop constraint if exists account_settings_startup_default_page_check;

alter table public.account_settings
  add constraint account_settings_startup_default_page_check
  check (startup_default_page in ('/wall', '/decks', '/settings'));

update public.account_settings
set startup_default_page = '/wall'
where startup_default_page in ('/page', '/media');
