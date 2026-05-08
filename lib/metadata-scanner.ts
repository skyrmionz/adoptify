import { API_VERSION, SfCredentials, sfJson } from "./salesforce";

export type SnapshotFinding = {
  id: string;
  area: "Foundations" | "Automation" | "Code" | "Data" | "Agents" | "Access" | "Limits" | "Channels" | "Integrations" | "DataDepth";
  severity: "ok" | "warn" | "danger";
  title: string;
  explain: string;
};

export type Snapshot = {
  foundations: { custom_objects: number; total_fields: number; relationships: number; record_counts: Record<string, number> };
  automation: { flows_active: number; flows_inactive: number; types: Record<string, number>; avg_complexity: number };
  code: { classes: number; loc: number; coverage_pct: number; invocable: number; aura_enabled: number };
  data: { knowledge_articles: number; data_cloud_dmos: number };
  agents: { bots: number; topics: number; actions: number; prompt_templates: number };
  access: { permission_sets: number; ai_permission_sets: number; profiles: number };
  limits: { daily_api_used: number; daily_api_max: number };

  // --- New bundles ---
  agentforceSetup: {
    bot_versions_active: number;
    genai_planner_bundles: number;
    genai_plugins: number;
    prompt_templates_by_type: Record<string, number>;
    einstein_enabled?: boolean;
    genai_enabled?: boolean;
    agentforce_enabled?: boolean;
  };
  channels: {
    embedded_service_deployments: number;
    messaging_channels_total: number;
    messaging_by_type: Record<string, number>;
    experience_cloud_sites: number;
    voice_call_centers: number;
    connected_apps_total: number;
    agentforce_api_apps: number;
    conversations_30d: number;
  };
  integrations: {
    named_credentials: number;
    named_credential_auth_types: Record<string, number>;
    external_services: number;
    http_callout_apex: number;
    sample: { apex: string[]; flows: string[]; namedCredentials: string[]; externalServices: string[] };
  };
  dataDepth: {
    knowledge_data_categories: number;
    data_streams: number;
    data_lake_objects: number;
    identity_resolution_rulesets: number;
    search_index_enabled?: boolean;
  };
  consumption: {
    agentforce_conversations_used?: number;
    agentforce_conversations_max?: number;
    api_used_pct: number;
    daily_series?: { date: string; conversations: number }[]; // last 30 days
    forecast_month_end?: number; // simple linear forecast based on the last 14d slope
  };
  runtime: {
    // Conversation volume aggregations.
    sessions_30d: number;
    sessions_7d: number;
    sessions_24h: number;
    daily_by_channel: { date: string; values: Record<string, number> }[]; // last 30d
    by_channel_30d: Record<string, number>;
    by_agent_30d: { agentId: string; name: string; sessions: number; resolved: number; escalated: number; active: number }[];
    by_status_30d: { resolved: number; escalated: number; active: number; abandoned: number };
    avg_messages_per_session_30d: number;
    avg_handle_time_seconds_30d: number;
    feedback_30d: { positive: number; negative: number; neutral: number };
    hour_dow_heatmap: number[][]; // [dayOfWeek 0..6][hour 0..23] = count
    actions_30d: { name: string; calls: number; success: number; errors: number }[];
  };
};

export type ChapterScore = {
  chapterId: string;
  title: string;
  score: number; // 0-100 readiness
  notes: string;
};

export type ScanResult = {
  scanned_at: string;
  is_mock: boolean;
  score: number;
  byChapter: ChapterScore[];
  snapshot: Snapshot;
  findings: SnapshotFinding[];
};

// --- Mock --------------------------------------------------------

export function buildMockScan(): ScanResult {
  const snapshot: Snapshot = {
    foundations: {
      custom_objects: 18,
      total_fields: 412,
      relationships: 27,
      record_counts: { Account: 12450, Contact: 38_211, Case: 27_004, Opportunity: 9_876 },
    },
    automation: {
      flows_active: 24,
      flows_inactive: 6,
      types: { ScreenFlow: 9, RecordTriggered: 11, AutoLaunched: 4 },
      avg_complexity: 14.2,
    },
    code: { classes: 142, loc: 24_311, coverage_pct: 81, invocable: 6, aura_enabled: 11 },
    data: { knowledge_articles: 0, data_cloud_dmos: 0 },
    agents: { bots: 0, topics: 0, actions: 0, prompt_templates: 0 },
    access: { permission_sets: 38, ai_permission_sets: 0, profiles: 14 },
    limits: { daily_api_used: 41_022, daily_api_max: 750_000 },

    agentforceSetup: {
      bot_versions_active: 0,
      genai_planner_bundles: 0,
      genai_plugins: 0,
      prompt_templates_by_type: {},
      einstein_enabled: false,
      genai_enabled: false,
      agentforce_enabled: false,
    },
    channels: {
      embedded_service_deployments: 0,
      messaging_channels_total: 0,
      messaging_by_type: {},
      experience_cloud_sites: 0,
      voice_call_centers: 0,
      connected_apps_total: 12,
      agentforce_api_apps: 0,
      conversations_30d: 0,
    },
    integrations: {
      named_credentials: 0,
      named_credential_auth_types: {},
      external_services: 0,
      http_callout_apex: 0,
      sample: { apex: [], flows: [], namedCredentials: [], externalServices: [] },
    },
    dataDepth: {
      knowledge_data_categories: 0,
      data_streams: 0,
      data_lake_objects: 0,
      identity_resolution_rulesets: 0,
      search_index_enabled: false,
    },
    consumption: {
      api_used_pct: 5,
      daily_series: buildMockDailySeries(),
      forecast_month_end: 4200,
    },
    runtime: buildMockRuntime(),
  };
  return scoreSnapshot(snapshot, true);
}

