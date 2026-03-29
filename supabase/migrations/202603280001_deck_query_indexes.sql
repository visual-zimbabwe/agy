create index if not exists idx_deck_cards_owner_deck_state_due
  on public.deck_cards(owner_id, deck_id, state, due_at asc);

create index if not exists idx_deck_cards_owner_deck_state_created
  on public.deck_cards(owner_id, deck_id, state, created_at asc);

create index if not exists idx_deck_notes_owner_deck_type_created
  on public.deck_notes(owner_id, deck_id, note_type_id, created_at desc);
