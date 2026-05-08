"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup") {
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match");
        return;
      }
    }

    setSubmitting(true);
    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const payload = mode === "signup"
        ? { email, password, confirm, name: name || null }
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
    <main
      className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden"
      style={{
        background:
          "radial-gradient(80% 60% at 50% 0%, rgba(0, 161, 224, 0.45) 0%, rgba(0, 161, 224, 0.12) 35%, rgba(11, 18, 32, 0) 70%), radial-gradient(60% 50% at 100% 100%, rgba(31, 224, 255, 0.18) 0%, rgba(11, 18, 32, 0) 60%), #0B1220",
      }}
    >
      {/* Animated dotted glow — positioned within main, above body bg */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 90% at 50% 50%, #000 0%, #000 60%, transparent 100%)",
          maskImage:
            "radial-gradient(ellipse 90% 90% at 50% 50%, #000 0%, #000 60%, transparent 100%)",
        }}
      >
        <DottedGlowBackground
          className="absolute inset-0"
          opacity={1}
          gap={16}
          radius={1.8}
          color="rgba(180, 220, 255, 0.85)"
          darkColor="rgba(180, 220, 255, 0.85)"
          glowColor="rgba(31, 224, 255, 1)"
          darkGlowColor="rgba(31, 224, 255, 1)"
          backgroundOpacity={0}
          speedMin={0.3}
          speedMax={1.6}
          speedScale={1}
        />
      </div>

      {/* Glass modal */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]"
      >
        {/* Inner gradient sheen */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 35%), radial-gradient(80% 60% at 50% 0%, rgba(0,161,224,0.18), transparent 60%)",
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-3 mb-8">
            <Image
              src="/logos/adoptify.png"
              alt="adoptify"
              width={36}
              height={36}
              className="h-9 w-9 object-contain drop-shadow-[0_0_18px_rgba(31,224,255,0.5)]"
              priority
            />
            <div>
              <div className="text-lg font-semibold tracking-tight lowercase">adoptify</div>
              <div className="text-xs text-[var(--color-text-muted)]">Make Agentforce work for you</div>
            </div>
            <div className="ml-auto opacity-60">
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
                  ? "bg-white/[0.07] border-white/15 text-[var(--color-text)]"
                  : "border-white/10 text-[var(--color-text-muted)] hover:text-[var(--color-text)]")
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
                  ? "bg-white/[0.07] border-white/15 text-[var(--color-text)]"
                  : "border-white/10 text-[var(--color-text-muted)] hover:text-[var(--color-text)]")
              }
            >
              Create account
            </button>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.form
              key={mode}
              onSubmit={onSubmit}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            >
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

              {mode === "signup" && (
                <Field
                  label="Confirm password"
                  type="password"
                  value={confirm}
                  onChange={setConfirm}
                  placeholder="Re-enter your password"
                  required
                  autoComplete="new-password"
                  minLength={8}
                />
              )}

              {error && <p className="text-xs text-[var(--color-danger)] mt-2">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full h-11 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 text-white font-semibold tracking-wide transition shadow-[0_0_24px_rgba(0,161,224,0.35)]"
              >
                {submitting
                  ? mode === "signup" ? "Creating account…" : "Signing in…"
                  : mode === "signup" ? "Create account" : "Sign in"}
              </button>
            </motion.form>
          </AnimatePresence>
        </div>
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
        className="w-full h-11 px-3 rounded-md bg-white/[0.04] border border-white/10 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30 outline-none text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] transition"
      />
    </label>
  );
}
