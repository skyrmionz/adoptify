"use client";

import { useState } from "react";
import type { Step } from "@/content/types";
import { Loader2, RefreshCw, AlertCircle, CheckCircle2, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

type ScanResponse = {
  scanned_at: string;
  is_mock: boolean;
  score: number;
  snapshot: {
    foundations: { custom_objects: number; total_fields: number; relationships: number; record_counts: Record<string, number> };
    automation: { flows_active: number; flows_inactive: number; types: Record<string, number>; avg_complexity: number };
    code: { classes: number; loc: number; coverage_pct: number; invocable: number; aura_enabled: number };
    data: { knowledge_articles: number; data_cloud_dmos: number };
    agents: { bots: number; topics: number; actions: number; prompt_templates: number };
    access: { permission_sets: number; ai_permission_sets: number; profiles: number };
    limits: { daily_api_used: number; daily_api_max: number };
  };
  findings: { id: string; area: string; severity: "ok" | "warn" | "danger"; title: string; explain: string }[];
};

export function OrgScanReportStep({
  step,
  connected,
  missionId,
  onEvidence,
}: {
  step: Extract<Step, { kind: "orgScanReport" }>;
  connected: boolean;
  missionId: string;
  onEvidence: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ScanResponse | null>(null);

  async function runScan() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/salesforce/scan", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
      setData(json);
      await onEvidence({ orgScan: { scanned_at: json.scanned_at, score: json.score, is_mock: json.is_mock } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{step.title}</h2>
          {step.description && <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">{step.description}</p>}
        </div>
        <button
          onClick={runScan}
          disabled={loading}
          className="h-10 px-4 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          {loading ? <><Loader2 size={14} className="animate-spin" /> Scanning…</> : <><RefreshCw size={14} /> {data ? "Re-scan" : "Run scan"}</>}
        </button>
      </div>

      {!connected && (
        <div className="surface-card p-5 mb-4">
          <div className="flex items-start gap-3">
            <LinkIcon size={18} className="text-[var(--color-accent)] mt-0.5" />
            <div>
              <div className="font-semibold mb-1">Connect your Salesforce org first</div>
              <p className="text-sm text-[var(--color-text-muted)] mb-3">
                We need read access to your org&apos;s metadata. We never write back.
              </p>
              <Link
                href="/settings"
                className="inline-flex items-center h-9 px-4 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-semibold"
              >
                Connect org
              </Link>
            </div>
          </div>
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

      {data && <ScanResults data={data} />}
    </div>
  );
}

function ScanResults({ data }: { data: ScanResponse }) {
  return (
    <div className="space-y-6">
      <div className="surface-card p-6 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-1">Agent readiness score</div>
          <div className="text-5xl font-semibold tracking-tight">{data.score}<span className="text-2xl text-[var(--color-text-muted)]">/100</span></div>
          <div className="text-xs text-[var(--color-text-subtle)] mt-2">
            Scanned {new Date(data.scanned_at).toLocaleString()} {data.is_mock && "· Demo data (no org connected)"}
          </div>
        </div>
        <ScoreRing score={data.score} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Custom objects" value={data.snapshot.foundations.custom_objects} />
        <Stat label="Active flows" value={data.snapshot.automation.flows_active} />
        <Stat label="Apex classes" value={data.snapshot.code.classes} />
        <Stat label="Knowledge articles" value={data.snapshot.data.knowledge_articles} />
        <Stat label="Bots / Agents" value={data.snapshot.agents.bots} />
        <Stat label="Prompt templates" value={data.snapshot.agents.prompt_templates} />
        <Stat label="Apex code coverage" value={`${data.snapshot.code.coverage_pct}%`} />
        <Stat label="API used today" value={`${data.snapshot.limits.daily_api_used.toLocaleString()} / ${data.snapshot.limits.daily_api_max.toLocaleString()}`} />
      </div>

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
