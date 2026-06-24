-- Phase 1: force light theme and remove controls_mode preference from active use.
update public.account_settings
set theme = 'light'
where theme is distinct from 'light';

update public.account_settings
set controls_mode = 'basic'
where controls_mode is distinct from 'basic';
