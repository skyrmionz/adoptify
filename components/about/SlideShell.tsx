"use client";

// Shared chrome for every slide: eyebrow / headline / optional body, then children.
// Keeps spacing rhythm consistent across the deck without forcing a layout choice.
import type { SlideShellProps } from "./types";

export function SlideShell({ eyebrow, headline, body, children }: SlideShellProps) {
  return (
    <div className="w-full max-w-5xl mx-auto px-8 md:px-12">
      <div className="text-[11px] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4">
        {eyebrow}
      </div>
      <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">{headline}</h2>
      {body && (
        <p className="text-base md:text-lg leading-relaxed text-[var(--color-text-muted)] mt-5 max-w-2xl">
          {body}
        </p>
      )}
      {children && <div className="mt-10 md:mt-12">{children}</div>}
    </div>
  );
}
