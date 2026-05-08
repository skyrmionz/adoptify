import { ShellLayout } from "@/components/shell/ShellLayout";
import { KpiCard } from "@/components/analytics/KpiCard";
import { ConsumptionChart } from "@/components/analytics/ConsumptionChart";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { queryOne } from "@/lib/db";

export const runtime = "nodejs";

type Snapshot = {
  data?: { knowledge_articles?: number };
  agents?: { bots?: number; topics?: number; actions?: number };
  limits?: { daily_api_used?: number; daily_api_max?: number };
  code?: { invocable?: number; classes?: number; coverage_pct?: number };
  automation?: { flows_active?: number };
};

export default async function AnalyticsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const latest = await queryOne<{ score: number | null; scanned_at: string; snapshot_json: Snapshot }>(
    `SELECT score, scanned_at, snapshot_json
     FROM org_assessments WHERE user_id = $1 ORDER BY scanned_at DESC LIMIT 1`,
    [user.id],
  );

  const snap: Snapshot = latest?.snapshot_json ?? {};

  // Synthetic series for the demo. Real telemetry pipelines come later.
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  });
  const seed = (latest?.score ?? 35) / 100;
  const invocations = days.map((_, i) => Math.round(40 + 80 * seed + i * 6 + Math.sin(i / 2) * 12));
  const tokens = days.map((_, i) => Math.round(20_000 + 40_000 * seed + i * 1500 + Math.cos(i / 3) * 4000));
  const tools = days.map((_, i) => Math.round(8 + 20 * seed + i * 1.2 + Math.sin(i) * 3));

  const apiUsed = snap.limits?.daily_api_used ?? 0;
  const apiMax = snap.limits?.daily_api_max ?? 0;
  const apiPct = apiMax > 0 ? Math.round((apiUsed / apiMax) * 100) : 0;

  return (
    <ShellLayout>
      <div className="mb-10">
        <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2">Org overview</div>
        <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">
          {latest ? `Snapshot from ${new Date(latest.scanned_at).toLocaleString()}.` : "No org scan yet — run one from a mission to populate this dashboard."}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Readiness score"
          value={latest?.score != null ? `${latest.score}` : "—"}
          delta={{ value: "+8 vs last week", positive: true }}
          spark={[12, 14, 18, 16, 22, 28, 32, latest?.score ?? 35]}
        />
        <KpiCard
          label="Active agents"
          value={`${snap.agents?.bots ?? 0}`}
          spark={[0, 0, 0, 1, 1, 1, snap.agents?.bots ?? 0]}
        />
        <KpiCard
          label="Knowledge articles"
          value={`${snap.data?.knowledge_articles ?? 0}`}
          delta={undefined}
          spark={[0, 0, 0, 0, 0, snap.data?.knowledge_articles ?? 0]}
        />
        <KpiCard
          label="API used today"
          value={apiMax > 0 ? `${apiPct}%` : "—"}
          delta={apiMax > 0 ? { value: `${apiUsed.toLocaleString()} / ${apiMax.toLocaleString()}`, positive: apiPct < 60 } : undefined}
          spark={[5, 8, 11, 16, 22, 28, apiPct]}
        />
      </div>

      <ConsumptionChart
        labels={days}
        series={[
          { name: "Invocations", color: "#00A1E0", data: invocations },
          { name: "Tool calls", color: "#1FE0FF", data: tools },
          { name: "Tokens (k)", color: "#7C8AFF", data: tokens.map((t) => Math.round(t / 1000)) },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <KpiCard label="Active flows" value={`${snap.automation?.flows_active ?? 0}`} />
        <KpiCard label="Apex classes" value={`${snap.code?.classes ?? 0}`} delta={snap.code?.coverage_pct != null ? { value: `${snap.code.coverage_pct}% covered`, positive: (snap.code.coverage_pct ?? 0) >= 75 } : undefined} />
        <KpiCard label="Invocable methods" value={`${snap.code?.invocable ?? 0}`} />
      </div>
    </ShellLayout>
  );
}