function buildMockDailySeries(): { date: string; conversations: number }[] {
  const out: { date: string; conversations: number }[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dow = d.getDay();
    // Weekday volume higher than weekends; trending up over the month.
    const base = (dow === 0 || dow === 6) ? 30 : 80;
    const trend = (29 - i) * 1.8;
    const noise = Math.sin(i / 2) * 15;
    out.push({ date: d.toISOString().slice(0, 10), conversations: Math.max(0, Math.round(base + trend + noise)) });
  }
  return out;
}

function buildMockRuntime(): Snapshot["runtime"] {
  const series = buildMockDailySeries();
  const channels = ["Web", "WhatsApp", "Slack", "SMS", "Embedded"];
  const channelMix = [0.45, 0.18, 0.16, 0.12, 0.09];
  const daily_by_channel = series.map((d) => {
    const values: Record<string, number> = {};
    channels.forEach((c, idx) => {
      const noise = Math.sin(idx + new Date(d.date).getDate()) * 0.05;
      values[c] = Math.round(d.conversations * (channelMix[idx] + noise));
    });
    return { date: d.date, values };
  });
  const by_channel_30d: Record<string, number> = {};
  for (const d of daily_by_channel) {
    for (const [k, v] of Object.entries(d.values)) by_channel_30d[k] = (by_channel_30d[k] ?? 0) + v;
  }
  const total = series.reduce((a, b) => a + b.conversations, 0);
  const last7 = series.slice(-7).reduce((a, b) => a + b.conversations, 0);
  const last24 = series[series.length - 1]?.conversations ?? 0;
  const heatmap = Array.from({ length: 7 }, (_, dow) =>
    Array.from({ length: 24 }, (_, h) => {
      // Workday humps 9-12 and 13-17, weekends quieter.
      const isWeekend = dow === 0 || dow === 6;
      const peak = (h >= 9 && h <= 11) || (h >= 13 && h <= 16) ? 1 : (h >= 7 && h <= 19 ? 0.5 : 0.1);
      return Math.round((isWeekend ? 6 : 22) * peak * (0.85 + Math.random() * 0.3));
    }),
  );
  return {
    sessions_30d: total,
    sessions_7d: last7,
    sessions_24h: last24,
    daily_by_channel,
    by_channel_30d,
    by_agent_30d: [
      { agentId: "a1", name: "Service Agent", sessions: Math.round(total * 0.62), resolved: Math.round(total * 0.45), escalated: Math.round(total * 0.12), active: Math.round(total * 0.05) },
      { agentId: "a2", name: "Sales Coach", sessions: Math.round(total * 0.21), resolved: Math.round(total * 0.16), escalated: Math.round(total * 0.03), active: Math.round(total * 0.02) },
      { agentId: "a3", name: "Internal Copilot", sessions: Math.round(total * 0.17), resolved: Math.round(total * 0.13), escalated: Math.round(total * 0.02), active: Math.round(total * 0.02) },
    ],
    by_status_30d: {
      resolved: Math.round(total * 0.74),
      escalated: Math.round(total * 0.17),
      active: Math.round(total * 0.06),
      abandoned: Math.round(total * 0.03),
    },
    avg_messages_per_session_30d: 6.8,
    avg_handle_time_seconds_30d: 184,
    feedback_30d: {
      positive: Math.round(total * 0.34),
      negative: Math.round(total * 0.06),
      neutral: Math.round(total * 0.60),
    },
    hour_dow_heatmap: heatmap,
    actions_30d: [
      { name: "Answer Questions with Knowledge", calls: 1124, success: 1098, errors: 26 },
      { name: "Identify Record by Name", calls: 612, success: 605, errors: 7 },
      { name: "Triage_Case", calls: 414, success: 392, errors: 22 },
      { name: "Summarize Record", calls: 388, success: 385, errors: 3 },
      { name: "Update Case Owner (Flow)", calls: 234, success: 218, errors: 16 },
      { name: "Pricing Lookup (External)", calls: 189, success: 167, errors: 22 },
    ],
  };
}

// --- Real scan --------------------------------------------------

export async function runScan(creds: SfCredentials): Promise<ScanResult> {
  const [foundations, automation, code, data, agents, access, limits, agentforceSetup, channels, integrations, dataDepth, runtime] = await Promise.all([
    scanFoundations(creds),
    scanAutomation(creds),
    scanCode(creds),
    scanData(creds),
    scanAgents(creds),
    scanAccess(creds),
    scanLimits(creds),
    scanAgentforceSetup(creds),
    scanChannels(creds),
    scanIntegrations(creds),
    scanDataDepth(creds),
    scanRuntime(creds),
  ]);
  const apiPct = limits.daily_api_max > 0 ? Math.round((limits.daily_api_used / limits.daily_api_max) * 100) : 0;
  const consumption: Snapshot["consumption"] = {
    api_used_pct: apiPct,
    daily_series: runtime.daily_by_channel.map((d) => ({
      date: d.date,
      conversations: Object.values(d.values).reduce((a, b) => a + b, 0),
    })),
    forecast_month_end: forecastMonthEnd(runtime.daily_by_channel),
  };
  const snapshot: Snapshot = { foundations, automation, code, data, agents, access, limits, agentforceSetup, channels, integrations, dataDepth, consumption, runtime };
  return scoreSnapshot(snapshot, false);
}

