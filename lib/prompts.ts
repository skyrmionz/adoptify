// Single source of truth for the prompts handed to a user's coding agent.
// Each builder returns the exact markdown the agent runs verbatim.
//
// The agent runs locally on the user's machine using `sf` CLI auth, queries
// Salesforce, then POSTs JSON back to Adoptify. Adoptify validates and stores.
//
// Every prompt embeds the user's API token so the agent doesn't need any
// further setup. Tokens are rotatable from Settings.

export type PromptContext = {
  apiToken: string;
  appUrl: string;
};

const HEADER = (kind: string) =>
  `You are syncing my Salesforce org with **Adoptify** — a ${kind} sync.

**Before you start, verify I have an org connected:**
\`\`\`bash
sf org display --json
\`\`\`
If no org is connected, run \`sf org login web\` and let me approve in the browser. Use the alias I provide if you ask, otherwise default to my default org.`;

const FOOTER = (
  ctx: PromptContext,
  endpoint: string,
  bodySchema: string,
) => `

---

## Step 3 — POST the assembled JSON to Adoptify

\`\`\`http
POST ${ctx.appUrl}${endpoint}
Authorization: Bearer ${ctx.apiToken}
Content-Type: application/json
\`\`\`

Body shape:

\`\`\`json
${bodySchema}
\`\`\`

If the POST returns 200, reply **"Synced to Adoptify."** and stop. If it returns 401, the token has been rotated — tell me to grab a fresh prompt from Adoptify Settings.`;

// --- Scan prompt -------------------------------------------------

const SCAN_QUERIES = `## Step 2 — Run these queries

Run each via \`sf data query --json\` (REST) or \`sf data query --use-tooling-api --json\` (Tooling). Aggregate the row counts and a few key field samples. **Do not fail the run if a query is blocked by org permissions** — record \`status: "blocked"\` for that probe and continue.

### Foundations (REST)
- \`SELECT Id, Name FROM Account LIMIT 1\` (just to grab the instance)
- For each standard object [Account, Contact, Case, Opportunity, Lead]: \`SELECT COUNT() FROM <obj>\`
- Tooling: \`SELECT COUNT() FROM CustomObject WHERE NamespacePrefix = NULL\` → custom_objects
- Tooling: \`SELECT COUNT() FROM CustomField WHERE NamespacePrefix = NULL\` → total_fields

### Automation (Tooling)
- \`SELECT COUNT() FROM Flow WHERE Status = 'Active'\` → flows_active
- \`SELECT COUNT() FROM Flow WHERE Status = 'Obsolete' OR Status = 'Draft'\` → flows_inactive
- \`SELECT MasterLabel, ProcessType FROM Flow WHERE Status = 'Active' LIMIT 50\` → group counts by ProcessType into types map; first 8 names → integrations.sample.flows

### Code (Tooling)
- \`SELECT COUNT() FROM ApexClass WHERE NamespacePrefix = NULL\` → classes
- \`SELECT SUM(LengthWithoutComments) c FROM ApexClass WHERE NamespacePrefix = NULL\` → loc
- \`SELECT Name, Body FROM ApexClass WHERE NamespacePrefix = NULL LIMIT 200\` — count classes whose Body contains "@InvocableMethod" → invocable; first 8 such names → integrations.sample.apex; count classes whose Body contains "HttpCallout" or "@HttpGet" → integrations.http_callout_apex
- Coverage: \`SELECT NumLinesCovered, NumLinesUncovered FROM ApexCodeCoverageAggregate\` → coverage_pct = covered / (covered + uncovered) * 100, rounded

### Knowledge / Data Cloud (REST + Tooling, may be blocked)
- REST: \`SELECT COUNT() FROM Knowledge__kav WHERE PublishStatus = 'Online'\` → data.knowledge_articles (probe blocked = 0)
- Tooling: \`SELECT COUNT() FROM MktDataModelObject\` → data.data_cloud_dmos (probe blocked = 0)

### Agents (Tooling)
- \`SELECT COUNT() FROM BotDefinition\` → agents.bots
- \`SELECT COUNT() FROM GenAiPlannerBundle\` → agentforceSetup.genai_planner_bundles (blocked = 0)
- \`SELECT COUNT() FROM GenAiPlugin\` → agentforceSetup.genai_plugins (blocked = 0)
- \`SELECT Type FROM GenAiPromptTemplate\` → group by Type → agentforceSetup.prompt_templates_by_type; total → agents.prompt_templates

### Access (Tooling)
- \`SELECT COUNT() FROM PermissionSet WHERE IsCustom = TRUE\` → access.permission_sets
- \`SELECT COUNT() FROM Profile\` → access.profiles
- Filter permission sets whose Name or Label contains "AI", "Agentforce", "Einstein" → access.ai_permission_sets

### Limits (REST)
- \`/services/data/v62.0/limits\` → limits.daily_api_used = DailyApiRequests.Max - DailyApiRequests.Remaining; limits.daily_api_max = DailyApiRequests.Max

### Channels & Integrations (Tooling, best-effort)
- \`SELECT COUNT() FROM EmbeddedServiceDeployment\` → channels.embedded_service_deployments
- \`SELECT COUNT() FROM ConnectedApplication\` → channels.connected_apps_total
- \`SELECT COUNT() FROM NamedCredential\` → integrations.named_credentials
- \`SELECT DeveloperName FROM ExternalServiceRegistration\` → integrations.external_services count + sample.externalServices

If any query returns an error like INVALID_TYPE, missing object, or insufficient access — record that probe as \`{ status: "blocked", detail: "<error>" }\` in scanMeta.probes. Don't abort the whole run.`;

