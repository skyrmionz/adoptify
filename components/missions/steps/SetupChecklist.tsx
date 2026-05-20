"use client";

import { useEffect, useRef, useState } from "react";
import type { Step, SetupCheckItem } from "@/content/types";
import { CheckCircle2, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { CopyPromptButton } from "@/components/common/CopyPromptButton";

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

const POLL_MS = 4000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

export function SetupChecklistStep({
  step,
  evidence,
  onEvidence,
  missionId,
}: {
  step: Extract<Step, { kind: "setupChecklist" }>;
  evidence: Record<string, unknown>;
  onEvidence: (patch: Record<string, unknown>) => Promise<void>;
  missionId?: string;
}) {
  const initial = (evidence as EvidenceShape).setupChecks ?? {};
  const [checks, setChecks] = useState<Record<string, ItemResult>>(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const pollTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimer.current) window.clearTimeout(pollTimer.current);
    };
  }, []);

  function persist(next: Record<string, ItemResult>) {
    setChecks(next);
    onEvidence({ setupChecks: next });
  }

  function markManually(item: SetupCheckItem, ok: boolean) {
    const next = {
      ...checks,
      [item.id]: { ok, manual: true, verifiedAt: new Date().toISOString() },
    };
    persist(next);
  }

  function startPollingFor(itemId: string) {
    setPendingId(itemId);
    poll(itemId, Date.now());
  }

  async function poll(itemId: string, startedAt: number) {
    if (pollTimer.current) window.clearTimeout(pollTimer.current);
    if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
      setPendingId(null);
      return;
    }
    if (!missionId) return;
    try {
      const res = await fetch(`/api/progress?missionId=${encodeURIComponent(missionId)}`);
      const data = (await res.json()) as { evidence: { setupChecks?: Record<string, ItemResult> } };
      const fresh = data.evidence.setupChecks?.[itemId];
      if (fresh && fresh.verifiedAt && fresh.verifiedAt !== checks[itemId]?.verifiedAt) {
        setChecks((c) => ({ ...c, [itemId]: fresh }));
        setPendingId(null);
        return;
      }
    } catch {
      /* ignore */
    }
    pollTimer.current = window.setTimeout(() => poll(itemId, startedAt), POLL_MS);
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
          const isPending = pendingId === item.id;
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
                  {isPending && (
                    <div className="text-xs text-[var(--color-text-muted)] mt-1 inline-flex items-center gap-1.5">
                      <Loader2 size={12} className="animate-spin" /> Waiting for your agent to sync the result…
                    </div>
                  )}
                  <div className="flex items-center flex-wrap gap-2 mt-3">
                    {verifyKind !== "manual" && verifyKind !== "scanner.path" && missionId && (
                      <CopyPromptButton
                        size="sm"
                        body={{
                          kind: "verify",
                          ruleId: item.id,
                          missionId,
                          ruleLabel: item.label,
                          rule: item.verify,
                        }}
                        label="Copy verify prompt"
                        onCopied={() => startPollingFor(item.id)}
                      />
                    )}
                    {verifyKind === "scanner.path" && (
                      <span className="text-xs text-[var(--color-text-muted)]">
                        Auto-evaluated from your latest synced scan.
                      </span>
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
