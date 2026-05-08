"use client";

import { useState } from "react";
import type { Step, ChannelOption } from "@/content/types";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type ChannelPick = {
  id: string;
  prerequisitesAck: Record<string, boolean>; // prereq text → checked
  notes?: string;
};

type EvidenceShape = {
  channels?: ChannelPick[];
};

export function ChannelPlannerStep({
  step,
  evidence,
  onEvidence,
}: {
  step: Extract<Step, { kind: "channelPlanner" }>;
  evidence: Record<string, unknown>;
  onEvidence: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const initial = (evidence as EvidenceShape).channels ?? [];
  const [picks, setPicks] = useState<ChannelPick[]>(initial);

  function persist(next: ChannelPick[]) {
    setPicks(next);
    onEvidence({ channels: next });
  }

  function toggleChannel(opt: ChannelOption) {
    const exists = picks.find((p) => p.id === opt.id);
    if (exists) {
      persist(picks.filter((p) => p.id !== opt.id));
    } else {
      persist([...picks, { id: opt.id, prerequisitesAck: {} }]);
    }
  }

  function togglePrereq(channelId: string, prereq: string) {
    const next = picks.map((p) =>
      p.id === channelId
        ? { ...p, prerequisitesAck: { ...p.prerequisitesAck, [prereq]: !p.prerequisitesAck[prereq] } }
        : p,
    );
    persist(next);
  }

  function setNotes(channelId: string, notes: string) {
    const next = picks.map((p) => (p.id === channelId ? { ...p, notes } : p));
    persist(next);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">{step.title}</h2>
        {step.description && <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">{step.description}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {step.options.map((opt) => {
          const picked = picks.some((p) => p.id === opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleChannel(opt)}
              className={cn(
                "surface-card p-4 text-left transition",
                picked
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
                  : "hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)]",
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="text-sm font-semibold">{opt.name}</div>
                <span className={cn(
                  "h-5 w-5 rounded border shrink-0 flex items-center justify-center text-[10px]",
                  picked ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white" : "border-[var(--color-border)]",
                )}>{picked ? "✓" : ""}</span>
              </div>
              <div className="text-xs text-[var(--color-text-muted)] leading-relaxed">{opt.blurb}</div>
            </button>
          );
        })}
      </div>

      {picks.length > 0 && (
        <div className="space-y-4">
          <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-text-muted)]">Per-channel prerequisites</div>
          {picks.map((p) => {
            const opt = step.options.find((o) => o.id === p.id);
            if (!opt) return null;
            const ackedCount = opt.prerequisites.filter((pq) => p.prerequisitesAck[pq]).length;
            return (
              <div key={p.id} className="surface-card p-5">
                <div className="flex items-baseline justify-between gap-3 mb-3">
                  <h3 className="text-base font-semibold">{opt.name}</h3>
                  <div className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">{ackedCount} / {opt.prerequisites.length} acknowledged</div>
                </div>
                <ul className="space-y-2">
                  {opt.prerequisites.map((pq) => {
                    const acked = !!p.prerequisitesAck[pq];
                    return (
                      <li key={pq}>
                        <button
                          type="button"
                          onClick={() => togglePrereq(p.id, pq)}
                          className="w-full text-left flex items-start gap-3 rounded-md border border-[var(--color-border)] p-3 hover:border-[var(--color-border-strong)] transition"
                        >
                          {acked ? (
                            <CheckCircle2 size={14} className="text-[var(--color-success)] shrink-0 mt-0.5" />
                          ) : (
                            <Circle size={14} className="text-[var(--color-text-subtle)] shrink-0 mt-0.5" />
                          )}
                          <span className="text-sm text-[var(--color-text)]/90">{pq}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <label className="block mt-3">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] block mb-1.5">Notes (optional)</span>
                  <textarea
                    value={p.notes ?? ""}
                    onChange={(e) => setNotes(p.id, e.target.value)}
                    rows={2}
                    placeholder="Owner, target launch date, blockers…"
                    className="w-full px-3 py-2 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30 outline-none text-sm placeholder:text-[var(--color-text-subtle)]"
                  />
                </label>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
