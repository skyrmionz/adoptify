"use client";

import { useState } from "react";
import type { Step } from "@/content/types";
import { Plus, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

type Source =
  | { id: string; kind: "salesforce-knowledge"; status: "unchecked" | "checking" | "ok" | "error"; checkResult?: { count: number; sample?: string } | { error: string } }
  | { id: string; kind: "data-cloud"; status: "unchecked" | "checking" | "ok" | "error"; checkResult?: { dmoCount: number } | { error: string } }
  | { id: string; kind: "external"; name: string; url?: string; description?: string };

export function KnowledgeAuditStep({
  step,
  evidence,
  onEvidence,
  connected,
}: {
  step: Extract<Step, { kind: "knowledgeAudit" }>;
  evidence: Record<string, unknown>;
  onEvidence: (patch: Record<string, unknown>) => Promise<void>;
  connected: boolean;
}) {
  const [sources, setSources] = useState<Source[]>(((evidence.knowledgeSources as Source[]) ?? []));

  function persist(next: Source[]) {
    setSources(next);
    onEvidence({ knowledgeSources: next });
  }

  function add(kind: Source["kind"]) {
    const id = Math.random().toString(36).slice(2, 9);
    if (kind === "external") {
      persist([...sources, { id, kind, name: "" }]);
    } else if (kind === "salesforce-knowledge") {
      persist([...sources, { id, kind, status: "unchecked" }]);
    } else {
      persist([...sources, { id, kind, status: "unchecked" }]);
    }
  }

  function remove(id: string) {
    persist(sources.filter((s) => s.id !== id));
  }

  async function check(id: string) {
    const target = sources.find((s) => s.id === id);
    if (!target || target.kind === "external") return;
    persist(sources.map((s) => (s.id === id ? ({ ...s, status: "checking" } as Source) : s)));
    try {
      const res = await fetch("/api/salesforce/knowledge-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: target.kind }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      persist(sources.map((s) => (s.id === id ? ({ ...s, status: "ok", checkResult: data } as Source) : s)));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Check failed";
      persist(sources.map((s) => (s.id === id ? ({ ...s, status: "error", checkResult: { error: message } } as Source) : s)));
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">{step.title}</h2>
        {step.description && <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">{step.description}</p>}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => add("salesforce-knowledge")}
          className="h-9 px-3 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] text-sm inline-flex items-center gap-2"
        >
          <Plus size={14} /> Salesforce Knowledge
        </button>
        <button
          onClick={() => add("data-cloud")}
          className="h-9 px-3 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] text-sm inline-flex items-center gap-2"
        >
          <Plus size={14} /> Data Cloud
        </button>
        <button
          onClick={() => add("external")}
          className="h-9 px-3 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] text-sm inline-flex items-center gap-2"
        >
          <Plus size={14} /> External app
        </button>
      </div>

      {!connected && sources.some((s) => s.kind !== "external") && (
        <div className="mb-4 surface-card p-4 border-[var(--color-warning)]/30">
          <p className="text-sm">
            Connect your Salesforce org in <Link className="text-[var(--color-accent)] underline" href="/settings">Settings</Link> to validate Salesforce-native sources.
          </p>
        </div>
      )}

      {sources.length === 0 ? (
        <div className="surface-card p-8 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">Add at least one knowledge source to continue.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((s) => (
            <SourceRow key={s.id} source={s} onCheck={() => check(s.id)} onRemove={() => remove(s.id)} onUpdate={(patch) => persist(sources.map((x) => (x.id === s.id ? ({ ...x, ...patch } as Source) : x)))} />
          ))}
        </div>
      )}
    </div>
  );
}

function SourceRow({
  source,
  onCheck,
  onRemove,
  onUpdate,
}: {
  source: Source;
  onCheck: () => void;
  onRemove: () => void;
  onUpdate: (patch: Partial<Source>) => void;
}) {
  return (
    <div className="surface-card p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-sm font-semibold capitalize">
          {source.kind === "salesforce-knowledge" && "Salesforce Knowledge"}
          {source.kind === "data-cloud" && "Salesforce Data Cloud"}
          {source.kind === "external" && "External knowledge source"}
        </div>
        <button
          onClick={onRemove}
          className="text-[var(--color-text-subtle)] hover:text-[var(--color-danger)]"
          aria-label="Remove"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {source.kind === "external" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={source.name}
            onChange={(e) => onUpdate({ name: e.target.value } as Partial<Source>)}
            placeholder="e.g. Confluence, Notion, internal docs"
            className="h-10 px-3 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30 outline-none text-sm placeholder:text-[var(--color-text-subtle)]"
          />
          <input
            value={source.url ?? ""}
            onChange={(e) => onUpdate({ url: e.target.value } as Partial<Source>)}
            placeholder="https://docs.example.com (optional)"
            className="h-10 px-3 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30 outline-none text-sm placeholder:text-[var(--color-text-subtle)]"
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onCheck}
            disabled={source.status === "checking"}
            className="h-9 px-3 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center gap-2"
          >
            {source.status === "checking" ? <><Loader2 size={14} className="animate-spin" /> Checking…</> : "Run live check"}
          </button>
          {source.status === "ok" && source.checkResult && !("error" in source.checkResult) && (
            <span className="pill pill-success"><CheckCircle2 size={12} /> {source.kind === "salesforce-knowledge" ? `${(source.checkResult as { count: number }).count} articles` : `${(source.checkResult as { dmoCount: number }).dmoCount} DMOs`}</span>
          )}
          {source.status === "error" && source.checkResult && "error" in source.checkResult && (
            <span className="pill pill-danger"><AlertCircle size={12} /> {source.checkResult.error}</span>
          )}
        </div>
      )}
    </div>
  );
}
