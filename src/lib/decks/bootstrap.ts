import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";
import { builtinDeckNoteTypes } from "@/features/decks/note-types";

export const ensureBuiltinDeckNoteTypes = async (supabase: SupabaseClient<Database>, user: User) => {
  const { data: existing, error } = await supabase
    .from("deck_note_types")
    .select("id,builtin_key,name")
    .eq("owner_id", user.id);
  if (error) {
    return { error } as const;
  }

  const existingByKey = new Set(
    (existing ?? [])
      .map((row) => row.builtin_key)
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  );

  const missing = builtinDeckNoteTypes.filter((type) => !existingByKey.has(type.builtinKey));
  if (missing.length === 0) {
    return { created: 0 } as const;
  }

  const payload = missing.map((type) => ({
    owner_id: user.id,
    name: type.name,
    builtin_key: type.builtinKey,
    fields: type.fields,
    front_template: type.frontTemplate,
    back_template: type.backTemplate,
    css: type.css,
    is_builtin: true,
  }));

  const { error: insertError } = await supabase.from("deck_note_types").insert(payload);
  if (insertError) {
    return { error: insertError } as const;
  }
  return { created: payload.length } as const;
};
