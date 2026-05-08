"use client";

import type { Step } from "@/content/types";

export function FrameworkStep({ step }: { step: Extract<Step, { kind: "framework" }> }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">{step.title}</h2>
        {step.subtitle && <p className="text-sm text-[var(--color-text-muted)] mt-2">{step.subtitle}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {step.cards.map((c, i) => (
          <div key={i} className="surface-card p-5">
            <h3 className="text-base font-semibold mb-2">{c.title}</h3>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{c.body}</p>
            {c.bullets && (
              <ul className="mt-3 space-y-1">
                {c.bullets.map((b, j) => (
                  <li key={j} className="text-xs text-[var(--color-text-muted)] flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-[var(--color-glow)] shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
            {c.example && (
              <div className="mt-4 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] p-3">
                <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-text-subtle)] mb-1">Example</div>
                <div className="text-xs text-[var(--color-text)]/90">{c.example}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
