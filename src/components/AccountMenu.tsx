"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AccountMenuProps = {
  email: string;
};

export const AccountMenu = ({ email }: AccountMenuProps) => {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
    setBusy(false);
  };

  return (
    <div className="pointer-events-auto fixed right-3 top-3 z-[95] flex items-center gap-2 rounded-xl border border-zinc-300 bg-white/95 px-3 py-2 text-xs shadow-md backdrop-blur-sm">
      <span className="max-w-56 truncate text-zinc-700">{email}</span>
      <button
        type="button"
        onClick={() => {
          void signOut();
        }}
        disabled={busy}
        className="rounded-md border border-zinc-300 px-2 py-1 font-semibold text-zinc-700 disabled:opacity-50"
      >
        Sign out
      </button>
    </div>
  );
};
