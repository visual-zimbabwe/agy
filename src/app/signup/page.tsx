"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FieldLabel, TextField } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    const supabase = createSupabaseBrowserClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setBusy(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (!data.session) {
      setNotice("Check your email to confirm your account, then sign in.");
      return;
    }

    router.replace("/wall");
    router.refresh();
  };

  return (
    <main className="route-shell px-4 py-8 sm:px-6">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="order-2 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-glass)] p-4 text-sm text-[var(--color-text-muted)] shadow-[var(--shadow-md)] backdrop-blur-[var(--blur-panel)] lg:order-1 lg:p-6">
          <p className="text-[10px] font-semibold tracking-[0.14em] uppercase">Idea-Wall Account</p>
          <h1 className="mt-2 text-3xl leading-tight font-semibold text-[var(--color-text)] sm:text-4xl">Set up cloud sync.</h1>
          <p className="mt-3">Create your account to keep one wall in sync across desktop and mobile sessions.</p>
        </div>

        <Panel className="order-1 w-full p-5 motion-modal-enter sm:p-7 lg:order-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-2xl font-semibold text-[var(--color-text)]">Create account</h2>
            <Link href="/" className="text-xs font-medium text-[var(--color-text-muted)] underline-offset-2 hover:underline">
              Back home
            </Link>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Sign up to sync your wall across devices.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <TextField
                id="password"
                type="password"
                autoComplete="new-password"
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
            {notice && (
              <p className="rounded-[var(--radius-md)] border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {notice}
              </p>
            )}

            <Button type="submit" disabled={busy} variant="primary" className="mt-2 w-full">
              {busy ? "Creating..." : "Create account"}
            </Button>
          </form>

          <p className="mt-4 text-sm text-[var(--color-text-muted)]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[var(--color-text)] underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </Panel>
      </section>
    </main>
  );
}
