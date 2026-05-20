"use client";

import { useEffect, useState } from "react";
import { Key, Eye, EyeOff, Copy, RefreshCw, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { CopyPromptButton } from "@/components/common/CopyPromptButton";

type TokenInfo = {
  token: string;
  lastFour: string;
  createdAt: string | null;
  lastUsedAt: string | null;
};

export function ApiTokenPanel() {
  const [info, setInfo] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/api-token");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setInfo(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "load_failed");
    } finally {
      setLoading(false);
    }
  }

  async function rotate() {
    if (!confirm("Regenerate your API token? Any prompts already pasted into a coding agent will stop working.")) return;
    setRotating(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/api-token", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setInfo({
        token: data.token,
        lastFour: data.lastFour,
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
      });
      setRevealed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "rotate_failed");
    } finally {
      setRotating(false);
    }
  }

  async function copyToken() {
    if (!info) return;
    try {
      await navigator.clipboard.writeText(info.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="surface-card p-5 mb-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-1 inline-flex items-center gap-2">
            <Key size={12} /> Adoptify API token
          </div>
          <h2 className="text-lg font-semibold">Your coding agent uses this to sync</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-2xl">
            Adoptify reads your Salesforce org through your own coding agent (Claude Code, Cursor, etc.) — your agent runs <code>sf</code> CLI locally and POSTs the results back here. This token authorizes those POSTs. We never see your Salesforce credentials.
          </p>
        </div>
        <button
          type="button"
          onClick={rotate}
          disabled={rotating}
          className="h-9 px-3 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
        >
          {rotating ? <><Loader2 size={12} className="animate-spin" /> Rotating</> : <><RefreshCw size={12} /> Regenerate</>}
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-[var(--color-text-muted)] inline-flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" /> Loading token…
        </div>
      ) : error ? (
        <div className="text-sm text-[var(--color-danger)] inline-flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      ) : info ? (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="surface-card px-3 py-2 text-xs font-mono break-all flex-1 min-w-0">
              {revealed ? info.token : `adp_••••••••••••••••••••••••••••${info.lastFour}`}
            </code>
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              className="h-9 w-9 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] inline-flex items-center justify-center"
              aria-label={revealed ? "Hide" : "Reveal"}
            >
              {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              type="button"
              onClick={copyToken}
              className="h-9 px-3 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] text-xs inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              {copied ? <><CheckCircle2 size={12} className="text-[var(--color-success)]" /> Copied</> : <><Copy size={12} /> Copy token</>}
            </button>
          </div>
          <div className="text-[11px] text-[var(--color-text-subtle)] mt-2">
            {info.createdAt && <>Created {new Date(info.createdAt).toLocaleString()} · </>}
            {info.lastUsedAt ? <>Last used {new Date(info.lastUsedAt).toLocaleString()}</> : <>Never used yet</>}
          </div>

          <div className="mt-5 pt-5 border-t border-[var(--color-border)]">
            <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2">Connect or re-scan an org</div>
            <p className="text-sm text-[var(--color-text-muted)] mb-3">
              Click below to copy a one-shot prompt (with this token already embedded). Paste it into your coding agent and it will scan and sync your org.
            </p>
            <CopyPromptButton body={{ kind: "connect" }} label="Copy connect prompt" />
          </div>
        </>
      ) : null}
    </section>
  );
}
