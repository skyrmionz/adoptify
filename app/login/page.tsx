"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import Image from "next/image";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const payload = mode === "signup"
        ? { email, password, name: name || null }
        : { email, password };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
      router.push("/missions");
      router.refresh();
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

        <div className="flex gap-2 mb-6 text-sm">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(null); }}
            className={
              "flex-1 h-9 rounded-md border transition " +
              (mode === "login"
                ? "bg-[var(--color-surface-2)] border-[var(--color-border-strong)] text-[var(--color-text)]"
                : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]")
            }
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(null); }}
            className={
              "flex-1 h-9 rounded-md border transition " +
              (mode === "signup"
                ? "bg-[var(--color-surface-2)] border-[var(--color-border-strong)] text-[var(--color-text)]"
                : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]")
            }
          >
            Create account
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <h1 className="text-xl font-semibold mb-1">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            {mode === "signup"
              ? "Track your Agentforce adoption journey from day one."
              : "Sign in to pick up where you left off."}
          </p>

          {mode === "signup" && (
            <Field
              label="Name"
              type="text"
              value={name}
              onChange={setName}
              placeholder="Optional"
              autoComplete="name"
            />
          )}

          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@company.com"
            required
            autoComplete="email"
          />

          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
            required
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={mode === "signup" ? 8 : undefined}
          />

          {error && <p className="text-xs text-[var(--color-danger)] mt-2">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full h-11 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 text-white font-semibold tracking-wide transition"
          >
            {submitting
              ? mode === "signup" ? "Creating account…" : "Signing in…"
              : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>
      </motion.div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  autoComplete,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <label className="block mb-3">
      <span className="block text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-2">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        minLength={minLength}
        className="w-full h-11 px-3 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30 outline-none text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)]"
      />
    </label>
  );
}
