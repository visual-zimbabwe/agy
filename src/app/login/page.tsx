"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FieldLabel, TextField } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
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
    <main className="route-shell px-5 py-10 sm:px-8 sm:py-12">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center gap-7 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="order-2 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-glass)] p-6 text-sm text-[var(--color-text-muted)] shadow-[var(--shadow-sm)] backdrop-blur-[var(--blur-panel)] lg:order-1 lg:p-8">
          <p className="text-[10px] font-semibold tracking-[0.14em] uppercase">Agy Account</p>
          <h1 className="mt-3 text-3xl leading-tight font-semibold text-[var(--color-text)] sm:text-4xl">Return to your wall.</h1>
          <p className="mt-4 leading-7">Sign in to sync notes, links, and zones across devices while keeping local-first speed.</p>
        </div>

        <Panel className="order-1 w-full p-6 motion-modal-enter sm:p-8 lg:order-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-2xl font-semibold text-[var(--color-text)]">Sign in</h2>
            <Link href="/" className="text-xs font-medium text-[var(--color-text-muted)] underline-offset-2 hover:underline">
              Back home
            </Link>
          </div>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Use your email and password for cloud sync.</p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <div className="space-y-2">
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <TextField
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <TextField
                id="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {error && (
              <p className="rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger-strong)]">
                {error}
              </p>
            )}

            <Button type="submit" disabled={busy} variant="primary" className="mt-2 w-full">
              {busy ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-4 text-sm text-[var(--color-text-muted)]">
            No account yet?{" "}
            <Link href="/signup" className="font-semibold text-[var(--color-text)] underline underline-offset-2">
              Create one
            </Link>
          </p>
        </Panel>
      </section>
    </main>
  );
}

