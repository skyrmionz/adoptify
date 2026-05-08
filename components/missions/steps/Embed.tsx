"use client";

import type { Step } from "@/content/types";

export function EmbedStep({ step }: { step: Extract<Step, { kind: "embed" }> }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">{step.title}</h2>
        {step.description && <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">{step.description}</p>}
      </div>
      <div className="surface-card overflow-hidden p-0">
        <div className="aspect-video w-full bg-black">
          <iframe
            src={step.src}
            title={step.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
