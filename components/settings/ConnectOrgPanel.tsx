"use client";

import { Building2 } from "lucide-react";

type ConnRow = {
  id: string;
  instance_url: string;
  org_name: string | null;
  is_sandbox: boolean;
  last_scanned_at: string | null;
  created_at: string;
};

export function ConnectOrgPanel({ connections }: { connections: ConnRow[] }) {
  return (
    <section>
      <div className="mb-3">
        <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)]">Synced orgs</div>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Orgs your coding agent has synced into Adoptify. Use the connect prompt above to add another, or re-run it to refresh.
        </p>
      </div>

      {connections.length === 0 ? (
        <div className="surface-card p-8 text-center">
          <Building2 size={28} className="mx-auto text-[var(--color-text-subtle)] mb-2" />
          <div className="text-sm font-semibold">No orgs synced yet</div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Click <span className="text-[var(--color-text)] font-medium">Copy connect prompt</span> above and paste it into your coding agent. The agent will scan your org and sync the results here.
          </p>
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
                  <div className="text-sm font-semibold">{c.org_name ?? hostnameOf(c.instance_url)}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {c.is_sandbox ? "Sandbox" : "Production"} · {c.last_scanned_at ? `last synced ${new Date(c.last_scanned_at).toLocaleString()}` : "not synced yet"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
