import { NextResponse } from "next/server";
import { z } from "zod";

import { normalizeAccountSettings } from "@/lib/account-settings";
import { requireApiUser } from "@/lib/api/auth";

const settingsSchema = z.object({
  theme: z.enum(["system", "light", "dark"]),
  startupBehavior: z.enum(["default_page", "continue_last"]),
  startupDefaultPage: z.enum(["/wall", "/page", "/decks", "/settings"]),
  autoTimezone: z.boolean(),
  manualTimezone: z.string().trim().min(1).max(120),
  keyboardColorSlots: z.array(z.string().nullable()).length(9),
  wallLayoutPrefs: z.object({
    showToolsPanel: z.boolean(),
    showDetailsPanel: z.boolean(),
    showContextBar: z.boolean(),
    showNoteTags: z.boolean(),
  }),
  controlsMode: z.enum(["basic", "advanced"]),
});

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const { data, error } = await auth.supabase
    .from("account_settings")
    .select("theme,startup_behavior,startup_default_page,auto_timezone,manual_timezone,keyboard_color_slots,wall_layout_prefs,controls_mode")
    .eq("owner_id", auth.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ settings: null });
  }

  return NextResponse.json({
    settings: normalizeAccountSettings({
      theme: data.theme,
      startupBehavior: data.startup_behavior,
      startupDefaultPage: data.startup_default_page,
      autoTimezone: data.auto_timezone,
      manualTimezone: data.manual_timezone,
      keyboardColorSlots: data.keyboard_color_slots,
      wallLayoutPrefs: data.wall_layout_prefs,
      controlsMode: data.controls_mode,
    }),
  });
}

export async function PUT(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const { error } = await auth.supabase.from("account_settings").upsert(
    {
      owner_id: auth.user.id,
      theme: payload.theme,
      startup_behavior: payload.startupBehavior,
      startup_default_page: payload.startupDefaultPage,
      auto_timezone: payload.autoTimezone,
      manual_timezone: payload.manualTimezone,
      keyboard_color_slots: payload.keyboardColorSlots,
      wall_layout_prefs: payload.wallLayoutPrefs,
      controls_mode: payload.controlsMode,
    },
    { onConflict: "owner_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: payload });
}
