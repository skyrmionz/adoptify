"use client";

import { useEffect, useRef, useState } from "react";
import type { Step } from "@/content/types";
import { Loader2, Code2, Workflow, Plug, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CopyPromptButton } from "@/components/common/CopyPromptButton";

type Candidate = { id: string; kind: "apex" | "flow" | "external"; name: string; meta?: string };

type EvidenceShape = {
  actionInventory?: { selected: Candidate[]; lastScanAt?: string };
};

const POLL_MS = 4000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

export function ActionInventoryStep({
  step,
  evidence,
  onEvidence,
}: {
  step: Extract<Step, { kind: "actionInventory" }>;
  evidence: Record<string, unknown>;
  onEvidence: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const initial = (evidence as EvidenceShape).actionInventory;
  const [selected, setSelected] = useState<Candidate[]>(initial?.selected ?? []);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingSince, setPendingSince] = useState<number | null>(null);
  const [synced, setSynced] = useState(false);
  const [lastScanAt, setLastScanAt] = useState<string | null>(initial?.lastScanAt ?? null);
  const pollTimer = useRef<number | null>(null);

  useEffect(() => {
    void load();
    return () => {
      if (pollTimer.current) window.clearTimeout(pollTimer.current);
    };
  }, []);

  async function load(): Promise<string | null> {
    try {
      const res = await fetch("/api/org/scan/latest");
      const data = (await res.json()) as {
        snapshot: {
          code?: { invocable?: number };
          integrations?: { named_credentials?: number; sample?: { apex?: string[]; flows?: string[]; namedCredentials?: string[]; externalServices?: string[] } };
          automation?: { flows_active?: number };
        } | null;
        scanned_at?: string | null;
      };

      if (!data.snapshot) {
        setCandidates(null);
        return null;
      }
      const samples = data.snapshot.integrations?.sample;
      const apex = samples?.apex ?? [];
      const flows = samples?.flows ?? [];
      const nc = samples?.namedCredentials ?? [];
      const es = samples?.externalServices ?? [];

      const list: Candidate[] = [
        ...apex.map((n, i) => ({ id: `apex-${i}-${n}`, kind: "apex" as const, name: n, meta: "@InvocableMethod" })),
        ...flows.map((n, i) => ({ id: `flow-${i}-${n}`, kind: "flow" as const, name: n, meta: "Autolaunched Flow" })),
        ...es.map((n, i) => ({ id: `es-${i}-${n}`, kind: "external" as const, name: n, meta: "External Service" })),
        ...nc.map((n, i) => ({ id: `nc-${i}-${n}`, kind: "external" as const, name: n, meta: "Named Credential" })),
      ];

      if (list.length === 0) {
        const inv = data.snapshot.code?.invocable ?? 0;
        const flowCount = data.snapshot.automation?.flows_active ?? 0;
        const ncCount = data.snapshot.integrations?.named_credentials ?? 0;
        for (let i = 0; i < inv; i++) list.push({ id: `apex-${i}`, kind: "apex", name: `InvocableClass_${i + 1}`, meta: "@InvocableMethod" });
        for (let i = 0; i < flowCount; i++) list.push({ id: `flow-${i}`, kind: "flow", name: `Autolaunched_Flow_${i + 1}`, meta: "Autolaunched Flow" });
        for (let i = 0; i < ncCount; i++) list.push({ id: `nc-${i}`, kind: "external", name: `NamedCred_${i + 1}`, meta: "Named Credential" });
      }

      setCandidates(list);
      setLastScanAt(data.scanned_at ?? null);
      return data.scanned_at ?? null;
    } finally {
      setLoading(false);
    }
  }

  function startPolling() {
    setPendingSince(Date.now());
    setSynced(false);
    poll();
  }

  async function poll() {
    if (pollTimer.current) window.clearTimeout(pollTimer.current);
    const startedAt = pendingSince ?? Date.now();
    if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
      setPendingSince(null);
      return;
    }
    const before = lastScanAt;
    const fresh = await load();
    if (fresh && fresh !== before) {
      setSynced(true);
      setPendingSince(null);
      window.setTimeout(() => setSynced(false), 4000);
      return;
    }
    pollTimer.current = window.setTimeout(poll, POLL_MS);
  }

  function toggle(c: Candidate) {
    const exists = selected.some((s) => s.id === c.id);
    const next = exists ? selected.filter((s) => s.id !== c.id) : [...selected, c];
    setSelected(next);
    onEvidence({ actionInventory: { selected: next, lastScanAt: lastScanAt ?? new Date().toISOString() } });
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{step.title}</h2>
          {step.description && <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">{step.description}</p>}
        </div>
        <CopyPromptButton
          body={{ kind: "scan" }}
          label={candidates ? "Copy re-scan prompt" : "Copy scan prompt"}
          onCopied={startPolling}
          className="shrink-0"
        />
      </div>

      {pendingSince && !synced && (
        <div className="surface-card p-3 mb-4 border-[var(--color-accent)]/30 text-sm text-[var(--color-text-muted)] inline-flex items-center gap-2">
          <Loader2 size={14} className="animate-spin text-[var(--color-accent)]" />
          Waiting for your coding agent to sync…
        </div>
      )}
      {synced && (
        <div className="surface-card p-3 mb-4 border-[var(--color-success)]/30 text-sm inline-flex items-center gap-2">
          <CheckCircle2 size={14} className="text-[var(--color-success)]" />
          Synced from your agent.
        </div>
      )}

      {loading ? (
        <div className="surface-card p-8 text-center text-sm text-[var(--color-text-muted)] inline-flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" /> Loading inventory…
        </div>
      ) : candidates === null ? (
        <div className="surface-card p-8 text-center text-sm text-[var(--color-text-muted)]">
          No org synced yet. Click <span className="text-[var(--color-text)] font-medium">Copy scan prompt</span> above and run it from your coding agent.
        </div>
      ) : candidates.length === 0 ? (
        <div className="surface-card p-8 text-center text-sm text-[var(--color-text-muted)]">
          No invocable Apex, autolaunched Flows, or External Services found yet. Build at least one in the next missions.
        </div>
      ) : (
        <>
          <div className="text-xs text-[var(--color-text-muted)] mb-3">{selected.length} selected · {candidates.length} found</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {candidates.map((c) => {
              const isSelected = selected.some((s) => s.id === c.id);
              const Icon = c.kind === "apex" ? Code2 : c.kind === "flow" ? Workflow : Plug;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c)}
                  className={cn(
                    "surface-card p-4 text-left transition flex items-start gap-3",
                    isSelected
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
                      : "hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)]",
                  )}
                >
                  <Icon size={16} className={isSelected ? "text-[var(--color-glow)] mt-0.5" : "text-[var(--color-text-muted)] mt-0.5"} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                    {c.meta && <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{c.meta}</div>}
                  </div>
                  <span className={cn(
                    "h-5 w-5 rounded border shrink-0 flex items-center justify-center text-[10px]",
                    isSelected ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white" : "border-[var(--color-border)]",
                  )}>{isSelected ? "✓" : ""}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
