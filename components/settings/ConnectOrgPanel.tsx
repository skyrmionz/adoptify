"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Trash2, Plus, AlertCircle, CheckCircle2, Copy, ExternalLink, Loader2, X } from "lucide-react";

type ConnRow = {
  id: string;
  instance_url: string;
  org_name: string | null;
  is_sandbox: boolean;
  last_scanned_at: string | null;
  created_at: string;
};

type DeviceStart = {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  interval: number;
  isSandbox: boolean;
};

type LoginState =
  | { kind: "idle" }
  | { kind: "starting"; isSandbox: boolean }
  | { kind: "waiting"; data: DeviceStart; message: string }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function ConnectOrgPanel({
  connections,
  oauthConfigured,
}: {
  connections: ConnRow[];
  oauthConfigured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [login, setLogin] = useState<LoginState>({ kind: "idle" });
  const [copied, setCopied] = useState(false);
  const cancelledRef = useRef(false);

  function disconnect(id: string) {
    startTransition(async () => {
      await fetch("/api/salesforce/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: id }),
      });
      router.refresh();
    });
  }

  async function startLogin(isSandbox: boolean) {
    cancelledRef.current = false;
    setLogin({ kind: "starting", isSandbox });
    try {
      const res = await fetch("/api/salesforce/device/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sandbox: isSandbox }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLogin({ kind: "error", message: data.error ?? "Could not start login." });
        return;
      }
      const start: DeviceStart = data;
      setLogin({ kind: "waiting", data: start, message: "Waiting for you to approve in Salesforce…" });
      pollLoop(start);
    } catch {
      setLogin({ kind: "error", message: "Network error starting login." });
    }
  }

  async function pollLoop(start: DeviceStart) {
    let interval = Math.max(start.interval ?? 5, 1) * 1000;
    while (!cancelledRef.current) {
      await new Promise((r) => setTimeout(r, interval));
      if (cancelledRef.current) return;
      try {
        const res = await fetch("/api/salesforce/device/poll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceCode: start.deviceCode, sandbox: start.isSandbox }),
        });
        const data = await res.json();
        if (data.status === "pending") continue;
        if (data.status === "slow_down") {
          interval += 2000;
          continue;
        }
        if (data.status === "denied") {
          setLogin({ kind: "error", message: "Login was denied in Salesforce." });
          return;
        }
        if (data.status === "expired") {
          setLogin({ kind: "error", message: "Login code expired. Try again." });
          return;
        }
        if (data.status === "success") {
          setLogin({ kind: "success" });
          router.refresh();
          setTimeout(() => setLogin({ kind: "idle" }), 1200);
          return;
        }
        setLogin({ kind: "error", message: data.error ?? "Login failed." });
        return;
      } catch {
        setLogin({ kind: "error", message: "Network error during login." });
        return;
      }
    }
  }

  function cancelLogin() {
    cancelledRef.current = true;
    setLogin({ kind: "idle" });
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  const showModal = login.kind === "starting" || login.kind === "waiting" || login.kind === "success";

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)]">Connected orgs</div>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Adoptify reads metadata only. Sign in with a one-time code, just like the Salesforce CLI.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => startLogin(false)}
            disabled={!oauthConfigured || login.kind !== "idle"}
            className="h-10 px-4 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={14} /> Connect production
          </button>
          <button
            type="button"
            onClick={() => startLogin(true)}
            disabled={!oauthConfigured || login.kind !== "idle"}
            className="h-10 px-4 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={14} /> Sandbox
          </button>
        </div>
      </div>

      {!oauthConfigured && (
        <div className="surface-card p-4 mb-3 border-[var(--color-warning)]/30">
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle size={14} className="text-[var(--color-warning)] mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold">Adoptify OAuth is not configured yet</div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Set <code>SF_CLIENT_ID</code> in Heroku to the Connected App consumer key. The Connected App must have
                Device Flow enabled and be configured as a public client (no secret required).
              </p>
            </div>
          </div>
        </div>
      )}

      {login.kind === "error" && (
        <div className="surface-card p-3 mb-3 border-[var(--color-danger)]/30">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2">
              <AlertCircle size={14} className="text-[var(--color-danger)]" /> {login.message}
            </span>
            <button onClick={() => setLogin({ kind: "idle" })} className="text-xs text-[var(--color-text-subtle)] hover:text-[var(--color-text)]">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {connections.length === 0 ? (
        <div className="surface-card p-8 text-center">
          <Building2 size={28} className="mx-auto text-[var(--color-text-subtle)] mb-2" />
          <div className="text-sm font-semibold">No orgs connected yet</div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Connect one to unlock the full org-scan report and live knowledge checks.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {connections.map((c) => (
            <div key={c.id} className="surface-card p-4 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-md bg-[var(--color-surface-2)] flex items-center justify-center">
                  <Building2 size={16} />
                </div>
                <div>
                  <div className="text-sm font-semibold">{c.org_name ?? new URL(c.instance_url).hostname}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {c.is_sandbox ? "Sandbox" : "Production"} · {c.last_scanned_at ? `last scanned ${new Date(c.last_scanned_at).toLocaleString()}` : "not scanned yet"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => disconnect(c.id)}
                disabled={pending}
                className="text-[var(--color-text-subtle)] hover:text-[var(--color-danger)] inline-flex items-center gap-1 text-xs"
              >
                <Trash2 size={12} /> Disconnect
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="surface-card max-w-md w-full p-6 relative">
            <button
              type="button"
              onClick={cancelLogin}
              className="absolute top-3 right-3 text-[var(--color-text-subtle)] hover:text-[var(--color-text)]"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {login.kind === "starting" && (
              <div className="flex items-center gap-3 py-6">
                <Loader2 size={18} className="animate-spin text-[var(--color-accent)]" />
                <span className="text-sm">Requesting login code…</span>
              </div>
            )}

            {login.kind === "waiting" && (
              <>
                <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-1">
                  Connect {login.data.isSandbox ? "sandbox" : "production"} org
                </div>
                <h2 className="text-xl font-semibold mb-3">Enter this code in Salesforce</h2>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">
                  Open the Salesforce login page, sign in to the org you want to connect, and enter the code below.
                </p>

                <div className="surface-card p-4 mb-4 text-center">
                  <div className="text-3xl font-mono tracking-[0.4em] font-semibold mb-2">{login.data.userCode}</div>
                  <button
                    type="button"
                    onClick={() => copyCode(login.data.userCode)}
                    className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] inline-flex items-center gap-1"
                  >
                    <Copy size={12} /> {copied ? "Copied" : "Copy code"}
                  </button>
                </div>

                <a
                  href={login.data.verificationUri}
                  target="_blank"
                  rel="noreferrer"
                  className="h-10 w-full rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
                >
                  <ExternalLink size={14} /> Open Salesforce login
                </a>

                <div className="flex items-center gap-2 mt-4 text-xs text-[var(--color-text-muted)]">
                  <Loader2 size={12} className="animate-spin" />
                  {login.message}
                </div>
              </>
            )}

            {login.kind === "success" && (
              <div className="flex items-center gap-3 py-6">
                <CheckCircle2 size={18} className="text-[var(--color-success)]" />
                <span className="text-sm">Connected. Running initial scan…</span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
