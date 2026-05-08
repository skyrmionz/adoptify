"use client";

import type { Step } from "@/content/types";
import { Check } from "lucide-react";

export function ChecklistStep({
  step,
  evidence,
  onEvidence,
}: {
  step: Extract<Step, { kind: "checklist" }>;
  evidence: Record<string, unknown>;
  onEvidence: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const checked = (evidence.checklist as Record<string, boolean>) ?? {};
  function toggle(id: string) {
    const next = { ...checked, [id]: !checked[id] };
    onEvidence({ checklist: next });
  }
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">{step.title}</h2>
      </div>
      <div className="space-y-2">
        {step.items.map((item) => {
          const isChecked = !!checked[item.id];
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className="w-full text-left surface-card p-4 flex items-start gap-3 hover:border-[var(--color-border-strong)] transition"
            >
              <span
                className={
                  "mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition " +
                  (isChecked
                    ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white"
                    : "border-[var(--color-border)]")
                }
              >
                {isChecked && <Check size={12} />}
              </span>
              <div>
                <div className="text-sm font-medium">{item.label}</div>
                {item.help && <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{item.help}</div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
