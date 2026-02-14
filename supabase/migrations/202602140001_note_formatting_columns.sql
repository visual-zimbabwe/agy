alter table if exists public.notes
  add column if not exists image_url text,
  add column if not exists text_align text,
  add column if not exists text_v_align text,
  add column if not exists text_font text,
  add column if not exists text_color text;
