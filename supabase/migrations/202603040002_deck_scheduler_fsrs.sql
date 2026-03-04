alter table public.decks
  add column if not exists scheduler_mode text not null default 'legacy',
  add column if not exists fsrs_params jsonb not null default '{
    "desiredRetention": 0.9,
    "hardFactor": 1.2,
    "easyBonus": 1.65,
    "againPenalty": 0.55,
    "learningStepsMinutes": [1, 10],
    "lapseIntervalMinutes": 10,
    "minReviewDays": 1,
    "maxIntervalDays": 36500
  }'::jsonb,
  add column if not exists fsrs_optimized_at timestamptz;

update public.decks
set scheduler_mode = coalesce(nullif(scheduler_mode, ''), 'legacy')
where scheduler_mode is null or scheduler_mode = '';

alter table public.decks
  drop constraint if exists decks_scheduler_mode_check;

alter table public.decks
  add constraint decks_scheduler_mode_check check (scheduler_mode in ('legacy', 'fsrs'));