function forecastMonthEnd(daily: { date: string; values: Record<string, number> }[]): number {
  // Simple linear forecast: average of last 14 days × days remaining in month, plus MTD actual.
  if (daily.length === 0) return 0;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysInMonth = monthEnd.getDate();
  const daysElapsed = now.getDate();
  const daysRemaining = daysInMonth - daysElapsed;

  let mtd = 0;
  for (const d of daily) {
    const dDate = new Date(d.date);
    if (dDate >= monthStart && dDate <= now) {
      mtd += Object.values(d.values).reduce((a, b) => a + b, 0);
    }
  }
  const last14 = daily.slice(-14);
  const avg14 = last14.length === 0
    ? 0
    : last14.reduce((acc, d) => acc + Object.values(d.values).reduce((a, b) => a + b, 0), 0) / last14.length;
  return Math.round(mtd + avg14 * daysRemaining);
}

async function scanRuntime(creds: SfCredentials): Promise<Snapshot["runtime"]> {
  // Best-effort runtime scan. Many orgs won't have these tables populated yet —
  // we degrade gracefully to all-zeros so the dashboard renders an empty state.
  const empty: Snapshot["runtime"] = {
    sessions_30d: 0,
    sessions_7d: 0,
    sessions_24h: 0,
    daily_by_channel: [],
    by_channel_30d: {},
    by_agent_30d: [],
    by_status_30d: { resolved: 0, escalated: 0, active: 0, abandoned: 0 },
    avg_messages_per_session_30d: 0,
    avg_handle_time_seconds_30d: 0,
    feedback_30d: { positive: 0, negative: 0, neutral: 0 },
    hour_dow_heatmap: Array.from({ length: 7 }, () => Array(24).fill(0)),
    actions_30d: [],
  };

  // Pull MessagingSession rows for the last 30 days. We accept that some
  // editions / installs return errors here; if so, return empty.
  type MsRow = {
    Id: string;
    Status?: string;
    EndUserChannelType?: string;
    StartTime?: string;
    EndTime?: string;
    BotPlannerId?: string;
  };
  let sessions: MsRow[] = [];
  try {
    const r = await sfJson<{ records: MsRow[]; totalSize: number }>(
      creds,
      `/services/data/${API_VERSION}/query?q=${encodeURIComponent(
        "SELECT Id, Status, EndUserChannelType, StartTime, EndTime, BotPlannerId FROM MessagingSession WHERE StartTime = LAST_N_DAYS:30 LIMIT 5000",
      )}`,
    );
    sessions = r.records ?? [];
  } catch {
    return empty;
  }

  if (sessions.length === 0) return empty;

  const now = new Date();
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const channels = new Set<string>();
  const dailyByChannelMap = new Map<string, Map<string, number>>(); // date -> channel -> count
  for (const day of days) dailyByChannelMap.set(day, new Map());
  const byChannel: Record<string, number> = {};
  const heat = Array.from({ length: 7 }, () => Array(24).fill(0));
  const status = { resolved: 0, escalated: 0, active: 0, abandoned: 0 };
  const byAgent = new Map<string, { sessions: number; resolved: number; escalated: number; active: number }>();
  let last7 = 0;
  let last24 = 0;
  const sevenAgo = new Date(now); sevenAgo.setDate(now.getDate() - 7);
  const dayAgo = new Date(now); dayAgo.setDate(now.getDate() - 1);

  for (const s of sessions) {
    const startStr = s.StartTime;
    if (!startStr) continue;
    const start = new Date(startStr);
    const dayKey = start.toISOString().slice(0, 10);
    const channel = s.EndUserChannelType ?? "Unknown";
    channels.add(channel);
    const dayMap = dailyByChannelMap.get(dayKey);
    if (dayMap) dayMap.set(channel, (dayMap.get(channel) ?? 0) + 1);
    byChannel[channel] = (byChannel[channel] ?? 0) + 1;

    heat[start.getDay()][start.getHours()]++;
    if (start >= sevenAgo) last7++;
    if (start >= dayAgo) last24++;

    const st = (s.Status ?? "").toLowerCase();
    if (st === "ended" || st === "completed" || st === "ended successfully") status.resolved++;
    else if (st === "escalated") status.escalated++;
    else if (st === "active") status.active++;
    else status.abandoned++;

    const agentId = s.BotPlannerId ?? "unknown";
    const agent = byAgent.get(agentId) ?? { sessions: 0, resolved: 0, escalated: 0, active: 0 };
    agent.sessions++;
    if (st === "ended" || st === "completed") agent.resolved++;
    else if (st === "escalated") agent.escalated++;
    else if (st === "active") agent.active++;
    byAgent.set(agentId, agent);
  }

  const daily_by_channel = days.map((d) => {
    const m = dailyByChannelMap.get(d) ?? new Map<string, number>();
    const values: Record<string, number> = {};
    for (const c of channels) values[c] = m.get(c) ?? 0;
    return { date: d, values };
  });

  // ConversationEntry counts for messages-per-session and rough handle time.
  let avgMsgsPerSession = 0;
  let avgHandleTime = 0;
  try {
    const r = await sfJson<{ records: { ConversationId?: string; CreatedDate?: string }[] }>(
      creds,
      `/services/data/${API_VERSION}/query?q=${encodeURIComponent(
        "SELECT ConversationId FROM ConversationEntry WHERE CreatedDate = LAST_N_DAYS:30 LIMIT 5000",
      )}`,
    );
    const perSession = new Map<string, number>();
    for (const e of r.records ?? []) {
      if (!e.ConversationId) continue;
      perSession.set(e.ConversationId, (perSession.get(e.ConversationId) ?? 0) + 1);
    }
    const counts = Array.from(perSession.values());
    avgMsgsPerSession = counts.length === 0 ? 0 : counts.reduce((a, b) => a + b, 0) / counts.length;
  } catch { /* best-effort */ }
  // Handle time: use start→end where available.
  let endedCount = 0; let totalSeconds = 0;
  for (const s of sessions) {
    if (s.StartTime && s.EndTime) {
      const dur = (new Date(s.EndTime).getTime() - new Date(s.StartTime).getTime()) / 1000;
      if (dur > 0 && dur < 24 * 3600) { totalSeconds += dur; endedCount++; }
    }
  }
  avgHandleTime = endedCount === 0 ? 0 : Math.round(totalSeconds / endedCount);

  // Feedback: query EinsteinFeedback if available.
  const feedback = { positive: 0, negative: 0, neutral: 0 };
  try {
    type Fb = { Sentiment?: string };
    const r = await sfJson<{ records: Fb[] }>(
      creds,
      `/services/data/${API_VERSION}/query?q=${encodeURIComponent(
        "SELECT Sentiment FROM EinsteinFeedback WHERE CreatedDate = LAST_N_DAYS:30 LIMIT 5000",
      )}`,
    );
    for (const f of r.records ?? []) {
      const s = (f.Sentiment ?? "").toLowerCase();
      if (s === "positive" || s === "good" || s === "thumbs_up") feedback.positive++;
      else if (s === "negative" || s === "bad" || s === "thumbs_down") feedback.negative++;
      else feedback.neutral++;
    }
  } catch { /* best-effort */ }

  return {
    sessions_30d: sessions.length,
    sessions_7d: last7,
    sessions_24h: last24,
    daily_by_channel,
    by_channel_30d: byChannel,
    by_agent_30d: Array.from(byAgent.entries()).map(([agentId, v]) => ({
      agentId,
      name: agentId,
      sessions: v.sessions,
      resolved: v.resolved,
      escalated: v.escalated,
      active: v.active,
    })).sort((a, b) => b.sessions - a.sessions).slice(0, 10),
    by_status_30d: status,
    avg_messages_per_session_30d: Math.round(avgMsgsPerSession * 10) / 10,
    avg_handle_time_seconds_30d: avgHandleTime,
    feedback_30d: feedback,
    hour_dow_heatmap: heat,
    actions_30d: [], // No reliable runtime action telemetry without Agent Studio analytics tables; leave empty.
  };
}

