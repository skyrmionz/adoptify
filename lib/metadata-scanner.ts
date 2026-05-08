import { API_VERSION, SfCredentials, sfJson } from "./salesforce";

export type SnapshotFinding = {
  id: string;
  area: "Foundations" | "Automation" | "Code" | "Data" | "Agents" | "Access" | "Limits";
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
};

export type ScanResult = {
  scanned_at: string;
  is_mock: boolean;
  score: number;
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
  };
  return scoreSnapshot(snapshot, true);
}

// --- Real scan --------------------------------------------------

export async function runScan(creds: SfCredentials): Promise<ScanResult> {
  const [foundations, automation, code, data, agents, access, limits] = await Promise.all([
    scanFoundations(creds),
    scanAutomation(creds),
    scanCode(creds),
    scanData(creds),
    scanAgents(creds),
    scanAccess(creds),
    scanLimits(creds),
  ]);
  const snapshot: Snapshot = { foundations, automation, code, data, agents, access, limits };
  return scoreSnapshot(snapshot, false);
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
  // Lookup fields == relationships (approx)
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
  const r = await tooling<FlowRow>(
    creds,
    "SELECT Id, ProcessType, Status FROM Flow",
  );
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
  } catch {
    /* not all orgs return SymbolTable; fall back to 0 */
  }
  try {
    const aura = await tooling<{ Id: string }>(
      creds,
      "SELECT Id FROM ApexClass WHERE SymbolTable.methods.annotations.name = 'AuraEnabled'",
    );
    auraEnabled = aura.totalSize ?? 0;
  } catch {
    /* same as above */
  }

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

// --- Scoring ----------------------------------------------------

export function scoreSnapshot(s: Snapshot, isMock: boolean): ScanResult {
  const findings: SnapshotFinding[] = [];

  // Foundations
  if (s.foundations.custom_objects > 0) {
    findings.push({ id: "f-custom-objects", area: "Foundations", severity: "ok", title: `${s.foundations.custom_objects} custom objects`, explain: "Custom objects suggest a real data model exists for an agent to ground in." });
  } else {
    findings.push({ id: "f-no-custom-objects", area: "Foundations", severity: "warn", title: "No custom objects", explain: "Most production agents need a domain-specific schema. Consider whether standard objects alone are enough." });
  }

  // Code
  if (s.code.invocable > 0) {
    findings.push({ id: "c-invocable", area: "Code", severity: "ok", title: `${s.code.invocable} invocable methods`, explain: "Apex with @InvocableMethod can be wired up as agent actions directly." });
  } else {
    findings.push({ id: "c-no-invocable", area: "Code", severity: "warn", title: "No invocable Apex methods detected", explain: "Agents call your business logic via @InvocableMethod or Flow. You'll likely need a few." });
  }
  if (s.code.coverage_pct < 75 && s.code.classes > 0) {
    findings.push({ id: "c-coverage", area: "Code", severity: "warn", title: `Apex coverage ${s.code.coverage_pct}%`, explain: "Salesforce requires ≥75% to deploy. Low coverage will block new actions you write for the agent." });
  }

  // Data
  if (s.data.knowledge_articles >= 10) {
    findings.push({ id: "d-knowledge", area: "Data", severity: "ok", title: `${s.data.knowledge_articles} Knowledge articles`, explain: "A meaningful Knowledge corpus is one of the strongest grounding signals available." });
  } else if (s.data.knowledge_articles > 0) {
    findings.push({ id: "d-knowledge-thin", area: "Data", severity: "warn", title: `Only ${s.data.knowledge_articles} Knowledge articles`, explain: "Light grounding will hurt answer quality. Plan for content investment alongside the agent build." });
  } else {
    findings.push({ id: "d-no-knowledge", area: "Data", severity: "warn", title: "No published Knowledge articles", explain: "Without grounding, the agent will rely on the LLM's general knowledge — fine for chit-chat, risky for your domain." });
  }

  // Agents already in org
  if (s.agents.bots > 0) {
    findings.push({ id: "a-bots", area: "Agents", severity: "ok", title: `${s.agents.bots} agent definitions exist`, explain: "Existing bots/agents are great starting points — review and decide whether to extend or replace." });
  } else {
    findings.push({ id: "a-no-bots", area: "Agents", severity: "warn", title: "No agents defined yet", explain: "That's expected — your next mission will help you build one." });
  }

  // Access
  if (s.access.ai_permission_sets > 0) {
    findings.push({ id: "x-ai-perms", area: "Access", severity: "ok", title: `${s.access.ai_permission_sets} AI permission set(s)`, explain: "Looks like Einstein/Agent licensing is already provisioned on at least some users." });
  } else {
    findings.push({ id: "x-no-ai-perms", area: "Access", severity: "warn", title: "No AI/Einstein permission sets detected", explain: "You'll need to assign Einstein and Agentforce permission sets to the users who'll interact with the agent." });
  }

  // Limits
  const apiUtil = s.limits.daily_api_max > 0 ? s.limits.daily_api_used / s.limits.daily_api_max : 0;
  if (apiUtil > 0.6) {
    findings.push({ id: "l-api-high", area: "Limits", severity: "danger", title: `API utilization at ${Math.round(apiUtil * 100)}%`, explain: "Agents drive a lot of API traffic. You'll likely hit limits in production unless this is reduced or licenses are upgraded." });
  }

  // Score: opinionated weighted sum, capped 0-100
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        20 * (s.foundations.custom_objects > 0 ? 1 : 0.3) +
          20 * Math.min(1, (s.automation.flows_active ?? 0) / 10) +
          15 * Math.min(1, (s.code.invocable ?? 0) / 5) +
          15 * Math.min(1, (s.data.knowledge_articles ?? 0) / 50) +
          10 * (s.access.ai_permission_sets > 0 ? 1 : 0.2) +
          10 * (s.code.coverage_pct >= 75 ? 1 : s.code.coverage_pct / 75) +
          10 * (apiUtil < 0.6 ? 1 : 0.3),
      ),
    ),
  );

  return {
    scanned_at: new Date().toISOString(),
    is_mock: isMock,
    score,
    snapshot: s,
    findings,
  };
}
