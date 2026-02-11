"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const supabase = createSupabaseBrowserClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setBusy(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace("/wall");
    router.refresh();
  };

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-100 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-zinc-300 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Sign in</h1>
        <p className="mt-1 text-sm text-zinc-600">Use your email and password for Idea-Wall cloud sync.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div>
            <label className="mb-1 block text-sm text-zinc-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-sm text-zinc-600">
          No account yet?{" "}
          <Link href="/signup" className="font-semibold text-zinc-900 underline">
            Create one
          </Link>
        </p>
      </section>
    </main>
  );
}
