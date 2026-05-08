"use client";

import type { Step } from "@/content/types";

export function FrameworkStep({ step }: { step: Extract<Step, { kind: "framework" }> }) {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">{step.title}</h2>
        {step.subtitle && (
          <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">{step.subtitle}</p>
        )}
      </div>

      <div className="prose-doc">
        {step.cards.map((c, i) => (
          <section key={i} className="not-prose mb-8 last:mb-0">
            <h3 className="text-base font-semibold tracking-tight mb-2">{c.title}</h3>
            <p className="text-[15px] leading-relaxed text-[var(--color-text-muted)]">{c.body}</p>

            {c.bullets && c.bullets.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {c.bullets.map((b, j) => (
                  <li key={j} className="text-[14px] leading-relaxed text-[var(--color-text-muted)] flex items-start gap-2">
                    <span className="mt-2 h-1 w-1 rounded-full bg-[var(--color-glow)] shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            {c.example && (
              <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-text-muted)]">
                <span className="text-[var(--color-text)] font-medium">Example.</span> {c.example}
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
