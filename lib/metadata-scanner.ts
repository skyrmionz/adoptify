// Adoptify no longer scans Salesforce directly. The user's coding agent
// runs the queries locally and POSTs the JSON to /api/ingest/scan. This file
// holds the shared types (the validation contract) plus a deterministic
// scoring function so the server, not the agent, decides the readiness score.
// `buildMockScan` is still used to render a populated UI when no scan exists.

export type SnapshotFinding = {
  id: string;
  area:
    | "Foundations"
    | "Automation"
    | "Code"
    | "Data"
    | "Agents"
    | "Access"
    | "Limits"
    | "Channels"
    | "Integrations"
    | "DataDepth";
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
    daily_series?: { date: string; conversations: number }[];
    forecast_month_end?: number;
  };
  runtime: {
    sessions_30d: number;
    sessions_7d: number;
    sessions_24h: number;
    daily_by_channel: { date: string; values: Record<string, number> }[];
    by_channel_30d: Record<string, number>;
    by_agent_30d: { agentId: string; name: string; sessions: number; resolved: number; escalated: number; active: number }[];
    by_status_30d: { resolved: number; escalated: number; active: number; abandoned: number };
    avg_messages_per_session_30d: number;
    avg_handle_time_seconds_30d: number;
    feedback_30d: { positive: number; negative: number; neutral: number };
    hour_dow_heatmap: number[][];
    actions_30d: { name: string; calls: number; success: number; errors: number }[];
  };
  provisioning: {
    package_licenses: { id: string; name: string | null }[];
    bot_definitions: { id: string; developerName: string | null; status: string | null }[];
    custom_permission_sets: { id: string; name: string | null }[];
    object_count: number;
    data_cloud_owned_entity_found: boolean;
  };
  scanMeta: {
    confidence: "high" | "medium" | "low";
    probes: {
      area: string;
      label: string;
      status: "exact" | "partial" | "blocked";
      detail: string;
    }[];
  };
};

export type ChapterScore = {
  chapterId: string;
  title: string;
  score: number;
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
      daily_series: [],
      forecast_month_end: 0,
    },
    runtime: {
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
    },
    provisioning: {
      package_licenses: [],
      bot_definitions: [],
      custom_permission_sets: [],
      object_count: 42,
      data_cloud_owned_entity_found: false,
    },
    scanMeta: {
      confidence: "medium",
      probes: [
        { area: "Demo", label: "Demo scan", status: "partial", detail: "Using sample data because no org has been ingested yet." },
      ],
    },
  };
  return scoreSnapshot(snapshot, true);
}

// --- Scoring -----------------------------------------------------

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function scoreSnapshot(s: Snapshot, isMock: boolean): ScanResult {
  const findings: SnapshotFinding[] = [];

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

  if (s.integrations.named_credentials === 0 && s.integrations.external_services === 0) {
    findings.push({ id: "int-empty", area: "Integrations", severity: "warn", title: "No Named Credentials or External Services", explain: "Add at least one to call third-party APIs from your agent." });
  } else {
    findings.push({ id: "int-ok", area: "Integrations", severity: "ok", title: `${s.integrations.named_credentials} Named Credentials · ${s.integrations.external_services} External Services`, explain: "External integration points are in place." });
  }

  if (s.dataDepth.data_streams === 0 && s.data.data_cloud_dmos === 0) {
    findings.push({ id: "dd-no-cloud", area: "DataDepth", severity: "warn", title: "Data Cloud not in use", explain: "Data Cloud powers retrieval (search index + vector DB). Without it grounding is weaker." });
  } else if (s.dataDepth.data_streams > 0) {
    findings.push({ id: "dd-streams", area: "DataDepth", severity: "ok", title: `${s.dataDepth.data_streams} Data Streams`, explain: "Data Cloud is ingesting data — strong foundation for retrieval." });
  }

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
