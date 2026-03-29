"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { consumeAuthRedirectState } from "@/lib/api/client-auth";
import { getBrowserAuthErrorMessage, getSupabaseBrowserSessionSafely } from "@/lib/supabase/browser-auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [nextPath, setNextPath] = useState("/wall");

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) {
        return;
      }
      const redirectState = consumeAuthRedirectState();
      if (redirectState.reason) {
        setError(redirectState.reason);
      }
      if (redirectState.nextPath) {
        setNextPath(redirectState.nextPath);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      const rawBody = await response.text();
      let payload: { error?: string } | null = null;
      if (contentType.includes("application/json") && rawBody) {
        try {
          payload = JSON.parse(rawBody) as { error?: string };
        } catch {
          payload = null;
        }
      }

      if (!response.ok) {
        const fallbackMessage =
          response.status === 401
            ? "Invalid email or password."
            : rawBody && !rawBody.startsWith("<")
              ? rawBody
              : "Unable to sign in. Please try again.";

        setError(payload?.error ?? fallbackMessage);
        return;
      }

      // Keep the browser auth client warm so downstream listeners can observe the fresh cookie-backed session.
      const { error: sessionError } = await getSupabaseBrowserSessionSafely();
      if (sessionError) {
        throw sessionError;
      }

      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      const message =
        `Unable to reach sign-in service. ${getBrowserAuthErrorMessage(error)}`;
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      className="relative flex min-h-screen flex-col overflow-hidden bg-[#fcf9f4] text-[#1c1c19]"
      style={{
        backgroundImage:
          "radial-gradient(at 0% 0%, rgba(163, 56, 24, 0.03) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(117, 87, 23, 0.03) 0, transparent 50%)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "url(https://lh3.googleusercontent.com/aida-public/AB6AXuA4Z4xK8cBr8ZepnFuE5kv8RUhxzjvKW29bJRKUay6zoAjZPuMDmRD4jYs7fS9zwhlhp1XuTJ-p-4K8oHXfD40vxSisHgJOv7LtXWjgYsMzC9H-1t576W5ccBYWqi9VM7rSGOzrPLx7XgvO5ONQoNREN-qkkwAIHe6FC7xX58vXuTL9lHUY-PyYK6hll7ye0Yc98Ik_uNKL7lZLwhTDZ0v5op_hQOGg-mT1KbKP_lrCW0Mhj6sU_b2A_rn4grgSioOWS9SVZK7cZlS_)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_46%,rgb(166_58_26_/_0.05),transparent_36%)]" />

      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-8">
        <Link
          href="/"
          className="text-3xl italic tracking-[-0.04em] text-[#a33818] transition-opacity hover:opacity-80"
          style={{ fontFamily: '"Newsreader", "Playfair Display", serif' }}
        >
          Agy
        </Link>
        <Link href="/" className="rounded-full p-2 text-[#756d66] transition-colors hover:text-[#a33818]" aria-label="Back home">
          ?
        </Link>
      </header>

      <section className="relative z-10 flex flex-1 items-center justify-center px-6 pb-24 pt-8">
        <div className="w-full max-w-md">
          <div className="overflow-hidden rounded-[0.9rem] bg-white px-10 py-10 shadow-[0_10px_40px_rgba(28,28,25,0.04)] ring-1 ring-white/40 backdrop-blur-sm sm:px-12 sm:py-12">
            <div className="mb-10 text-center">
              <h1
                className="text-5xl italic text-[#1c1c19]"
                style={{ fontFamily: '"Newsreader", "Playfair Display", serif', fontWeight: 500 }}
              >
                Agy
              </h1>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8d837b]">The Digital Atelier for Thought</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-8">
              <div>
                <label htmlFor="email" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f6259]">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="curator@atelier.agy"
                  className="w-full border-0 border-b border-[#dfc0b8]/30 bg-transparent px-0 py-3 text-lg text-[#1c1c19] outline-none transition-colors placeholder:text-stone-300 focus:border-[#a33818]"
                />
              </div>

              <div>
                <div className="mb-1 flex items-end justify-between gap-4">
                  <label htmlFor="password" className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f6259]">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a33818] transition-colors hover:text-[#862303]">
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full border-0 border-b border-[#dfc0b8]/30 bg-transparent px-0 py-3 text-lg text-[#1c1c19] outline-none transition-colors placeholder:text-stone-300 focus:border-[#a33818]"
                />
              </div>

              {error && <p className="text-sm text-[#a33818]">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="mt-2 flex w-full items-center justify-center rounded-full bg-[#a33818] px-6 py-4 text-base font-semibold text-white shadow-[0_12px_30px_rgba(163,56,24,0.14)] transition-all hover:bg-[#862303] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {busy ? "Entering..." : "Enter the Wall"}
              </button>
            </form>

            <div className="mt-12 text-center">
              <p className="text-sm text-stone-500">
                New to the atelier?
                <Link href="/signup" className="ml-1 font-semibold text-[#755717] transition-colors hover:text-[#5d4201]">
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4 text-center opacity-60">
            <div className="flex justify-center gap-6 text-[9px] font-semibold uppercase tracking-[0.2em] text-stone-500">
              <Link href="/" className="transition-colors hover:text-[#a33818]">
                Privacy Policy
              </Link>
              <Link href="/" className="transition-colors hover:text-[#a33818]">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 px-6 pb-12 text-[10px] uppercase tracking-[0.18em] text-stone-400 sm:px-8">
        <Link href="/signup" className="transition-colors hover:text-[#a33818]">
          Enter the Beta
        </Link>
        <Link href="/signup" className="transition-colors hover:text-[#a33818]">
          Request Access
        </Link>
        <Link href="/" className="transition-colors hover:text-[#a33818]">
          Privacy
        </Link>
        <span className="sm:ml-auto">© 2024 Agy Digital Atelier.</span>
      </footer>
    </main>
  );
}
