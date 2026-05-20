"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Trash2, Plus, AlertCircle, CheckCircle2 } from "lucide-react";

type ConnRow = {
  id: string;
  instance_url: string;
  org_name: string | null;
  is_sandbox: boolean;
  last_scanned_at: string | null;
  created_at: string;
};

export function ConnectOrgPanel({
  connections,
  flash,
  oauthConfigured,
}: {
  connections: ConnRow[];
  flash: { sf_connected?: string; sf_error?: string };
  oauthConfigured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

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

  const flashError = flash.sf_error === "oauth_not_configured"
    ? "Adoptify OAuth is not configured yet. Add the shared Salesforce Connected App keys in Heroku before connecting an org."
    : flash.sf_error;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)]">Connected orgs</div>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Adoptify reads metadata only. Choose the Salesforce org during connection.</p>
        </div>
        <div className="flex gap-2">
          {oauthConfigured ? (
            <>
              <a
                href="/api/salesforce/start"
                className="h-10 px-4 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-semibold inline-flex items-center gap-2"
              >
                <Plus size={14} /> Connect production
              </a>
              <a
                href="/api/salesforce/start?sandbox=1"
                className="h-10 px-4 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] text-sm font-semibold inline-flex items-center gap-2"
              >
                <Plus size={14} /> Sandbox
              </a>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled
                className="h-10 px-4 rounded-md bg-[var(--color-accent)] opacity-40 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-not-allowed"
              >
                <Plus size={14} /> Connect production
              </button>
              <button
                type="button"
                disabled
                className="h-10 px-4 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] opacity-40 text-sm font-semibold inline-flex items-center gap-2 cursor-not-allowed"
              >
                <Plus size={14} /> Sandbox
              </button>
            </>
          )}
        </div>
      </div>

      {!oauthConfigured && (
        <div className="surface-card p-4 mb-3 border-[var(--color-warning)]/30">
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle size={14} className="text-[var(--color-warning)] mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold">Adoptify OAuth is not configured yet</div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Add the shared Adoptify Salesforce Connected App consumer key and secret in Heroku. Customers will not need to create their own Connected App.
              </p>
            </div>
          </div>
        </div>
      )}

      {flash.sf_connected && (
        <div className="surface-card p-3 mb-3 border-[var(--color-success)]/30">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 size={14} className="text-[var(--color-success)]" /> Connected successfully.
          </div>
        </div>
      )}
      {flashError && (
        <div className="surface-card p-3 mb-3 border-[var(--color-danger)]/30">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle size={14} className="text-[var(--color-danger)]" /> {flashError}
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
    </section>
  );
}
