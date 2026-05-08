"use client";

import { useState } from "react";
import type { Step } from "@/content/types";
import { Loader2, RefreshCw, Code2, Workflow, Plug } from "lucide-react";
import { cn } from "@/lib/utils";

type Candidate = { id: string; kind: "apex" | "flow" | "external"; name: string; meta?: string };

type ScanResponse = {
  scanned_at: string;
  candidates: Candidate[];
};

type EvidenceShape = {
  actionInventory?: { selected: Candidate[]; lastScanAt?: string };
};

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
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanAt, setLastScanAt] = useState<string | null>(initial?.lastScanAt ?? null);

  async function runScan() {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch("/api/salesforce/scan", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { snapshot?: { code?: { invocable?: number; aura_enabled?: number; classes?: number }; integrations?: { named_credentials?: number; external_services?: number; sample?: { apex?: string[]; flows?: string[]; namedCredentials?: string[]; externalServices?: string[] } }; automation?: { flows_active?: number } }; integrations?: { sample?: unknown }; scanned_at?: string };
      // The scanner now exposes sample names under integrations + code; we fall back to synthesising
      // candidates from counts when a real org doesn't expose names.
      const samples = data.snapshot?.integrations?.sample;
      const apexNames = samples?.apex ?? [];
      const flowNames = samples?.flows ?? [];
      const ncNames = samples?.namedCredentials ?? [];
      const esNames = samples?.externalServices ?? [];

      const list: Candidate[] = [
        ...apexNames.map((n, i) => ({ id: `apex-${i}-${n}`, kind: "apex" as const, name: n, meta: "@InvocableMethod" })),
        ...flowNames.map((n, i) => ({ id: `flow-${i}-${n}`, kind: "flow" as const, name: n, meta: "Autolaunched Flow" })),
        ...esNames.map((n, i) => ({ id: `es-${i}-${n}`, kind: "external" as const, name: n, meta: "External Service" })),
        ...ncNames.map((n, i) => ({ id: `nc-${i}-${n}`, kind: "external" as const, name: n, meta: "Named Credential" })),
      ];

      // If the scanner returned counts but no names (real org doesn't expose them), synthesise placeholders.
      if (list.length === 0) {
        const inv = data.snapshot?.code?.invocable ?? 0;
        const flows = data.snapshot?.automation?.flows_active ?? 0;
        const nc = data.snapshot?.integrations?.named_credentials ?? 0;
        for (let i = 0; i < inv; i++) list.push({ id: `apex-${i}`, kind: "apex", name: `InvocableClass_${i + 1}`, meta: "@InvocableMethod" });
        for (let i = 0; i < flows; i++) list.push({ id: `flow-${i}`, kind: "flow", name: `Autolaunched_Flow_${i + 1}`, meta: "Autolaunched Flow" });
        for (let i = 0; i < nc; i++) list.push({ id: `nc-${i}`, kind: "external", name: `NamedCred_${i + 1}`, meta: "Named Credential" });
      }

      setCandidates(list);
      setLastScanAt(data.scanned_at ?? new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "scan_failed");
    } finally {
      setScanning(false);
    }
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
        <button
          type="button"
          onClick={runScan}
          disabled={scanning}
          className="h-10 px-4 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          {scanning ? <><Loader2 size={14} className="animate-spin" /> Scanning</> : <><RefreshCw size={14} /> Scan org for candidates</>}
        </button>
      </div>

      {error && (
        <div className="surface-card p-4 mb-4 border-[var(--color-danger)]/30 text-sm text-[var(--color-danger)]">{error}</div>
      )}

      {candidates === null ? (
        <div className="surface-card p-8 text-center text-sm text-[var(--color-text-muted)]">
          Click <span className="text-[var(--color-text)] font-medium">Scan org for candidates</span> to inventory your existing Apex, Flows, and External Services.
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
