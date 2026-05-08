"use client";

import { useState } from "react";
import type { Step } from "@/content/types";
import { Plus, Trash2 } from "lucide-react";

type UseCase = {
  id: string;
  name: string;
  user: string;
  pain: string;
  metric: string;
};

export function UseCaseCaptureStep({
  step,
  evidence,
  onEvidence,
}: {
  step: Extract<Step, { kind: "useCaseCapture" }>;
  evidence: Record<string, unknown>;
  onEvidence: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const [items, setItems] = useState<UseCase[]>(((evidence.useCases as UseCase[]) ?? []));

  function persist(next: UseCase[]) {
    setItems(next);
    onEvidence({ useCases: next });
  }

  function addItem() {
    const id = Math.random().toString(36).slice(2, 9);
    persist([...items, { id, name: "", user: "", pain: "", metric: "" }]);
  }
  function removeItem(id: string) {
    persist(items.filter((i) => i.id !== id));
  }
  function updateItem(id: string, patch: Partial<UseCase>) {
    persist(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  const minCount = step.minCount ?? 1;
  const filledCount = items.filter((i) => i.name && i.user && i.pain && i.metric).length;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{step.title}</h2>
          {step.description && <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">{step.description}</p>}
        </div>
        <button
          onClick={addItem}
          className="h-10 px-4 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <Plus size={14} /> Add use case
        </button>
      </div>

      <div className="text-xs text-[var(--color-text-muted)] mb-4">
        {filledCount} / {minCount} filled out (minimum to mark mission complete)
      </div>

      {items.length === 0 ? (
        <div className="surface-card p-8 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">No use cases yet. Click &quot;Add use case&quot; to capture your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((u, i) => (
            <div key={u.id} className="surface-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">Use case {i + 1}</div>
                <button
                  onClick={() => removeItem(u.id)}
                  className="text-[var(--color-text-subtle)] hover:text-[var(--color-danger)]"
                  aria-label="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Name" value={u.name} onChange={(v) => updateItem(u.id, { name: v })} placeholder="Service deflection: refund eligibility" />
                <Field label="User" value={u.user} onChange={(v) => updateItem(u.id, { user: v })} placeholder="Customer / Service rep" />
                <Field label="Pain point" value={u.pain} onChange={(v) => updateItem(u.id, { pain: v })} placeholder="What's broken or slow today?" textarea />
                <Field label="Success metric" value={u.metric} onChange={(v) => updateItem(u.id, { metric: v })} placeholder="% deflected / time saved / CSAT" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)] block mb-1.5">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="w-full px-3 py-2 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30 outline-none text-sm placeholder:text-[var(--color-text-subtle)]"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-10 px-3 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30 outline-none text-sm placeholder:text-[var(--color-text-subtle)]"
        />
      )}
    </label>
  );
}
