"use client";

import { useEffect, useRef, useState } from "react";
import type { Step } from "@/content/types";
import { Plus, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { CopyPromptButton } from "@/components/common/CopyPromptButton";

type Source =
  | { id: string; kind: "salesforce-knowledge"; status: "unchecked" | "checking" | "ok" | "error"; checkResult?: { count: number; sample?: string } | { error: string } }
  | { id: string; kind: "data-cloud"; status: "unchecked" | "checking" | "ok" | "error"; checkResult?: { dmoCount: number } | { error: string } }
  | { id: string; kind: "external"; name: string; url?: string; description?: string };

const POLL_MS = 4000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

export function KnowledgeAuditStep({
  step,
  evidence,
  onEvidence,
  missionId,
}: {
  step: Extract<Step, { kind: "knowledgeAudit" }>;
  evidence: Record<string, unknown>;
  onEvidence: (patch: Record<string, unknown>) => Promise<void>;
  connected?: boolean;
  missionId?: string;
}) {
  const [sources, setSources] = useState<Source[]>(((evidence.knowledgeSources as Source[]) ?? []));
  const [pendingId, setPendingId] = useState<string | null>(null);
  const pollTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimer.current) window.clearTimeout(pollTimer.current);
    };
  }, []);

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

  function startPollingFor(itemId: string) {
    setPendingId(itemId);
    poll(itemId, Date.now(), sources.find((s) => s.id === itemId));
  }

  async function poll(itemId: string, startedAt: number, before: Source | undefined) {
    if (pollTimer.current) window.clearTimeout(pollTimer.current);
    if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
      setPendingId(null);
      return;
    }
    if (!missionId) return;
    try {
      const res = await fetch(`/api/progress?missionId=${encodeURIComponent(missionId)}`);
      const data = (await res.json()) as { evidence: { knowledgeSources?: Source[] } };
      const ingestedKind = before && before.kind !== "external" ? before.kind : undefined;
      const beforeStatus = before && before.kind !== "external" ? before.status : undefined;
      const list = data.evidence.knowledgeSources ?? [];
      const fresh = list.find((s) => s.id === itemId)
        ?? list.find((s) => s.kind !== "external" && s.kind === ingestedKind && s.status === "ok");
      const freshStatus = fresh && fresh.kind !== "external" ? fresh.status : undefined;
      if (fresh && fresh.kind !== "external" && freshStatus !== beforeStatus) {
        const merged = (data.evidence.knowledgeSources ?? []) as Source[];
        // Keep external sources from local state (they aren't returned from ingest).
        const externals = sources.filter((s) => s.kind === "external");
        const dedup = new Map<string, Source>();
        for (const s of merged) dedup.set(s.id, s);
        for (const s of externals) if (!dedup.has(s.id)) dedup.set(s.id, s);
        persist(Array.from(dedup.values()));
        setPendingId(null);
        return;
      }
    } catch {
      /* ignore */
    }
    pollTimer.current = window.setTimeout(() => poll(itemId, startedAt, before), POLL_MS);
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
          className="h-9 px-3 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] text-sm inline-flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={14} /> Salesforce Knowledge
        </button>
        <button
          onClick={() => add("data-cloud")}
          className="h-9 px-3 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] text-sm inline-flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={14} /> Data Cloud
        </button>
        <button
          onClick={() => add("external")}
          className="h-9 px-3 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] text-sm inline-flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={14} /> External app
        </button>
      </div>

      {sources.length === 0 ? (
        <div className="surface-card p-8 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">Add at least one knowledge source to continue.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((s) => (
            <SourceRow
              key={s.id}
              source={s}
              missionId={missionId}
              isPending={pendingId === s.id}
              onCopy={() => startPollingFor(s.id)}
              onRemove={() => remove(s.id)}
              onUpdate={(patch) => persist(sources.map((x) => (x.id === s.id ? ({ ...x, ...patch } as Source) : x)))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SourceRow({
  source,
  missionId,
  isPending,
  onCopy,
  onRemove,
  onUpdate,
}: {
  source: Source;
  missionId: string | undefined;
  isPending: boolean;
  onCopy: () => void;
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
          {missionId && (
            <CopyPromptButton
              size="sm"
              body={{ kind: "knowledge-check", sourceKind: source.kind }}
              label="Copy live-check prompt"
              onCopied={onCopy}
            />
          )}
          {isPending && (
            <span className="text-xs text-[var(--color-text-muted)] inline-flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin" /> Waiting for sync…
            </span>
          )}
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
