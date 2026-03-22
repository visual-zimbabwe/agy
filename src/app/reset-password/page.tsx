"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setNotice("Password updated. Redirecting to login...");
    window.setTimeout(() => {
      router.replace("/login");
      router.refresh();
    }, 900);
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
            "url(https://lh3.googleusercontent.com/aida-public/AB6AXuA4Z4xK8cBr8ZepnFuE5kv8RUhxzjvKW29bJRKUay6zoAjZPuMDmRD4jYs7fS9zwhlhp1XuTJ-p-4K8oHXfD40vxSisHgJOv7LtXWjgYsMzC9H-1t576W5ccBYWqi9VM7rSGOzrPLx7XgvO5ONQoNREN-qkkwAIHe6FC7x58vXuTL9lHUY-PyYK6hll7ye0Yc98Ik_uNKL7lZLwhTDZ0v5op_hQOGg-mT1KbKP_lrCW0Mhj6sU_b2A_rn4grgSioOWS9SVZK7cZlS_)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_46%,rgb(166_58_26_/_0.05),transparent_36%)]" />

      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-8">
        <Link href="/" className="text-3xl italic tracking-[-0.04em] text-[#a33818] transition-opacity hover:opacity-80" style={{ fontFamily: '"Newsreader", "Playfair Display", serif' }}>
          Agy
        </Link>
        <Link href="/login" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 transition-colors hover:text-[#a33818]">
          Back to login
        </Link>
      </header>

      <section className="relative z-10 flex flex-1 items-center justify-center px-6 pb-24 pt-8">
        <div className="w-full max-w-md">
          <div className="overflow-hidden rounded-[0.9rem] bg-white px-10 py-10 shadow-[0_10px_40px_rgba(28,28,25,0.04)] ring-1 ring-white/40 backdrop-blur-sm sm:px-12 sm:py-12">
            <div className="mb-10 text-center">
              <h1 className="text-4xl italic text-[#1c1c19]" style={{ fontFamily: '"Newsreader", "Playfair Display", serif', fontWeight: 500 }}>
                Choose a new password
              </h1>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8d837b]">Recovery link required before update</p>
            </div>

            {ready ? (
              <form onSubmit={onSubmit} className="space-y-8">
                <div>
                  <label htmlFor="password" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f6259]">
                    New password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full border-0 border-b border-[#dfc0b8]/30 bg-transparent px-0 py-3 text-lg text-[#1c1c19] outline-none transition-colors placeholder:text-stone-300 focus:border-[#a33818]"
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f6259]">
                    Confirm password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat the new password"
                    className="w-full border-0 border-b border-[#dfc0b8]/30 bg-transparent px-0 py-3 text-lg text-[#1c1c19] outline-none transition-colors placeholder:text-stone-300 focus:border-[#a33818]"
                  />
                </div>

                {error && <p className="text-sm text-[#a33818]">{error}</p>}
                {notice && <p className="text-sm text-[#4d6356]">{notice}</p>}

                <button
                  type="submit"
                  disabled={busy}
                  className="mt-2 flex w-full items-center justify-center rounded-full bg-[#a33818] px-6 py-4 text-base font-semibold text-white shadow-[0_12px_30px_rgba(163,56,24,0.14)] transition-all hover:bg-[#862303] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {busy ? "Updating..." : "Update password"}
                </button>
              </form>
            ) : (
              <div className="space-y-5 text-center">
                <p className="text-sm leading-7 text-stone-500">
                  Open this page from the recovery link in your email. If the link expired, request a new one.
                </p>
                <Link href="/forgot-password" className="inline-flex rounded-full bg-[#a33818] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(163,56,24,0.14)] transition hover:bg-[#862303]">
                  Request new link
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
