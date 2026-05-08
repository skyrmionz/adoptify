"use client";

import { useState } from "react";
import { motion } from "motion/react";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to send link");
      setSent(true);
      if (data.devLink) setDevLink(data.devLink);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        className="w-full max-w-md surface-card p-8"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="h-9 w-9 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white font-semibold">
            A
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight">Adoptify</div>
            <div className="text-xs text-[var(--color-text-muted)]">Agentforce adoption companion</div>
          </div>
          <div className="ml-auto opacity-50">
            <Image src="/logos/salesforce.png" alt="Salesforce" width={64} height={20} />
          </div>
        </div>

        {sent ? (
          <div>
            <h1 className="text-xl font-semibold mb-2">Check your email</h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              We sent a sign-in link to <span className="text-[var(--color-text)]">{email}</span>. It expires in 15 minutes.
            </p>
            {devLink && (
              <a
                href={devLink}
                className="mt-6 block text-xs text-[var(--color-accent)] underline truncate"
                title={devLink}
              >
                Dev link: {devLink}
              </a>
            )}
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <h1 className="text-xl font-semibold mb-1">Sign in</h1>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
              Enter your work email and we&apos;ll send a one-time link.
            </p>
            <label className="block text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full h-11 px-3 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30 outline-none text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)]"
            />
            {error && <p className="text-xs text-[var(--color-danger)] mt-2">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full h-11 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 text-white font-semibold tracking-wide transition"
            >
              {submitting ? "Sending..." : "Send sign-in link"}
            </button>
          </form>
        )}
      </motion.div>
    </main>
  );
}