type ToolingQueryResult<T> = { totalSize: number; done: boolean; records: T[] };

async function tooling<T>(creds: SfCredentials, soql: string): Promise<ToolingQueryResult<T>> {
  return await sfJson<ToolingQueryResult<T>>(creds, `/services/data/${API_VERSION}/tooling/query?q=${encodeURIComponent(soql)}`);
}

async function rest<T>(creds: SfCredentials, soql: string): Promise<ToolingQueryResult<T>> {
  return await sfJson<ToolingQueryResult<T>>(creds, `/services/data/${API_VERSION}/query?q=${encodeURIComponent(soql)}`);
}

async function scanFoundations(creds: SfCredentials): Promise<Snapshot["foundations"]> {
  const objects = await tooling<{ Id: string; DeveloperName: string }>(creds, "SELECT Id, DeveloperName FROM CustomObject");
  const fields = await tooling<{ Id: string }>(creds, "SELECT Id FROM CustomField");
  const relationships = await tooling<{ Id: string }>(
    creds,
    "SELECT Id FROM CustomField WHERE DataType = 'Lookup' OR DataType = 'MasterDetail'",
  );

  const counts: Record<string, number> = {};
  for (const obj of ["Account", "Contact", "Case", "Opportunity"]) {
    try {
      const r = await rest<{ totalSize: number }>(creds, `SELECT COUNT(Id) FROM ${obj}`);
      counts[obj] = r.totalSize ?? 0;
    } catch {
      counts[obj] = 0;
    }
  }

  return {
    custom_objects: objects.totalSize,
    total_fields: fields.totalSize,
    relationships: relationships.totalSize,
    record_counts: counts,
  };
}

async function scanAutomation(creds: SfCredentials): Promise<Snapshot["automation"]> {
  type FlowRow = { Id: string; ProcessType: string; Status: string };
  const r = await tooling<FlowRow>(creds, "SELECT Id, ProcessType, Status FROM Flow");
  let active = 0;
  let inactive = 0;
  const types: Record<string, number> = {};
  for (const row of r.records) {
    if (row.Status === "Active") active++;
    else inactive++;
    types[row.ProcessType] = (types[row.ProcessType] ?? 0) + 1;
  }
  return { flows_active: active, flows_inactive: inactive, types, avg_complexity: 0 };
}

