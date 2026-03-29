"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { getBrowserAuthErrorMessage } from "@/lib/supabase/browser-auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setNotice("Check your inbox for the password reset link.");
    } catch (error) {
      setError(getBrowserAuthErrorMessage(error));
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

      <header className="fixed top-0 z-50 w-full bg-[#fcf9f4]/80 shadow-sm backdrop-blur-xl">
        <div className="flex items-center justify-between px-8 py-4">
          <Link href="/" className="text-2xl text-[#1c1c19]" style={{ fontFamily: '"Newsreader", serif', fontStyle: 'italic' }}>
            Agy
          </Link>
          <Link href="/login" className="text-[#1c1c19]/60 transition-colors hover:text-[#a33818]" aria-label="Back to login">
            ←
          </Link>
        </div>
        <div className="h-px bg-gradient-to-b from-[#1c1c19]/5 to-transparent" />
      </header>

      <section className="relative z-10 flex flex-1 items-center justify-center overflow-hidden px-6 py-24">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -left-[10%] -top-[20%] h-[60%] w-[60%] rounded-full bg-[#a63a1a] opacity-[0.03] blur-[120px]" />
          <div className="absolute -bottom-[10%] -right-[5%] h-[50%] w-[50%] rounded-full bg-[#755717] opacity-[0.04] blur-[100px]" />
        </div>

        <section className="relative z-10 w-full max-w-md">
          <div className="group relative rounded-xl bg-white p-10 shadow-[0_10px_30px_rgba(28,28,25,0.06)] md:p-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-xl opacity-[0.02]"
              style={{
                backgroundImage:
                  "url(data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E)",
              }}
            />

            <header className="mb-12 relative">
              <h1 className="mb-4 text-4xl tracking-tight text-[#1c1c19] md:text-5xl" style={{ fontFamily: '"Newsreader", serif', fontWeight: 500 }}>
                Restore your space.
              </h1>
              <p className="leading-relaxed text-[#58423c] opacity-80">
                Enter the email associated with your atelier. We&apos;ll send a link to securely reset your credentials.
              </p>
            </header>

            <form onSubmit={onSubmit} className="relative space-y-10">
              <div>
                <label htmlFor="email" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#58423c]">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="curator@digital-atelier.com"
                  className="w-full border-0 border-b border-[#dfc0b8]/20 bg-transparent px-0 py-3 text-[#1c1c19] outline-none transition-colors placeholder:text-[#1c1c19]/20 focus:border-[#a33818]"
                />
              </div>

              {error && <p className="text-sm text-[#a33818]">{error}</p>}
              {notice && <p className="text-sm text-[#4d6356]">{notice}</p>}

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#a33818] px-8 py-4 font-medium text-white shadow-lg transition-all duration-300 hover:bg-[#c44f2e] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {busy ? "Sending..." : "Send Reset Link"}
                <span className="text-sm">→</span>
              </button>
            </form>

            <footer className="mt-12 text-center relative">
              <Link href="/login" className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4d6356] transition-colors hover:text-[#a33818]">
                <span className="text-xs">←</span>
                Back to login
              </Link>
            </footer>
          </div>

          <div className="absolute -bottom-6 -right-6 -z-10 h-24 w-24 rotate-12 rounded-xl bg-[#f6f3ee] opacity-40 transition-transform duration-700 hover:rotate-6" />
          <div className="absolute -left-4 -top-4 -z-10 h-12 w-12 rounded-full border border-[#dfc0b8]/10" />
        </section>
      </section>

      <footer className="w-full bg-transparent py-12 mt-20 flex flex-col items-center gap-4">
        <nav className="mb-4 flex gap-8">
          <Link href="/" className="text-[11px] uppercase tracking-[0.18em] text-[#1c1c19]/40 transition-all hover:text-[#a33818]">
            Privacy
          </Link>
          <Link href="/" className="text-[11px] uppercase tracking-[0.18em] text-[#1c1c19]/40 transition-all hover:text-[#a33818]">
            Terms
          </Link>
          <Link href="/" className="text-[11px] uppercase tracking-[0.18em] text-[#1c1c19]/40 transition-all hover:text-[#a33818]">
            Support
          </Link>
        </nav>
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#4d6356] opacity-80">© 2024 Agy. The Digital Atelier.</p>
      </footer>
    </main>
  );
}