const SCAN_BODY_SCHEMA = `{
  "instanceUrl": "https://your-org.my.salesforce.com",
  "orgId": "00DXXXXXXXXXXXXXX",
  "orgName": "MyOrg (Production)",
  "isSandbox": false,
  "result": {
    "scanned_at": "ISO 8601 timestamp",
    "is_mock": false,
    "score": 0,                   // leave 0; Adoptify recomputes
    "byChapter": [],              // leave [] if you don't want to compute
    "snapshot": {
      "foundations":  { "custom_objects": 0, "total_fields": 0, "relationships": 0, "record_counts": { "Account": 0 } },
      "automation":   { "flows_active": 0, "flows_inactive": 0, "types": {}, "avg_complexity": 0 },
      "code":         { "classes": 0, "loc": 0, "coverage_pct": 0, "invocable": 0, "aura_enabled": 0 },
      "data":         { "knowledge_articles": 0, "data_cloud_dmos": 0 },
      "agents":       { "bots": 0, "topics": 0, "actions": 0, "prompt_templates": 0 },
      "access":       { "permission_sets": 0, "ai_permission_sets": 0, "profiles": 0 },
      "limits":       { "daily_api_used": 0, "daily_api_max": 0 },
      "agentforceSetup": { "bot_versions_active": 0, "genai_planner_bundles": 0, "genai_plugins": 0, "prompt_templates_by_type": {} },
      "channels":        { "embedded_service_deployments": 0, "messaging_channels_total": 0, "messaging_by_type": {}, "experience_cloud_sites": 0, "voice_call_centers": 0, "connected_apps_total": 0, "agentforce_api_apps": 0, "conversations_30d": 0 },
      "integrations":    { "named_credentials": 0, "named_credential_auth_types": {}, "external_services": 0, "http_callout_apex": 0, "sample": { "apex": [], "flows": [], "namedCredentials": [], "externalServices": [] } },
      "dataDepth":       { "knowledge_data_categories": 0, "data_streams": 0, "data_lake_objects": 0, "identity_resolution_rulesets": 0 },
      "consumption":     { "api_used_pct": 0 },
      "runtime":         { "sessions_30d": 0, "sessions_7d": 0, "sessions_24h": 0, "daily_by_channel": [], "by_channel_30d": {}, "by_agent_30d": [], "by_status_30d": { "resolved": 0, "escalated": 0, "active": 0, "abandoned": 0 }, "avg_messages_per_session_30d": 0, "avg_handle_time_seconds_30d": 0, "feedback_30d": { "positive": 0, "negative": 0, "neutral": 0 }, "hour_dow_heatmap": [], "actions_30d": [] },
      "provisioning":    { "package_licenses": [], "bot_definitions": [], "custom_permission_sets": [], "object_count": 0, "data_cloud_owned_entity_found": false },
      "scanMeta":        { "confidence": "high", "probes": [{ "area": "Foundations", "label": "Custom objects", "status": "exact", "detail": "..." }] }
    },
    "findings": [
      { "id": "no-bots", "area": "Agents", "severity": "warn", "title": "No Agentforce bots found", "explain": "..." }
    ]
  }
}`;