async function scanCode(creds: SfCredentials): Promise<Snapshot["code"]> {
  type ClassRow = { Id: string; LengthWithoutComments: number; Body: string | null };
  const cls = await tooling<ClassRow>(creds, "SELECT Id, LengthWithoutComments FROM ApexClass");
  const loc = cls.records.reduce((acc, c) => acc + (c.LengthWithoutComments ?? 0), 0);

  let coverage = 0;
  try {
    type Cov = { NumLinesCovered: number; NumLinesUncovered: number };
    const c = await tooling<Cov>(creds, "SELECT NumLinesCovered, NumLinesUncovered FROM ApexCodeCoverageAggregate");
    let covered = 0;
    let total = 0;
    for (const r of c.records) {
      covered += r.NumLinesCovered ?? 0;
      total += (r.NumLinesCovered ?? 0) + (r.NumLinesUncovered ?? 0);
    }
    coverage = total > 0 ? Math.round((covered / total) * 100) : 0;
  } catch {
    coverage = 0;
  }

  let invocable = 0;
  let auraEnabled = 0;
  try {
    const inv = await tooling<{ Id: string }>(
      creds,
      "SELECT Id FROM ApexClass WHERE SymbolTable.methods.annotations.name = 'InvocableMethod'",
    );
    invocable = inv.totalSize ?? 0;
  } catch { /* ok */ }
  try {
    const aura = await tooling<{ Id: string }>(
      creds,
      "SELECT Id FROM ApexClass WHERE SymbolTable.methods.annotations.name = 'AuraEnabled'",
    );
    auraEnabled = aura.totalSize ?? 0;
  } catch { /* ok */ }

  return { classes: cls.totalSize, loc, coverage_pct: coverage, invocable, aura_enabled: auraEnabled };
}

async function scanData(creds: SfCredentials): Promise<Snapshot["data"]> {
  let kArticles = 0;
  try {
    const k = await rest<{ totalSize: number }>(creds, "SELECT COUNT(Id) FROM Knowledge__kav WHERE PublishStatus = 'Online'");
    kArticles = k.totalSize ?? 0;
  } catch {
    kArticles = 0;
  }
  let dmos = 0;
  try {
    const d = await tooling<{ Id: string }>(creds, "SELECT Id FROM MktDataModelObject");
    dmos = d.totalSize ?? 0;
  } catch {
    dmos = 0;
  }
  return { knowledge_articles: kArticles, data_cloud_dmos: dmos };
}

async function scanAgents(creds: SfCredentials): Promise<Snapshot["agents"]> {
  let bots = 0;
  let topics = 0;
  let actions = 0;
  let prompts = 0;
  try { bots = (await tooling<{ Id: string }>(creds, "SELECT Id FROM BotDefinition")).totalSize ?? 0; } catch { /* ok */ }
  try { topics = (await tooling<{ Id: string }>(creds, "SELECT Id FROM GenAiPlanner")).totalSize ?? 0; } catch { /* ok */ }
  try { actions = (await tooling<{ Id: string }>(creds, "SELECT Id FROM GenAiFunction")).totalSize ?? 0; } catch { /* ok */ }
  try { prompts = (await tooling<{ Id: string }>(creds, "SELECT Id FROM GenAiPromptTemplate")).totalSize ?? 0; } catch { /* ok */ }
  return { bots, topics, actions, prompt_templates: prompts };
}

async function scanAccess(creds: SfCredentials): Promise<Snapshot["access"]> {
  let permsets = 0;
  let aiPermsets = 0;
  let profiles = 0;
  try { permsets = (await rest<{ totalSize: number }>(creds, "SELECT COUNT(Id) FROM PermissionSet")).totalSize ?? 0; } catch { /* ok */ }
  try {
    aiPermsets = (await rest<{ totalSize: number }>(
      creds,
      "SELECT COUNT(Id) FROM PermissionSet WHERE Label LIKE '%Einstein%' OR Label LIKE '%Agent%'",
    )).totalSize ?? 0;
  } catch { /* ok */ }
  try { profiles = (await rest<{ totalSize: number }>(creds, "SELECT COUNT(Id) FROM Profile")).totalSize ?? 0; } catch { /* ok */ }
  return { permission_sets: permsets, ai_permission_sets: aiPermsets, profiles };
}

async function scanLimits(creds: SfCredentials): Promise<Snapshot["limits"]> {
  try {
    const l = await sfJson<Record<string, { Max: number; Remaining: number }>>(creds, `/services/data/${API_VERSION}/limits`);
    const api = l.DailyApiRequests ?? { Max: 0, Remaining: 0 };
    return { daily_api_used: api.Max - api.Remaining, daily_api_max: api.Max };
  } catch {
    return { daily_api_used: 0, daily_api_max: 0 };
  }
}

// --- New scans ---

async function scanAgentforceSetup(creds: SfCredentials): Promise<Snapshot["agentforceSetup"]> {
  let activeBotVersions = 0;
  let bundles = 0;
  let plugins = 0;
  const promptByType: Record<string, number> = {};

  try {
    activeBotVersions = (await tooling<{ Id: string }>(creds, "SELECT Id FROM BotVersion WHERE Status = 'Active'")).totalSize ?? 0;
  } catch { /* ok */ }
  try { bundles = (await tooling<{ Id: string }>(creds, "SELECT Id FROM GenAiPlannerBundle")).totalSize ?? 0; } catch { /* ok */ }
  try { plugins = (await tooling<{ Id: string }>(creds, "SELECT Id FROM GenAiPlugin")).totalSize ?? 0; } catch { /* ok */ }
  try {
    type Row = { TemplateType: string };
    const r = await tooling<Row>(creds, "SELECT TemplateType FROM GenAiPromptTemplate");
    for (const row of r.records) {
      const t = row.TemplateType ?? "Unknown";
      promptByType[t] = (promptByType[t] ?? 0) + 1;
    }
  } catch { /* ok */ }

  // Best-effort toggle inference: if any bot version exists, Agentforce is on.
  return {
    bot_versions_active: activeBotVersions,
    genai_planner_bundles: bundles,
    genai_plugins: plugins,
    prompt_templates_by_type: promptByType,
    agentforce_enabled: activeBotVersions > 0 || bundles > 0,
    genai_enabled: plugins > 0 || Object.keys(promptByType).length > 0,
    einstein_enabled: undefined,
  };
}

