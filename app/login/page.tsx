"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * ARCHIFI — Login Page
 * Matches the premium ArchiFi styling.
 * Uses localStorage stub: archifi:user / archifi:token
 */

const isValidEmail = (v: string) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(v.trim());

const classCard =
  "bg-white shadow-sm ring-1 ring-black/5 rounded-2xl p-6 md:p-8 max-w-md w-full";
const classInput =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-black/70 focus:border-transparent transition";
const classBtn =
  "inline-flex items-center justify-center rounded-xl px-4 py-3 font-medium text-white bg-black hover:bg-black/90 active:bg-black/80 disabled:bg-black/30 disabled:cursor-not-allowed transition w-full";

// Simulated login (replace with real API later)
async function postLogin(email: string) {
  await new Promise((r) => setTimeout(r, 650));
  return {
    ok: true,
    user: { id: "usr_" + Math.random().toString(36).slice(2, 10), email },
    token: "tok_" + Math.random().toString(36).slice(2, 12),
  } as const;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => isValidEmail(email) && agree && !loading,
    [email, agree, loading]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email)) {
      setError("Please enter a valid email.");
      return;
    }
    if (!agree) {
      setError("Please accept the terms to continue.");
      return;
    }
    setLoading(true);
    try {
      const res = await postLogin(email.trim());
      if (!res.ok) throw new Error("Login failed");

      localStorage.setItem(
        "archifi:user",
        JSON.stringify({ id: res.user.id, email: res.user.email })
      );
      localStorage.setItem("archifi:token", res.token);

      router.replace("/"); // go to the app
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] w-full bg-neutral-50">
      {/* Top bar / brand */}
      <header className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="flex items-center gap-3 py-6">
          <div className="size-9 rounded-2xl bg-black text-white grid place-items-center shadow-sm">
            <span className="text-sm font-semibold tracking-wide">A</span>
          </div>
          <div className="text-xl font-semibold tracking-tight">ARCHIFI</div>
          <div className="ml-auto text-sm text-black/50">Sign in</div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto grid place-items-start md:place-items-center w-full max-w-6xl px-4 md:px-6">
        <div className="mt-2 md:mt-8" />
        <section className={classCard}>
          <div className="space-y-2 mb-6">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">ArchiFi Log In</h1>
            <p className="text-sm text-black/60">Enter your email to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-black/80">Email</label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@company.com"
              className={classInput}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!error && !isValidEmail(email)}
            />

            <label className="flex items-start gap-3 text-sm text-black/70 select-none">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-1 size-4 rounded border-black/20 text-black focus:ring-black/70"
              />
              <span>
                I agree to the <a className="underline decoration-black/30 hover:decoration-black" href="#">Terms</a>{" "}
                and <a className="underline decoration-black/30 hover:decoration-black" href="#">Privacy Policy</a>.
              </span>
            </label>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button type="submit" className={classBtn} disabled={!canSubmit}>
              {loading ? "Signing in…" : "Continue"}
            </button>
          </form>
        </section>

        <div className="h-16 md:h-24" />
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-6xl px-4 md:px-6 pb-8 text-xs text-black/40">
        © {new Date().getFullYear()} ARCHIFI. All rights reserved.
      </footer>
    </div>
  );
}

