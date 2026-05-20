"use client";

import { useEffect, useRef, useState } from "react";
import type { Step } from "@/content/types";
import { Loader2, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { CopyPromptButton } from "@/components/common/CopyPromptButton";

type ScanResponse = {
  scanned_at: string | null;
  is_mock?: boolean;
  score: number | null;
  snapshot: {
    foundations: { custom_objects: number; total_fields: number; relationships: number; record_counts: Record<string, number> };
    automation: { flows_active: number; flows_inactive: number; types: Record<string, number>; avg_complexity: number };
    code: { classes: number; loc: number; coverage_pct: number; invocable: number; aura_enabled: number };
    data: { knowledge_articles: number; data_cloud_dmos: number };
    agents: { bots: number; topics: number; actions: number; prompt_templates: number };
    access: { permission_sets: number; ai_permission_sets: number; profiles: number };
    limits: { daily_api_used: number; daily_api_max: number };
    scanMeta?: {
      confidence: "high" | "medium" | "low";
      probes: { area: string; label: string; status: "exact" | "partial" | "blocked"; detail: string }[];
    };
  } | null;
  findings: { id: string; area: string; severity: "ok" | "warn" | "danger"; title: string; explain: string }[];
};

const POLL_MS = 4000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

export function OrgScanReportStep({
  step,
  missionId,
  onEvidence,
}: {
  step: Extract<Step, { kind: "orgScanReport" }>;
  connected?: boolean;
  missionId: string;
  onEvidence: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const [data, setData] = useState<ScanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingSince, setPendingSince] = useState<number | null>(null);
  const [synced, setSynced] = useState(false);
  const pollTimer = useRef<number | null>(null);

  useEffect(() => {
    void load();
    return () => {
      if (pollTimer.current) window.clearTimeout(pollTimer.current);
    };
  }, []);

  async function load(): Promise<ScanResponse | null> {
    try {
      const res = await fetch("/api/org/scan/latest");
      const json = (await res.json()) as ScanResponse;
      setData(json);
      if (json.scanned_at && json.score !== null) {
        await onEvidence({ orgScan: { scanned_at: json.scanned_at, score: json.score, is_mock: false } });
      }
      return json;
    } catch (err) {
      setError(err instanceof Error ? err.message : "load_failed");
      return null;
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
    const before = data?.scanned_at ?? null;
    const fresh = await load();
    if (fresh?.scanned_at && fresh.scanned_at !== before) {
      setSynced(true);
      setPendingSince(null);
      window.setTimeout(() => setSynced(false), 4000);
      return;
    }
    pollTimer.current = window.setTimeout(poll, POLL_MS);
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
          label={data?.snapshot ? "Copy re-scan prompt" : "Copy scan prompt"}
          onCopied={startPolling}
          className="shrink-0"
        />
      </div>

      {pendingSince && !synced && (
        <div className="surface-card p-3 mb-4 border-[var(--color-accent)]/30 text-sm text-[var(--color-text-muted)] inline-flex items-center gap-2">
          <Loader2 size={14} className="animate-spin text-[var(--color-accent)]" />
          Waiting for your coding agent to sync the scan…
        </div>
      )}

      {synced && (
        <div className="surface-card p-3 mb-4 border-[var(--color-success)]/30 text-sm inline-flex items-center gap-2">
          <CheckCircle2 size={14} className="text-[var(--color-success)]" />
          Synced from your agent.
        </div>
      )}

      {error && (
        <div className="surface-card p-4 border-[var(--color-danger)]/30 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={16} className="text-[var(--color-danger)]" />
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="surface-card p-8 text-center text-sm text-[var(--color-text-muted)] inline-flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" /> Loading latest scan…
        </div>
      ) : !data || !data.snapshot ? (
        <div className="surface-card p-6">
          <h3 className="text-sm font-semibold mb-1">No scan synced yet</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Click <span className="font-medium text-[var(--color-text)]">Copy scan prompt</span> above and paste it into your coding agent. It will run the scan against your org locally and POST the results back. The report will appear here automatically.
          </p>
        </div>
      ) : (
        <ScanResults data={data as ScanResponse & { snapshot: NonNullable<ScanResponse["snapshot"]> }} />
      )}
    </div>
  );
}

function ScanResults({ data }: { data: ScanResponse & { snapshot: NonNullable<ScanResponse["snapshot"]> } }) {
  return (
    <div className="space-y-6">
      <div className="surface-card p-6 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-1">Agent readiness score</div>
          <div className="text-5xl font-semibold tracking-tight">{data.score ?? 0}<span className="text-2xl text-[var(--color-text-muted)]">/100</span></div>
          <div className="text-xs text-[var(--color-text-subtle)] mt-2">
            Synced {data.scanned_at ? new Date(data.scanned_at).toLocaleString() : "—"}
          </div>
          <div className="text-xs text-[var(--color-text-subtle)] mt-1">
            Headline counts focus on org-owned metadata where Salesforce exposes ownership signals.
          </div>
        </div>
        <ScoreRing score={data.score ?? 0} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Custom objects" value={data.snapshot.foundations.custom_objects} />
        <Stat label="Org active flows" value={data.snapshot.automation.flows_active} />
        <Stat label="Org Apex classes" value={data.snapshot.code.classes} />
        <Stat label="Knowledge articles" value={data.snapshot.data.knowledge_articles} />
        <Stat label="Bots / Agents" value={data.snapshot.agents.bots} />
        <Stat label="Prompt templates" value={data.snapshot.agents.prompt_templates} />
        <Stat label="Apex code coverage" value={`${data.snapshot.code.coverage_pct}%`} />
        <Stat label="API used today" value={`${data.snapshot.limits.daily_api_used.toLocaleString()} / ${data.snapshot.limits.daily_api_max.toLocaleString()}`} />
      </div>

      {data.snapshot.scanMeta && <ScanConfidence meta={data.snapshot.scanMeta} />}

      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2">Findings</div>
        <div className="space-y-2">
          {data.findings.map((f) => (
            <div key={f.id} className="surface-card p-4 flex items-start gap-3">
              {f.severity === "ok" && <CheckCircle2 size={16} className="text-[var(--color-success)] mt-0.5" />}
              {f.severity === "warn" && <AlertCircle size={16} className="text-[var(--color-warning)] mt-0.5" />}
              {f.severity === "danger" && <AlertCircle size={16} className="text-[var(--color-danger)] mt-0.5" />}
              <div>
                <div className="text-sm font-semibold">{f.title}</div>
                <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{f.explain}</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-subtle)] mt-1.5">{f.area}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScanConfidence({ meta }: { meta: NonNullable<NonNullable<ScanResponse["snapshot"]>["scanMeta"]> }) {
  const blocked = meta.probes.filter((p) => p.status === "blocked").length;
  const exact = meta.probes.filter((p) => p.status === "exact").length;
  const tone = meta.confidence === "high"
    ? "text-[var(--color-success)]"
    : meta.confidence === "medium"
      ? "text-[var(--color-warning)]"
      : "text-[var(--color-danger)]";

  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-1">Scan confidence</div>
          <div className={`text-lg font-semibold capitalize ${tone}`}>{meta.confidence}</div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {exact} probes exact · {blocked} blocked or unavailable
          </p>
        </div>
        <ShieldCheck size={20} className={tone} />
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {meta.probes.map((probe) => (
          <div key={`${probe.area}-${probe.label}`} className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">{probe.label}</div>
              <span className={`text-[10px] uppercase tracking-[0.18em] ${
                probe.status === "exact" ? "text-[var(--color-success)]" : probe.status === "partial" ? "text-[var(--color-warning)]" : "text-[var(--color-danger)]"
              }`}>
                {probe.status}
              </span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-subtle)] mt-1">{probe.area}</div>
            <p className="text-xs text-[var(--color-text-muted)] mt-2">{probe.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="surface-card p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-2">{label}</div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  return (
    <svg viewBox="0 0 100 100" className="w-24 h-24" aria-hidden>
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-border)" strokeWidth="8" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="url(#g)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
      />
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" />
          <stop offset="100%" stopColor="var(--color-glow)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
