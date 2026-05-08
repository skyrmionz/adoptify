"use client";

import { useState } from "react";
import type { Step, CoderTool } from "@/content/types";
import { Copy, Check, Terminal, Sparkles, Database, Cog, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TOOL_META: Record<CoderTool, { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  "claude-code": { label: "Claude Code", icon: Sparkles },
  "cursor": { label: "Cursor", icon: Sparkles },
  "sf-cli": { label: "Salesforce CLI", icon: Terminal },
  "adlc": { label: "Agent Script DX (ADLC)", icon: Code2 },
  "data-360": { label: "Data 360 / Data Cloud", icon: Database },
  "metadata-api": { label: "Metadata API", icon: Cog },
};

export function CoderPromptStep({ step }: { step: Extract<Step, { kind: "coderPrompt" }> }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(promptId: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(promptId);
      setTimeout(() => setCopied((c) => (c === promptId ? null : c)), 1500);
    } catch {
      // fallback: select text in a hidden textarea
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(promptId);
      setTimeout(() => setCopied((c) => (c === promptId ? null : c)), 1500);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">{step.title}</h2>
        {step.subtitle && <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">{step.subtitle}</p>}
        <div className="mt-4 surface-card p-4 max-w-2xl">
          <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-1.5">How to use</div>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            Each prompt below is designed to hand off to a coding agent like Claude Code or Cursor.
            Copy the prompt, paste it into your agent of choice, and let the tool execute the
            Salesforce CLI / Agent Script DX / Data 360 commands for you. Review the diff before
            you ship.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {step.prompts.map((p) => (
          <div key={p.id} className="surface-card p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold">{p.title}</h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">{p.goal}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {p.tools.map((t) => {
                    const meta = TOOL_META[t];
                    const Icon = meta.icon;
                    return (
                      <span
                        key={t}
                        className="pill pill-accent inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Icon size={10} /> {meta.label}
                      </span>
                    );
                  })}
                </div>
              </div>
              <button
                type="button"
                onClick={() => copy(p.id, p.prompt)}
                className={cn(
                  "h-9 px-3 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition border",
                  copied === p.id
                    ? "bg-[var(--color-success)]/15 border-[var(--color-success)]/30 text-[var(--color-success)]"
                    : "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white border-transparent",
                )}
              >
                {copied === p.id ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy prompt</>}
              </button>
            </div>

            <pre className="rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] p-3 overflow-x-auto text-xs leading-relaxed whitespace-pre-wrap break-words">
              <code>{p.prompt}</code>
            </pre>

            {p.notes && (
              <div className="mt-3 text-[11px] text-[var(--color-text-subtle)] leading-relaxed">{p.notes}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