async function scanChannels(creds: SfCredentials): Promise<Snapshot["channels"]> {
  let embedded = 0;
  let messagingTotal = 0;
  const messagingByType: Record<string, number> = {};
  let networks = 0;
  let voice = 0;
  let connectedApps = 0;
  let agentforceApiApps = 0;
  let conversations30d = 0;

  try { embedded = (await tooling<{ Id: string }>(creds, "SELECT Id FROM EmbeddedServiceDeployment")).totalSize ?? 0; } catch { /* ok */ }
  try {
    type Row = { ChannelType?: string; MessagingPlatformKey?: string };
    const r = await rest<Row>(creds, "SELECT ChannelType, MessagingPlatformKey FROM MessagingChannel");
    messagingTotal = r.totalSize ?? r.records.length ?? 0;
    for (const row of r.records) {
      const t = row.ChannelType ?? row.MessagingPlatformKey ?? "Unknown";
      messagingByType[t] = (messagingByType[t] ?? 0) + 1;
    }
  } catch { /* ok */ }
  try { networks = (await rest<{ Id: string }>(creds, "SELECT Id FROM Network")).totalSize ?? 0; } catch { /* ok */ }
  try { voice = (await rest<{ Id: string }>(creds, "SELECT Id FROM CallCenter")).totalSize ?? 0; } catch { /* ok */ }
  try { connectedApps = (await tooling<{ Id: string }>(creds, "SELECT Id FROM ConnectedApplication")).totalSize ?? 0; } catch { /* ok */ }
  try {
    // Heuristic: connected apps whose Label/Name contains 'Agent' or 'Chatbot'
    agentforceApiApps = (await tooling<{ Id: string }>(
      creds,
      "SELECT Id FROM ConnectedApplication WHERE Name LIKE '%Agent%' OR Name LIKE '%Chatbot%'",
    )).totalSize ?? 0;
  } catch { /* ok */ }
  try {
    conversations30d = (await rest<{ totalSize: number }>(
      creds,
      "SELECT COUNT(Id) FROM MessagingSession WHERE CreatedDate = LAST_N_DAYS:30",
    )).totalSize ?? 0;
  } catch { /* ok */ }

  return {
    embedded_service_deployments: embedded,
    messaging_channels_total: messagingTotal,
    messaging_by_type: messagingByType,
    experience_cloud_sites: networks,
    voice_call_centers: voice,
    connected_apps_total: connectedApps,
    agentforce_api_apps: agentforceApiApps,
    conversations_30d: conversations30d,
  };
}

async function scanIntegrations(creds: SfCredentials): Promise<Snapshot["integrations"]> {
  let nc = 0;
  const ncTypes: Record<string, number> = {};
  let es = 0;
  let httpApex = 0;

  const sampleApex: string[] = [];
  const sampleFlows: string[] = [];
  const sampleNc: string[] = [];
  const sampleEs: string[] = [];

  try {
    type Row = { Id: string; DeveloperName?: string; PrincipalType?: string };
    const r = await tooling<Row>(creds, "SELECT Id, DeveloperName, PrincipalType FROM NamedCredential LIMIT 50");
    nc = r.totalSize ?? r.records.length ?? 0;
    for (const row of r.records) {
      const t = row.PrincipalType ?? "Unknown";
      ncTypes[t] = (ncTypes[t] ?? 0) + 1;
      if (row.DeveloperName) sampleNc.push(row.DeveloperName);
    }
  } catch { /* ok */ }
  try {
    type Row = { Id: string; DeveloperName?: string };
    const r = await tooling<Row>(creds, "SELECT Id, DeveloperName FROM ExternalServiceRegistration LIMIT 50");
    es = r.totalSize ?? r.records.length ?? 0;
    for (const row of r.records) if (row.DeveloperName) sampleEs.push(row.DeveloperName);
  } catch { /* ok */ }
  try {
    httpApex = (await tooling<{ Id: string }>(
      creds,
      "SELECT Id FROM ApexClass WHERE Body LIKE '%System.HttpRequest%'",
    )).totalSize ?? 0;
  } catch { /* ok */ }
  try {
    type Row = { Id: string; Name?: string };
    const r = await tooling<Row>(
      creds,
      "SELECT Id, Name FROM ApexClass WHERE SymbolTable.methods.annotations.name = 'InvocableMethod' LIMIT 25",
    );
    for (const row of r.records) if (row.Name) sampleApex.push(row.Name);
  } catch { /* ok */ }
  try {
    type Row = { Id: string; MasterLabel?: string; ProcessType?: string };
    const r = await tooling<Row>(
      creds,
      "SELECT Id, MasterLabel, ProcessType FROM Flow WHERE ProcessType = 'AutoLaunchedFlow' AND Status = 'Active' LIMIT 25",
    );
    for (const row of r.records) if (row.MasterLabel) sampleFlows.push(row.MasterLabel);
  } catch { /* ok */ }

  return {
    named_credentials: nc,
    named_credential_auth_types: ncTypes,
    external_services: es,
    http_callout_apex: httpApex,
    sample: { apex: sampleApex, flows: sampleFlows, namedCredentials: sampleNc, externalServices: sampleEs },
  };
}

