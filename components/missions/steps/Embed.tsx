"use client";

import type { Step } from "@/content/types";
import { Film } from "lucide-react";

export function EmbedStep({ step }: { step: Extract<Step, { kind: "embed" }> }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">{step.title}</h2>
        {step.description && <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">{step.description}</p>}
      </div>
      <div className="surface-card overflow-hidden p-0">
        <div className="aspect-video w-full bg-black relative">
          <video
            controls
            preload="metadata"
            className="absolute inset-0 w-full h-full"
          >
            {/* Empty for now — drop a video file in /public/videos and add <source src="..."> when ready */}
          </video>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <Film size={28} className="text-[var(--color-text-subtle)] mb-2" />
            <div className="text-sm text-[var(--color-text-muted)]">Video coming soon</div>
            <div className="text-xs text-[var(--color-text-subtle)] mt-1">Upload your video to enable playback</div>
          </div>
        </div>
      </div>
    </div>
  );
}
