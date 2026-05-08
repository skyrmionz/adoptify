"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SlideOutro() {
  return (
    <div className="w-full max-w-3xl mx-auto px-8 md:px-12">
      <div className="text-[11px] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-5">
        Ready?
      </div>
      <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
        Make Agentforce
        <br />
        <span className="text-[var(--color-glow)]">work for you.</span>
      </h1>
      <p className="text-base md:text-lg leading-relaxed text-[var(--color-text-muted)] mt-6 max-w-2xl">
        Pick up wherever you left off — or start fresh. The journey is yours.
      </p>
      <Link
        href="/missions"
        className="mt-8 inline-flex items-center gap-2 h-12 px-6 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-semibold tracking-wide transition shadow-[0_0_24px_rgba(0,161,224,0.35)]"
      >
        Start your journey <ArrowRight size={16} />
      </Link>
    </div>
  );
}
