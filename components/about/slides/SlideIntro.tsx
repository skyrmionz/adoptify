"use client";

import Image from "next/image";

// Editorial. Wand mark, eyebrow, big headline, single calm paragraph.
export function SlideIntro() {
  return (
    <div className="w-full max-w-3xl mx-auto px-8 md:px-12">
      <Image
        src="/logos/adoptify.png"
        alt="adoptify"
        width={48}
        height={48}
        className="h-12 w-12 object-contain drop-shadow-[0_0_28px_rgba(31,224,255,0.45)] mb-8"
        priority
      />
      <div className="text-[11px] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-5">
        Why adoptify exists
      </div>
      <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
        Agentforce is powerful.
        <br />
        <span className="text-[var(--color-text-muted)]">Adopting it well is hard.</span>
      </h1>
      <p className="text-base md:text-lg leading-relaxed text-[var(--color-text-muted)] mt-6 max-w-2xl">
        Most teams don&apos;t fail at Agentforce because the platform can&apos;t do the job — they
        stall before the agent ever ships. We built adoptify to remove the three biggest
        reasons that happens.
      </p>
    </div>
  );
}
