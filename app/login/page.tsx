"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";

type Mode = "login" | "signup";
type Phase = "auth" | "welcome" | "exiting";

function firstNameOf(user: { name: string | null; email: string }): string {
  if (user.name) {
    const trimmed = user.name.trim();
    if (trimmed) return trimmed.split(/\s+/)[0];
  }
  // Fall back to the email's local part, capitalized.
  const local = user.email.split("@")[0] ?? "";
  if (!local) return "there";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  const first = cleaned.split(/\s+/)[0] ?? "there";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [welcome, setWelcome] = useState<{ firstName: string } | null>(null);
  const [phase, setPhase] = useState<Phase>("auth");

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

      const user = data?.user ?? { name: name || null, email };
      const firstName = firstNameOf(user);
      // Prefetch /missions so the navigation under the welcome screen is instant.
      router.prefetch("/missions");
      setWelcome({ firstName });
      setPhase("welcome");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <motion.main
      animate={{ opacity: phase === "exiting" ? 0 : 1 }}
      transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
      onAnimationComplete={() => {
        if (phase === "exiting") {
          router.push("/missions");
          router.refresh();
        }
      }}
      className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden"
      style={{
        background:
          "radial-gradient(80% 60% at 50% 0%, rgba(0, 161, 224, 0.18) 0%, rgba(0, 161, 224, 0.05) 35%, rgba(11, 18, 32, 0) 70%), radial-gradient(60% 50% at 100% 100%, rgba(31, 224, 255, 0.07) 0%, rgba(11, 18, 32, 0) 60%), #0B1220",
      }}
    >
      {/* Animated dotted glow — positioned within main, above body bg */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 90% at 50% 50%, #000 0%, #000 55%, transparent 100%)",
          maskImage:
            "radial-gradient(ellipse 90% 90% at 50% 50%, #000 0%, #000 55%, transparent 100%)",
        }}
      >
        <DottedGlowBackground
          className="absolute inset-0"
          opacity={0.45}
          gap={18}
          radius={1.5}
          color="rgba(160, 195, 230, 0.5)"
          darkColor="rgba(160, 195, 230, 0.5)"
          glowColor="rgba(31, 224, 255, 0.55)"
          darkGlowColor="rgba(31, 224, 255, 0.55)"
          backgroundOpacity={0}
          speedMin={0.2}
          speedMax={1.0}
          speedScale={0.8}
        />
      </div>

      <AnimatePresence mode="wait">
        {welcome ? (
          <WelcomeScreen
            key="welcome"
            firstName={welcome.firstName}
            onDone={() => setPhase("exiting")}
          />
        ) : (
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
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
        )}
      </AnimatePresence>
    </motion.main>
  );
}

function WelcomeScreen({ firstName, onDone }: { firstName: string; onDone: () => void }) {
  // Show the welcome screen for ~1.6s, then trigger navigation. The exit animation
  // of this component (orchestrated by the parent AnimatePresence) plays during the
  // route transition so the handoff feels seamless.
  useEffect(() => {
    const t = setTimeout(onDone, 1600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.99 }}
      transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
      className="relative flex flex-col items-center text-center px-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.05, ease: [0.32, 0.72, 0, 1] }}
        className="relative"
      >
        <div
          aria-hidden
          className="absolute inset-0 -m-8 rounded-full"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 50%, rgba(31,224,255,0.35) 0%, rgba(0,161,224,0.12) 45%, transparent 70%)",
            filter: "blur(8px)",
          }}
        />
        <Image
          src="/logos/adoptify.png"
          alt="adoptify"
          width={96}
          height={96}
          className="relative h-24 w-24 object-contain drop-shadow-[0_0_28px_rgba(31,224,255,0.55)]"
          priority
        />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25, ease: [0.32, 0.72, 0, 1] }}
        className="mt-8 text-3xl md:text-4xl font-semibold tracking-tight"
      >
        Welcome in, {firstName}!
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: [0.32, 0.72, 0, 1] }}
        className="mt-3 text-sm text-[var(--color-text-muted)]"
      >
        Setting up your adoption journey…
      </motion.p>
    </motion.div>
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
