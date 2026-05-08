"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Card } from "./types";

// 1 column on mobile, 3 on lg. Cards share rounded surface + accent left-bar.
export function CardGrid({ cards }: { cards: Card[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {cards.map((c, i) => (
        <div
          key={i}
          className="surface-card p-6 relative overflow-hidden"
        >
          <span
            aria-hidden
            className="absolute left-0 top-5 bottom-5 w-[2px] rounded-r-full bg-gradient-to-b from-[var(--color-accent)] to-[var(--color-glow)] opacity-60"
          />
          <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-text-subtle)] mb-2">
            {String(i + 1).padStart(2, "0")}
          </div>
          <h3 className="text-lg font-semibold tracking-tight mb-2">{c.title}</h3>
          <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{c.body}</p>
          {c.chip && (
            <Link
              href={c.chip.href}
              className="mt-4 inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/40 text-[var(--color-glow)] text-xs hover:bg-[var(--color-accent)]/25 hover:border-[var(--color-accent)]/60 transition whitespace-nowrap"
            >
              <span className="font-medium">{c.chip.label}</span>
              <ArrowRight size={12} />
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
