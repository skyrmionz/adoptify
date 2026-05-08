"use client";

import { useState } from "react";
import type { Step, SetupCheckItem, SetupCheckVerify } from "@/content/types";
import { CheckCircle2, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type ItemResult = {
  ok: boolean;
  manual?: boolean;
  count?: number;
  sample?: string;
  details?: string;
  error?: string;
  verifiedAt?: string;
};

type EvidenceShape = {
  setupChecks?: Record<string, ItemResult>;
};

export function SetupChecklistStep({
  step,
  evidence,
  onEvidence,
}: {
  step: Extract<Step, { kind: "setupChecklist" }>;
  evidence: Record<string, unknown>;
  onEvidence: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const initial = (evidence as EvidenceShape).setupChecks ?? {};
  const [checks, setChecks] = useState<Record<string, ItemResult>>(initial);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  function persist(next: Record<string, ItemResult>) {
    setChecks(next);
    onEvidence({ setupChecks: next });
  }

  async function runVerify(item: SetupCheckItem) {
    if (item.verify.kind === "manual") {
      const next = {
        ...checks,
        [item.id]: { ok: !checks[item.id]?.ok, manual: true, verifiedAt: new Date().toISOString() },
      };
      persist(next);
      return;
    }
    setBusy((b) => ({ ...b, [item.id]: true }));
    try {
      const res = await fetch("/api/salesforce/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verify: item.verify }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; count?: number; sample?: string; error?: string };
      const next = {
        ...checks,
        [item.id]: {
          ok: !!data.ok,
          count: data.count,
          sample: data.sample,
          error: data.error,
          verifiedAt: new Date().toISOString(),
        },
      };
      persist(next);
    } catch (err) {
      const next = {
        ...checks,
        [item.id]: { ok: false, error: err instanceof Error ? err.message : "verify_failed", verifiedAt: new Date().toISOString() },
      };
      persist(next);
    } finally {
      setBusy((b) => ({ ...b, [item.id]: false }));
    }
  }

  function markManually(item: SetupCheckItem, ok: boolean) {
    const next = {
      ...checks,
      [item.id]: { ok, manual: true, verifiedAt: new Date().toISOString() },
    };
    persist(next);
  }

  const total = step.items.length;
  const passing = step.items.filter((i) => checks[i.id]?.ok).length;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{step.title}</h2>
          {step.description && <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">{step.description}</p>}
        </div>
        <div className="text-xs text-[var(--color-text-muted)] whitespace-nowrap shrink-0">{passing} / {total} verified</div>
      </div>

      <div className="space-y-3">
        {step.items.map((item) => {
          const r = checks[item.id];
          const isBusy = busy[item.id];
          const verifyKind = item.verify.kind;
          return (
            <div key={item.id} className="surface-card p-4">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "h-5 w-5 rounded-full border flex items-center justify-center text-[10px] shrink-0 mt-0.5",
                  r?.ok
                    ? "bg-[var(--color-success)]/20 border-[var(--color-success)]/50 text-[var(--color-success)]"
                    : r?.error
                      ? "bg-[var(--color-danger)]/15 border-[var(--color-danger)]/50 text-[var(--color-danger)]"
                      : "border-[var(--color-border)] text-[var(--color-text-subtle)]",
                )}>
                  {r?.ok ? "✓" : r?.error ? "!" : ""}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{item.label}</div>
                  {item.help && <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{item.help}</div>}
                  {r?.ok && r.count !== undefined && (
                    <div className="text-xs text-[var(--color-success)] mt-1">Found {r.count} {r.sample ? `· ${r.sample}` : ""}</div>
                  )}
                  {r?.error && (
                    <div className="text-xs text-[var(--color-danger)] mt-1 flex items-start gap-1.5">
                      <AlertCircle size={12} className="shrink-0 mt-0.5" /> <span className="break-words">{r.error}</span>
                    </div>
                  )}
                  {r?.manual && r?.ok && (
                    <div className="text-[11px] text-[var(--color-text-subtle)] mt-1">Marked manually</div>
                  )}
                  <div className="flex items-center flex-wrap gap-2 mt-3">
                    {verifyKind !== "manual" && (
                      <button
                        type="button"
                        onClick={() => runVerify(item)}
                        disabled={isBusy}
                        className="h-8 px-3 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap"
                      >
                        {isBusy ? <><Loader2 size={12} className="animate-spin" /> Checking</> : "Verify in org"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => markManually(item, !(r?.ok && r?.manual))}
                      className={cn(
                        "h-8 px-3 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition border",
                        r?.ok && r?.manual
                          ? "bg-[var(--color-success)]/15 border-[var(--color-success)]/30 text-[var(--color-success)]"
                          : "bg-[var(--color-surface-2)] border-[var(--color-border)] hover:border-[var(--color-border-strong)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
                      )}
                    >
                      <CheckCircle2 size={12} /> {r?.ok && r?.manual ? "Done manually" : "Mark manually"}
                    </button>
                    {item.doc && (
                      <a
                        href={item.doc}
                        target="_blank"
                        rel="noreferrer"
                        className="h-8 px-3 rounded-md text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        Docs <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