async function scanDataDepth(creds: SfCredentials): Promise<Snapshot["dataDepth"]> {
  let dataCategories = 0;
  let dataStreams = 0;
  let dataLakeObjects = 0;
  let identityRules = 0;
  let searchIndex: boolean | undefined = undefined;

  try {
    dataCategories = (await rest<{ totalSize: number }>(
      creds,
      "SELECT COUNT(Id) FROM DataCategory",
    )).totalSize ?? 0;
  } catch { /* ok */ }
  try {
    dataStreams = (await tooling<{ Id: string }>(creds, "SELECT Id FROM MktDataStream")).totalSize ?? 0;
  } catch { /* ok */ }
  try {
    dataLakeObjects = (await tooling<{ Id: string }>(creds, "SELECT Id FROM MktDataLakeObject")).totalSize ?? 0;
  } catch { /* ok */ }
  try {
    identityRules = (await tooling<{ Id: string }>(creds, "SELECT Id FROM MktIdentityResolutionRuleset")).totalSize ?? 0;
  } catch { /* ok */ }
  // Search index probe is best-effort; many orgs won't expose this endpoint.
  searchIndex = dataLakeObjects > 0 ? true : undefined;

  return {
    knowledge_data_categories: dataCategories,
    data_streams: dataStreams,
    data_lake_objects: dataLakeObjects,
    identity_resolution_rulesets: identityRules,
    search_index_enabled: searchIndex,
  };
}

