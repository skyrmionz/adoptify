import { KpiCard } from "@/components/analytics/KpiCard";
import { StackedAreaByChannel } from "@/components/analytics/StackedAreaByChannel";
import { HBarList } from "@/components/analytics/HBarList";
import { Heatmap } from "@/components/analytics/Heatmap";
import { ResolutionDonut } from "@/components/analytics/ResolutionDonut";
import { ConsumptionGauge } from "@/components/analytics/ConsumptionGauge";
import { getSessionUser } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export const runtime = "nodejs";

type DailyByChannel = { date: string; values: Record<string, number> };
type AgentRow = { agentId: string; name: string; sessions: number; resolved: number; escalated: number; active: number };
type ActionRow = { name: string; calls: number; success: number; errors: number };

type Snapshot = {
  data?: { knowledge_articles?: number };
  agents?: { bots?: number; topics?: number; actions?: number };
  agentforceSetup?: { bot_versions_active?: number };
  channels?: { conversations_30d?: number };
  consumption?: { agentforce_conversations_used?: number; agentforce_conversations_max?: number; api_used_pct?: number; daily_series?: { date: string; conversations: number }[]; forecast_month_end?: number };
  runtime?: {
    sessions_30d?: number;
    sessions_7d?: number;
    sessions_24h?: number;
    daily_by_channel?: DailyByChannel[];
    by_channel_30d?: Record<string, number>;
    by_agent_30d?: AgentRow[];
    by_status_30d?: { resolved?: number; escalated?: number; active?: number; abandoned?: number };
    avg_messages_per_session_30d?: number;
    avg_handle_time_seconds_30d?: number;
    feedback_30d?: { positive?: number; negative?: number; neutral?: number };
    hour_dow_heatmap?: number[][];
    actions_30d?: ActionRow[];
  };
};

const CHANNEL_PALETTE = [
  "#00A1E0", // Web / primary
  "#1FE0FF", // WhatsApp
  "#7C8AFF", // Slack
  "#22C55E", // SMS
  "#F5B83D", // Embedded
  "#EF4444", // Voice
  "#A855F7", // Other
];

function deltaFromSeries(series: number[]): { value: string; positive: boolean } | undefined {
  if (series.length < 14) return undefined;
  const last7 = series.slice(-7).reduce((a, b) => a + b, 0);
  const prev7 = series.slice(-14, -7).reduce((a, b) => a + b, 0);
  if (prev7 === 0) return last7 > 0 ? { value: "new", positive: true } : undefined;
  const pct = Math.round(((last7 - prev7) / prev7) * 100);
  if (pct === 0) return { value: "flat", positive: true };
  return { value: `${pct > 0 ? "+" : ""}${pct}% WoW`, positive: pct >= 0 };
}

