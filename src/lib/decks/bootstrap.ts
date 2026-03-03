import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";
import { builtinDeckNoteTypes } from "@/features/decks/note-types";

export const ensureBuiltinDeckNoteTypes = async (supabase: SupabaseClient<Database>, user: User) => {
  const { data: existing, error } = await supabase
    .from("deck_note_types")
    .select("id,builtin_key,name,fields,front_template,back_template,css,is_builtin")
    .eq("owner_id", user.id);
  if (error) {
    return { error } as const;
  }

  const existingByKey = new Map(
    (existing ?? [])
      .filter((row): row is NonNullable<typeof row> & { builtin_key: string } => typeof row.builtin_key === "string" && row.builtin_key.length > 0)
      .map((row) => [row.builtin_key, row]),
  );

  const missing = builtinDeckNoteTypes.filter((type) => !existingByKey.has(type.builtinKey));
  if (missing.length === 0) {
    for (const type of builtinDeckNoteTypes) {
      const current = existingByKey.get(type.builtinKey);
      if (!current || current.is_builtin !== true) {
        continue;
      }
      const fieldsChanged = JSON.stringify(current.fields ?? []) !== JSON.stringify(type.fields);
      if (
        fieldsChanged ||
        current.name !== type.name ||
        (current.front_template ?? "") !== type.frontTemplate ||
        (current.back_template ?? "") !== type.backTemplate ||
        (current.css ?? "") !== type.css
      ) {
        const { error: updateError } = await supabase
          .from("deck_note_types")
          .update({
            name: type.name,
            fields: type.fields,
            front_template: type.frontTemplate,
            back_template: type.backTemplate,
            css: type.css,
          })
          .eq("owner_id", user.id)
          .eq("id", current.id);
        if (updateError) {
          return { error: updateError } as const;
        }
      }
    }
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

  for (const type of builtinDeckNoteTypes) {
    const current = existingByKey.get(type.builtinKey);
    if (!current || current.is_builtin !== true) {
      continue;
    }
    const fieldsChanged = JSON.stringify(current.fields ?? []) !== JSON.stringify(type.fields);
    if (
      fieldsChanged ||
      current.name !== type.name ||
      (current.front_template ?? "") !== type.frontTemplate ||
      (current.back_template ?? "") !== type.backTemplate ||
      (current.css ?? "") !== type.css
    ) {
      const { error: updateError } = await supabase
        .from("deck_note_types")
        .update({
          name: type.name,
          fields: type.fields,
          front_template: type.frontTemplate,
          back_template: type.backTemplate,
          css: type.css,
        })
        .eq("owner_id", user.id)
        .eq("id", current.id);
      if (updateError) {
        return { error: updateError } as const;
      }
    }
  }
  return { created: payload.length } as const;
};
