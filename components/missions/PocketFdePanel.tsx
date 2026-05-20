"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Circle, Loader2, ShieldAlert, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type DiagnosticAnswers = {
  businessGoal?: string;
  team?: string;
  channel?: string;
  dataReadiness?: string;
  d360Status?: string;
  permissionsStatus?: string;
  automationStatus?: string;
};

type Diagnostic = {
  answers: DiagnosticAnswers;
  summary: { source: string; readiness: string; signals: string[] };
  blockers: string[];
  updated_at?: string;
} | null;

type Recommendation = {
  id: string;
  title: string;
  fit: string;
  effort: "Low" | "Medium" | "High";
  prerequisites: string[];
  blockers: string[];
  impact: string;
  basedOn: string;
};

type Selected = {
  useCase: Recommendation;
  stage: string;
} | null;

type PlanItem = {
  missionId: string;
  title: string;
  summary: string;
  href: string;
  sectionTitle: string;
  reason: string;
  blockedBy: string[];
  dependencies: string[];
};

type ProgressMap = Record<string, { status: string; completed_at: string | null }>;

export function PocketFdePanel({
  diagnostic,
  recommendations,
  selected,
  plan,
  connected,
  progress,
}: {
  diagnostic: Diagnostic;
  recommendations: Recommendation[];
  selected: Selected;
  plan: PlanItem[];
  connected: boolean;
  progress: ProgressMap;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [answers, setAnswers] = useState<DiagnosticAnswers>(diagnostic?.answers ?? {
    channel: "web",
    dataReadiness: "unknown",
    d360Status: "unknown",
    permissionsStatus: "unknown",
    automationStatus: "unknown",
  });

  function update(key: keyof DiagnosticAnswers, value: string) {
    setAnswers((cur) => ({ ...cur, [key]: value }));
  }

  function saveDiagnostic() {
    startTransition(async () => {
      await fetch("/api/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      await fetch("/api/recommendations", { method: "POST" });
      router.refresh();
    });
  }

  function choose(useCaseId: string) {
    startTransition(async () => {
      await fetch("/api/use-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useCaseId }),
      });
      router.refresh();
    });
  }

  const hasDiagnostic = !!diagnostic;
  const hasSelection = !!selected;

  return (
    <section className="mb-10 space-y-4">
      <div className="surface-card p-5 overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-glow)] to-transparent opacity-70" />
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[var(--color-glow)] mb-2">
              <Sparkles size={14} /> Pocket FDE
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Your Agentforce activation plan</h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-3xl">
              Start with a diagnostic, pick the most achievable first agent, then work the ordered setup path before you try to activate.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <StatusPill done={hasDiagnostic} label="Diagnose" />
            <StatusPill done={recommendations.length > 0} label="Recommend" />
            <StatusPill done={hasSelection} label="Activate" />
          </div>
        </div>

        {!connected && (
          <div className="mb-5 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-4 flex items-start gap-3">
            <ShieldAlert size={16} className="text-[var(--color-warning)] mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-semibold">No Salesforce org connected yet</div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                You can still run the intake, but recommendations will be based on your answers until an org scan is available.
              </p>
            </div>
            <Link href="/settings" className="ml-auto h-8 px-3 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap hover:border-[var(--color-border-strong)]">
              Connect org <ArrowRight size={12} />
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="What business problem should the first agent solve?">
              <textarea
                value={answers.businessGoal ?? ""}
                onChange={(e) => update("businessGoal", e.target.value)}
                placeholder="Example: Deflect repetitive support questions without breaking escalation trust"
                className="w-full min-h-24 px-3 py-2 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30 outline-none text-sm placeholder:text-[var(--color-text-subtle)]"
              />
            </Field>
            <Field label="Who owns or uses it first?">
              <input
                value={answers.team ?? ""}
                onChange={(e) => update("team", e.target.value)}
                placeholder="Support admins, service reps, sales ops, employees"
                className="w-full h-10 px-3 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30 outline-none text-sm placeholder:text-[var(--color-text-subtle)]"
              />
            </Field>
            <Field label="First channel">
              <Select value={answers.channel ?? "unknown"} onChange={(v) => update("channel", v)} options={[
                ["web", "Web / Experience"],
                ["messaging", "Messaging"],
                ["internal", "Internal employee"],
                ["email", "Email"],
                ["unknown", "Not sure"],
              ]} />
            </Field>
            <Field label="Knowledge/data readiness">
              <Select value={answers.dataReadiness ?? "unknown"} onChange={(v) => update("dataReadiness", v)} options={[
                ["knowledge-ready", "Curated Knowledge exists"],
                ["some-docs", "Some docs exist"],
                ["scattered", "Scattered or stale"],
                ["unknown", "Not sure"],
              ]} />
            </Field>
            <Field label="D360/Data Cloud status">
              <Select value={answers.d360Status ?? "unknown"} onChange={(v) => update("d360Status", v)} options={[
                ["ready", "Ready"],
                ["in-progress", "In progress"],
                ["not-started", "Not started"],
                ["unknown", "Not sure"],
              ]} />
            </Field>
            <Field label="Permissions">
              <Select value={answers.permissionsStatus ?? "unknown"} onChange={(v) => update("permissionsStatus", v)} options={[
                ["ready", "Pilot users ready"],
                ["needs-work", "Needs work"],
                ["unknown", "Not sure"],
              ]} />
            </Field>
          </div>

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)]/55 p-4 flex flex-col">
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-2">Diagnostic summary</div>
            {diagnostic ? (
              <>
                <div className="text-sm font-semibold capitalize">{diagnostic.summary.readiness.replace(/-/g, " ")}</div>
                <div className="text-xs text-[var(--color-text-muted)] mt-1">{diagnostic.summary.source}</div>
                <div className="mt-4 space-y-2">
                  {diagnostic.blockers.length > 0 ? diagnostic.blockers.map((b) => (
                    <div key={b} className="text-xs leading-relaxed text-[var(--color-warning)]">{b}</div>
                  )) : (
                    <div className="text-xs text-[var(--color-success)]">No major Stage 1-2 blockers detected yet.</div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Run the intake to generate the first-agent recommendations and dependency-aware activation plan.
              </p>
            )}
            <button
              type="button"
              onClick={saveDiagnostic}
              disabled={pending}
              className="mt-auto h-10 px-4 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {pending ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              {hasDiagnostic ? "Refresh recommendations" : "Run diagnostic"}
            </button>
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {recommendations.map((r) => {
            const chosen = selected?.useCase.id === r.id;
            return (
              <div key={r.id} className={cn("surface-card p-5 flex flex-col", chosen && "border-[var(--color-accent)] shadow-[var(--shadow-glow)]")}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="pill pill-accent">{r.effort} effort</span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">{r.basedOn}</span>
                </div>
                <h3 className="text-base font-semibold">{r.title}</h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-2 leading-relaxed">{r.fit}</p>
                <div className="mt-4">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-2">Prerequisites</div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.prerequisites.map((p) => <span key={p} className="pill">{p}</span>)}
                  </div>
                </div>
                {r.blockers.length > 0 && (
                  <div className="mt-4 text-xs text-[var(--color-warning)] leading-relaxed">{r.blockers[0]}</div>
                )}
                <p className="mt-4 text-xs text-[var(--color-text-muted)] leading-relaxed">{r.impact}</p>
                <button
                  type="button"
                  onClick={() => choose(r.id)}
                  disabled={pending}
                  className={cn(
                    "mt-auto h-10 px-4 rounded-md text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap",
                    chosen
                      ? "bg-[var(--color-success)]/15 border border-[var(--color-success)]/30 text-[var(--color-success)]"
                      : "bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
                  )}
                >
                  {chosen ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                  {chosen ? "Selected" : "Use this agent"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selected && plan.length > 0 && (
        <div className="surface-card p-5">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent)] mb-2">Activation plan</div>
              <h2 className="text-xl font-semibold">{selected.useCase.title}</h2>
              <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-3xl">
                Work these steps in order. They front-load common Stage 2 blockers before you try to activate.
              </p>
            </div>
          </div>
          <ol className="space-y-3">
            {plan.map((item, idx) => {
              const done = progress[item.missionId]?.status === "completed";
              return (
                <li key={item.missionId}>
                  <Link href={item.href} className="group grid grid-cols-[32px_1fr_auto] gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)]/45 p-4 hover:border-[var(--color-border-strong)] transition">
                    <div className={cn("h-8 w-8 rounded-full border flex items-center justify-center text-xs font-semibold", done ? "border-[var(--color-success)] text-[var(--color-success)] bg-[var(--color-success)]/10" : "border-[var(--color-border-strong)] text-[var(--color-text-muted)]")}>
                      {done ? "✓" : idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">{item.sectionTitle}</div>
                      <div className="text-sm font-semibold group-hover:text-[var(--color-glow)] transition-colors">{item.title}</div>
                      <div className="text-xs text-[var(--color-text-muted)] mt-1">{item.reason}</div>
                      {item.blockedBy.length > 0 && (
                        <div className="mt-2 text-xs text-[var(--color-warning)]">{item.blockedBy[0]}</div>
                      )}
                    </div>
                    <ArrowRight size={16} className="self-center text-[var(--color-text-muted)] group-hover:text-[var(--color-glow)]" />
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}

function StatusPill({ done, label }: { done: boolean; label: string }) {
  return (
    <span className={cn("pill", done && "pill-success")}>
      {done ? <CheckCircle2 size={11} /> : <Circle size={11} />}
      {label}
    </span>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 px-3 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30 outline-none text-sm"
    >
      {options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
    </select>
  );
}