function formatSeconds(s: number): string {
  if (s <= 0) return "—";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

export default async function AnalyticsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const latest = await queryOne<{ score: number | null; scanned_at: string; snapshot_json: Snapshot }>(
    `SELECT score, scanned_at, snapshot_json
     FROM org_assessments WHERE user_id = $1 ORDER BY scanned_at DESC LIMIT 1`,
    [user.id],
  );
  const snap: Snapshot = latest?.snapshot_json ?? {};
  const runtime = snap.runtime ?? {};

  const sessions30 = runtime.sessions_30d ?? snap.channels?.conversations_30d ?? 0;
  const sessions7 = runtime.sessions_7d ?? 0;
  const sessions24 = runtime.sessions_24h ?? 0;

  const dailyConvs = (snap.consumption?.daily_series ?? []).map((d) => d.conversations);
  const dailyByChannel = runtime.daily_by_channel ?? [];

  const channelEntries = Object.entries(runtime.by_channel_30d ?? {}).sort((a, b) => b[1] - a[1]);
  const channels = channelEntries.map(([name], i) => ({ name, color: CHANNEL_PALETTE[i % CHANNEL_PALETTE.length] }));

  const status = runtime.by_status_30d ?? { resolved: 0, escalated: 0, active: 0, abandoned: 0 };
  const totalForRate = (status.resolved ?? 0) + (status.escalated ?? 0) + (status.active ?? 0) + (status.abandoned ?? 0);
  const resolutionRate = totalForRate === 0 ? 0 : Math.round(((status.resolved ?? 0) / totalForRate) * 100);

  const feedback = runtime.feedback_30d ?? { positive: 0, negative: 0, neutral: 0 };
  const feedbackTotal = (feedback.positive ?? 0) + (feedback.negative ?? 0) + (feedback.neutral ?? 0);
  const csat = feedbackTotal === 0 ? null : Math.round(((feedback.positive ?? 0) / feedbackTotal) * 100);

  const agents = (runtime.by_agent_30d ?? []).slice(0, 6).map((a) => ({
    label: a.name,
    value: a.sessions,
    meta: a.sessions === 0 ? "0%" : `${Math.round(((a.resolved ?? 0) / a.sessions) * 100)}% resolved`,
  }));

  const actionRows = (runtime.actions_30d ?? []).slice(0, 8).map((a) => ({
    label: a.name,
    value: a.calls,
    split: { success: a.success, error: a.errors },
    meta: a.calls === 0 ? "0% errors" : `${Math.round((a.errors / a.calls) * 100)}% errors`,
  }));

  const channelRows = channelEntries.slice(0, 6).map(([name, value]) => ({
    label: name,
    value,
    meta: sessions30 === 0 ? "0%" : `${Math.round((value / sessions30) * 100)}%`,
  }));

  const used = snap.consumption?.agentforce_conversations_used ?? Math.round(sessions30 * 0.85); // best-effort fallback
  const capacity = snap.consumption?.agentforce_conversations_max ?? 0;
  const forecast = snap.consumption?.forecast_month_end ?? undefined;

  return (
    <>
      <div className="mb-10">
        <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2">Performance</div>
        <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">
          {latest
            ? `Live runtime telemetry from your connected org. Snapshot ${new Date(latest.scanned_at).toLocaleString()}.`
            : "No org scan yet — run one from a mission to populate this dashboard with real data."}
        </p>
      </div>

      {/* Hero KPIs — what every customer asks first */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Conversations · 30d"
          value={sessions30.toLocaleString()}
          delta={deltaFromSeries(dailyConvs)}
          spark={dailyConvs.slice(-14)}
        />
        <KpiCard
          label="Resolution rate"
          value={`${resolutionRate}%`}
          delta={status.escalated ? { value: `${status.escalated} escalated`, positive: false } : undefined}
        />
        <KpiCard
          label="CSAT (thumbs-up)"
          value={csat == null ? "—" : `${csat}%`}
          delta={feedback.negative ? { value: `${feedback.negative} negative`, positive: false } : undefined}
        />
        <KpiCard
          label="Avg handle time"
          value={formatSeconds(runtime.avg_handle_time_seconds_30d ?? 0)}
          delta={runtime.avg_messages_per_session_30d ? { value: `${runtime.avg_messages_per_session_30d} msgs/session`, positive: true } : undefined}
        />
      </div>

      {/* Volume — the most important chart */}
      <div className="mb-8">
        <StackedAreaByChannel
          data={dailyByChannel}
          channels={channels.length === 0 ? [{ name: "Conversations", color: "#00A1E0" }] : channels}
        />
      </div>

      {/* Where + who — channel mix and agent leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <HBarList
          title="Where conversations happen"
          subtitle="Channel mix · last 30 days"
          rightHeader="% of total"
          rows={channelRows}
        />
        <HBarList
          title="Agent leaderboard"
          subtitle="Sessions handled · last 30 days"
          rightHeader="Resolution"
          rows={agents}
        />
      </div>

      {/* Outcomes + capacity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <ResolutionDonut
          resolved={status.resolved ?? 0}
          escalated={status.escalated ?? 0}
          active={status.active ?? 0}
          abandoned={status.abandoned ?? 0}
        />
        <ConsumptionGauge
          used={used}
          capacity={capacity}
          forecast={forecast}
          series={dailyConvs.slice(-14)}
        />
      </div>

      {/* When + what — heatmap and action errors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <Heatmap
          title="When are people using the agent?"
          subtitle="Hour × day-of-week · last 30 days"
          data={runtime.hour_dow_heatmap ?? Array.from({ length: 7 }, () => Array(24).fill(0))}
        />
        <HBarList
          title="Top actions called"
          subtitle="Calls and error rate · last 30 days"
          rightHeader="Errors"
          rows={actionRows}
        />
      </div>

      {/* Foot row — recent windows + raw counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Last 24 hours" value={sessions24.toLocaleString()} />
        <KpiCard label="Last 7 days" value={sessions7.toLocaleString()} />
        <KpiCard label="Active agents" value={`${snap.agentforceSetup?.bot_versions_active ?? snap.agents?.bots ?? 0}`} />
        <KpiCard label="Knowledge articles" value={`${snap.data?.knowledge_articles ?? 0}`} />
      </div>
    </>
  );
}
