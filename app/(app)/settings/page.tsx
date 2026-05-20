import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { ConnectOrgPanel } from "@/components/settings/ConnectOrgPanel";
import { ApiTokenPanel } from "@/components/settings/ApiTokenPanel";

export const runtime = "nodejs";

type ConnRow = {
  id: string;
  instance_url: string;
  org_name: string | null;
  is_sandbox: boolean;
  last_scanned_at: string | null;
  created_at: string;
};

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const conns = await query<ConnRow>(
    `SELECT id, instance_url, org_name, is_sandbox, last_scanned_at, created_at
     FROM salesforce_connections WHERE user_id = $1 ORDER BY last_scanned_at DESC NULLS LAST, created_at DESC`,
    [user.id],
  );

  return (
    <>
      <div className="mb-10">
        <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2">Account</div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">Manage your profile, your Adoptify API token, and your synced Salesforce orgs.</p>
      </div>

      <section className="surface-card p-5 mb-8">
        <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-3">Profile</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Email" value={user.email} />
          <Field label="Name" value={user.name ?? "—"} />
        </div>
      </section>

      <ApiTokenPanel />
      <ConnectOrgPanel connections={conns} />
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-1">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