// --- Scoring ----------------------------------------------------

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function scoreSnapshot(s: Snapshot, isMock: boolean): ScanResult {
  const findings: SnapshotFinding[] = [];

  // Foundations finding
  if (s.foundations.custom_objects > 0) {
    findings.push({ id: "f-custom-objects", area: "Foundations", severity: "ok", title: `${s.foundations.custom_objects} custom objects`, explain: "Custom objects suggest a real data model exists for an agent to ground in." });
  } else {
    findings.push({ id: "f-no-custom-objects", area: "Foundations", severity: "warn", title: "No custom objects", explain: "Most production agents need a domain-specific schema." });
  }
  if (s.code.invocable > 0) {
    findings.push({ id: "c-invocable", area: "Code", severity: "ok", title: `${s.code.invocable} invocable methods`, explain: "@InvocableMethod Apex can be wired up as agent actions directly." });
  } else {
    findings.push({ id: "c-no-invocable", area: "Code", severity: "warn", title: "No invocable Apex methods", explain: "Agents call your business logic via @InvocableMethod or Flow." });
  }
  if (s.code.coverage_pct < 75 && s.code.classes > 0) {
    findings.push({ id: "c-coverage", area: "Code", severity: "warn", title: `Apex coverage ${s.code.coverage_pct}%`, explain: "Salesforce requires ≥75% to deploy. Low coverage will block new actions." });
  }
  if (s.data.knowledge_articles >= 10) {
    findings.push({ id: "d-knowledge", area: "Data", severity: "ok", title: `${s.data.knowledge_articles} Knowledge articles`, explain: "A meaningful Knowledge corpus is one of the strongest grounding signals." });
  } else if (s.data.knowledge_articles > 0) {
    findings.push({ id: "d-knowledge-thin", area: "Data", severity: "warn", title: `Only ${s.data.knowledge_articles} Knowledge articles`, explain: "Light grounding will hurt answer quality." });
  } else {
    findings.push({ id: "d-no-knowledge", area: "Data", severity: "warn", title: "No published Knowledge articles", explain: "Without grounding, the agent will rely on general LLM knowledge." });
  }
  if (s.agents.bots > 0) {
    findings.push({ id: "a-bots", area: "Agents", severity: "ok", title: `${s.agents.bots} agent definitions exist`, explain: "Existing agents are good starting points to extend or replace." });
  } else {
    findings.push({ id: "a-no-bots", area: "Agents", severity: "warn", title: "No agents defined yet", explain: "That's expected — Chapter 4 will guide you to build one." });
  }
  if (s.access.ai_permission_sets > 0) {
    findings.push({ id: "x-ai-perms", area: "Access", severity: "ok", title: `${s.access.ai_permission_sets} AI permission set(s)`, explain: "Looks like Einstein/Agent licensing is provisioned." });
  } else {
    findings.push({ id: "x-no-ai-perms", area: "Access", severity: "warn", title: "No AI/Einstein permission sets detected", explain: "You'll need to assign Einstein and Agentforce PSLs to runtime users." });
  }
  const apiUtil = s.limits.daily_api_max > 0 ? s.limits.daily_api_used / s.limits.daily_api_max : 0;
  if (apiUtil > 0.6) {
    findings.push({ id: "l-api-high", area: "Limits", severity: "danger", title: `API utilization at ${Math.round(apiUtil * 100)}%`, explain: "Agents drive API traffic. You'll likely hit limits in production." });
  }

  // Channels findings
  if (s.channels.embedded_service_deployments > 0) {
    findings.push({ id: "ch-esd", area: "Channels", severity: "ok", title: `${s.channels.embedded_service_deployments} Embedded Service deployments`, explain: "You can host your agent on web/mobile through these." });
  }
  if (s.channels.messaging_channels_total > 0) {
    findings.push({ id: "ch-msg", area: "Channels", severity: "ok", title: `${s.channels.messaging_channels_total} messaging channels`, explain: "Messaging channels (WhatsApp, SMS, FB) can route to your agent." });
  }
  if (s.channels.experience_cloud_sites > 0) {
    findings.push({ id: "ch-net", area: "Channels", severity: "ok", title: `${s.channels.experience_cloud_sites} Experience Cloud sites`, explain: "Experience Cloud sites can host your agent for partners/customers." });
  }
  if (s.channels.conversations_30d === 0 && s.agents.bots === 0) {
    findings.push({ id: "ch-no-conv", area: "Channels", severity: "warn", title: "No live conversations yet", explain: "Once your agent is deployed, conversations will populate here." });
  }

  // Integrations findings
  if (s.integrations.named_credentials === 0 && s.integrations.external_services === 0) {
    findings.push({ id: "int-empty", area: "Integrations", severity: "warn", title: "No Named Credentials or External Services", explain: "Add at least one to call third-party APIs from your agent." });
  } else {
    findings.push({ id: "int-ok", area: "Integrations", severity: "ok", title: `${s.integrations.named_credentials} Named Credentials · ${s.integrations.external_services} External Services`, explain: "External integration points are in place." });
  }

  // Data depth findings
  if (s.dataDepth.data_streams === 0 && s.data.data_cloud_dmos === 0) {
    findings.push({ id: "dd-no-cloud", area: "DataDepth", severity: "warn", title: "Data Cloud not in use", explain: "Data Cloud powers retrieval (search index + vector DB). Without it grounding is weaker." });
  } else if (s.dataDepth.data_streams > 0) {
    findings.push({ id: "dd-streams", area: "DataDepth", severity: "ok", title: `${s.dataDepth.data_streams} Data Streams`, explain: "Data Cloud is ingesting data — strong foundation for retrieval." });
  }

  // --- byChapter readiness ---
  const ch1 = clamp(
    100 * (s.foundations.custom_objects > 0 ? 0.34 : 0.1) +
    100 * (s.data.knowledge_articles > 0 ? 0.33 : 0.1) +
    100 * (s.foundations.record_counts.Account > 0 ? 0.33 : 0.1),
  );
  const ch2 = clamp(
    100 * (s.access.ai_permission_sets > 0 ? 0.5 : 0) +
    100 * (s.agentforceSetup.agentforce_enabled ? 0.3 : 0) +
    100 * (s.agentforceSetup.genai_enabled ? 0.2 : 0),
  );
  const ch3 = clamp(
    25 * (s.data.knowledge_articles > 0 ? 1 : 0) +
    25 * Math.min(1, s.data.knowledge_articles / 25) +
    25 * Math.min(1, s.dataDepth.data_streams / 3) +
    25 * (s.dataDepth.identity_resolution_rulesets > 0 ? 1 : 0),
  );
  const ch4 = clamp(
    25 * Math.min(1, s.code.invocable / 3) +
    20 * Math.min(1, (s.automation.types?.AutoLaunchedFlow ?? 0) / 3) +
    20 * Math.min(1, s.integrations.named_credentials / 2) +
    20 * Math.min(1, s.agents.prompt_templates / 3) +
    15 * (s.agentforceSetup.bot_versions_active > 0 ? 1 : 0),
  );
  const ch5 = clamp(
    30 * (s.channels.embedded_service_deployments + s.channels.messaging_channels_total + s.channels.experience_cloud_sites > 0 ? 1 : 0) +
    20 * (s.channels.agentforce_api_apps > 0 ? 1 : 0) +
    25 * (s.agentforceSetup.bot_versions_active > 0 ? 1 : 0) +
    25 * (s.channels.conversations_30d > 0 ? 1 : 0),
  );

  const byChapter: ChapterScore[] = [
    { chapterId: "pre-agent-setup", title: "Pre-Agent Setup", score: ch1, notes: "Custom objects, Knowledge presence, record volume." },
    { chapterId: "salesforce-setup", title: "Salesforce Setup & Licensing", score: ch2, notes: "PSL coverage, Agentforce/GenAI toggles inferred." },
    { chapterId: "data-foundations", title: "Data & Knowledge Foundations", score: ch3, notes: "Knowledge depth, Data Streams, Identity Resolution." },
    { chapterId: "build-your-agent", title: "Build Your Agent", score: ch4, notes: "Invocable Apex, autolaunched Flows, Named Credentials, prompt templates, active BotVersion." },
    { chapterId: "channels-and-launch", title: "Channels & Launch", score: ch5, notes: "Channel surfaces, Connected Apps for Agentforce API, live conversations." },
  ];

  // Top-line score: weighted average of chapter scores (later chapters weigh more).
  const weights = [1, 1.2, 1.3, 1.5, 1.5];
  const wSum = weights.reduce((a, b) => a + b, 0);
  const score = clamp(byChapter.reduce((a, c, i) => a + c.score * weights[i], 0) / wSum);

  return {
    scanned_at: new Date().toISOString(),
    is_mock: isMock,
    score,
    byChapter,
    snapshot: s,
    findings,
  };
}
