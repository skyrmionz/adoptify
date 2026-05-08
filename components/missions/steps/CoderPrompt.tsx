"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Step, CoderTool } from "@/content/types";
import { Copy, Check, Terminal, Sparkles, Database, Cog, Code2, ChevronDown, Wand2 } from "lucide-react";
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
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(promptId: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(promptId);
      setTimeout(() => setCopied((c) => (c === promptId ? null : c)), 1500);
    } catch {
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

  const promptCount = step.prompts.length;

  return (
    <div className="surface-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-[var(--color-surface-2)]/60 transition-colors"
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-9 w-9 rounded-md bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 text-[var(--color-glow)] flex items-center justify-center shrink-0">
            <Wand2 size={16} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-1">Optional · Coding agent</div>
            <h3 className="text-base font-semibold tracking-tight">Want to use a coding agent to do the work?</h3>
            <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-2xl">
              {step.subtitle ?? `${promptCount} ready-to-paste prompt${promptCount === 1 ? "" : "s"} for Claude Code or Cursor.`}
            </p>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={cn(
            "text-[var(--color-text-muted)] shrink-0 mt-2 transition-transform duration-200",
            open ? "rotate-180" : "rotate-0",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 border-t border-[var(--color-border)]">
              <div className="mt-4 mb-4 text-xs text-[var(--color-text-muted)] leading-relaxed max-w-2xl">
                Each prompt below is designed to hand off to a coding agent like Claude Code or Cursor.
                Copy, paste, and let the tool execute Salesforce CLI / Agent Script DX / Data 360 commands.
                Review the diff before you ship.
              </div>

              <div className="space-y-4">
                {step.prompts.map((p) => (
                  <div key={p.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold">{p.title}</h4>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed">{p.goal}</p>
                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
