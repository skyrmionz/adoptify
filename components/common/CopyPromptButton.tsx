"use client";

import { useState } from "react";
import { Copy, Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type PromptKind =
  | { kind: "connect" }
  | { kind: "scan" }
  | { kind: "knowledge-check"; sourceKind: "salesforce-knowledge" | "data-cloud" }
  | { kind: "verify"; ruleId: string; missionId: string; stepId?: string; ruleLabel: string; rule: unknown };

export function CopyPromptButton({
  body,
  label,
  size = "md",
  variant = "primary",
  className,
  onCopied,
}: {
  body: PromptKind;
  label: string;
  size?: "sm" | "md";
  variant?: "primary" | "secondary";
  className?: string;
  onCopied?: () => void;
}) {
  const [state, setState] = useState<"idle" | "loading" | "copied" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  async function handleCopy() {
    setState("loading");
    setError(null);
    try {
      const res = await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setState("error");
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setPrompt(data.prompt);
      try {
        await navigator.clipboard.writeText(data.prompt);
      } catch {
        // Clipboard blocked — fall back to showing the prompt.
        setShowPrompt(true);
      }
      setState("copied");
      onCopied?.();
      setTimeout(() => setState("idle"), 4000);
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "copy_failed");
    }
  }

  const sizeClasses = size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm";
  const variantClasses = variant === "primary"
    ? "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white"
    : "bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] text-[var(--color-text)]";

  return (
    <div className={className}>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleCopy}
          disabled={state === "loading"}
          className={cn(
            "rounded-md font-semibold inline-flex items-center gap-2 whitespace-nowrap disabled:opacity-50",
            sizeClasses,
            variantClasses,
          )}
        >
          {state === "loading" ? <><Loader2 size={14} className="animate-spin" /> Loading…</> :
           state === "copied" ? <><CheckCircle2 size={14} /> Copied — paste into your agent</> :
           <><Copy size={14} /> {label}</>}
        </button>
        {prompt && (
          <button
            type="button"
            onClick={() => setShowPrompt((v) => !v)}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] inline-flex items-center gap-1"
          >
            {showPrompt ? <ChevronDown size={12} /> : <ChevronRight size={12} />} {showPrompt ? "Hide" : "Show"} prompt
          </button>
        )}
      </div>
      {state === "copied" && (
        <p className="text-xs text-[var(--color-text-muted)] mt-2">
          Paste into Claude Code, Cursor, or any coding agent with `sf` CLI access. Adoptify will pick up the result automatically when the agent finishes.
        </p>
      )}
      {state === "error" && error && (
        <div className="mt-2 text-xs text-[var(--color-danger)] inline-flex items-center gap-1.5">
          <AlertCircle size={12} /> {error}
        </div>
      )}
      {showPrompt && prompt && (
        <pre className="mt-3 surface-card p-3 text-[11px] leading-relaxed whitespace-pre-wrap break-words max-h-72 overflow-auto">
{prompt}
        </pre>
      )}
    </div>
  );
}