export function buildScanPrompt(ctx: PromptContext): string {
  return `${HEADER("full org metadata")}

${SCAN_QUERIES}
${FOOTER(ctx, "/api/ingest/scan", SCAN_BODY_SCHEMA)}`;
}

export function buildConnectPrompt(ctx: PromptContext): string {
  return `${HEADER("first-time connection — runs the same scan as 'Re-scan' inside Adoptify")}

${SCAN_QUERIES}
${FOOTER(ctx, "/api/ingest/scan", SCAN_BODY_SCHEMA)}`;
}

// --- Verify rule prompt ------------------------------------------

const VERIFY_BODY_SCHEMA = `{
  "ruleId": "<the id you were given>",
  "missionId": "<the missionId you were given>",
  "stepId": "<the stepId you were given, optional>",
  "result": {
    "ok": true,
    "count": 0,
    "sample": "optional sample record name"
  }
}`;

export type VerifyPromptArgs = {
  ruleId: string;
  missionId: string;
  stepId?: string;
  ruleLabel: string;
  rule: unknown; // VerifyRule from content/types
};

export function buildVerifyPrompt(ctx: PromptContext, args: VerifyPromptArgs): string {
  const ruleJson = JSON.stringify(args.rule, null, 2);
  return `${HEADER("setup checklist verification")}

## Step 2 — Run this verification

I want to confirm: **${args.ruleLabel}**

The rule is:

\`\`\`json
${ruleJson}
\`\`\`

Interpret the rule:
- \`tooling.soql\` / \`rest.soql\` — run \`sf data query --json\` (with \`--use-tooling-api\` for tooling). Set \`result.ok = true\` if the count meets the \`expect\` (either \`"exists"\` → count > 0, or \`{ "minCount": N }\` → count >= N). Include count + first record's Name/Label/DeveloperName as \`sample\`.
- \`rest.path\` — fetch the path via \`sf api request rest --method GET --url <path>\`, drill into \`jsonPath\`, compare to \`expect\`/\`value\`.
- \`scanner.path\` — skip; this resolves against the most recent ingested scan inside Adoptify.
- \`manual\` — skip; user must mark manually.
${FOOTER(ctx, "/api/ingest/verify", VERIFY_BODY_SCHEMA)}`;
}

// --- Knowledge check prompt --------------------------------------

const KNOWLEDGE_BODY_SCHEMA = `{
  "kind": "salesforce-knowledge" | "data-cloud",
  "result": {
    "ok": true,
    "count": 0,
    "sample": "first record title"
  }
}`;

export function buildKnowledgeCheckPrompt(
  ctx: PromptContext,
  args: { kind: "salesforce-knowledge" | "data-cloud" },
): string {
  const query = args.kind === "salesforce-knowledge"
    ? `SELECT Title FROM Knowledge__kav WHERE PublishStatus = 'Online' LIMIT 1`
    : `SELECT Id FROM MktDataModelObject`;
  const api = args.kind === "salesforce-knowledge" ? "REST" : "Tooling";
  return `${HEADER("knowledge source check")}

## Step 2 — Run this query (${api})

\`\`\`bash
sf data query ${api === "Tooling" ? "--use-tooling-api " : ""}--query "${query}" --json
\`\`\`

Set \`result.ok = true\` if the query returned at least 1 row. \`count\` = totalSize. \`sample\` = first row Title (for Knowledge) or DMO id (for Data Cloud).
${FOOTER(ctx, "/api/ingest/knowledge-check", KNOWLEDGE_BODY_SCHEMA)}`;
}
