"use client";

import { useState } from "react";
import type { Step } from "@/content/types";
import { Plus, Trash2 } from "lucide-react";

type PromptTemplate = {
  id: string;
  name: string;
  templateType: "FieldGeneration" | "SalesEmail" | "RecordSummary" | "Flex";
  purpose: string;
  groundingSources: string;
  outputFormat: string;
  sampleInput: string;
  sampleOutput: string;
};

type EvidenceShape = {
  promptTemplates?: PromptTemplate[];
};

export function PromptDesignerStep({
  step,
  evidence,
  onEvidence,
}: {
  step: Extract<Step, { kind: "promptDesigner" }>;
  evidence: Record<string, unknown>;
  onEvidence: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const initial = (evidence as EvidenceShape).promptTemplates ?? [];
  const [templates, setTemplates] = useState<PromptTemplate[]>(initial);

  function persist(next: PromptTemplate[]) {
    setTemplates(next);
    onEvidence({ promptTemplates: next });
  }

  function add() {
    const id = Math.random().toString(36).slice(2, 9);
    persist([
      ...templates,
      {
        id,
        name: "",
        templateType: "Flex",
        purpose: "",
        groundingSources: "",
        outputFormat: "",
        sampleInput: "",
        sampleOutput: "",
      },
    ]);
  }
  function remove(id: string) {
    persist(templates.filter((t) => t.id !== id));
  }
  function update(id: string, patch: Partial<PromptTemplate>) {
    persist(templates.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{step.title}</h2>
          {step.description && <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">{step.description}</p>}
        </div>
        <button
          onClick={add}
          className="h-10 px-4 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <Plus size={14} /> Add prompt
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="surface-card p-8 text-center text-sm text-[var(--color-text-muted)]">
          No prompts drafted yet. Click <span className="text-[var(--color-text)] font-medium">Add prompt</span> to start.
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((t, i) => (
            <div key={t.id} className="surface-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-subtle)] whitespace-nowrap">Prompt {i + 1}</div>
                <button
                  onClick={() => remove(t.id)}
                  className="text-[var(--color-text-subtle)] hover:text-[var(--color-danger)]"
                  aria-label="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Name" value={t.name} onChange={(v) => update(t.id, { name: v })} placeholder="Draft case-resolution email" />
                <SelectField
                  label="Template type"
                  value={t.templateType}
                  options={["Flex", "SalesEmail", "FieldGeneration", "RecordSummary"]}
                  onChange={(v) => update(t.id, { templateType: v as PromptTemplate["templateType"] })}
                />
                <Field label="Purpose" value={t.purpose} onChange={(v) => update(t.id, { purpose: v })} placeholder="What should this prompt do?" textarea />
                <Field label="Grounding sources" value={t.groundingSources} onChange={(v) => update(t.id, { groundingSources: v })} placeholder="Record merge fields, related list, Knowledge, Data Cloud retriever" textarea />
                <Field label="Output format" value={t.outputFormat} onChange={(v) => update(t.id, { outputFormat: v })} placeholder="Plain text · 3 paragraphs · JSON object · etc." />
                <div />
                <Field label="Sample input" value={t.sampleInput} onChange={(v) => update(t.id, { sampleInput: v })} placeholder="What the agent passes in" textarea />
                <Field label="Expected output" value={t.sampleOutput} onChange={(v) => update(t.id, { sampleOutput: v })} placeholder="What you want back" textarea />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, textarea,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean }) {
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

function SelectField({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)] block mb-1.5">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30 outline-none text-sm"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
