import { sections, getMissionById } from "@/content";
import type { Mission } from "@/content/types";
import { query, queryOne } from "./db";

export type DiagnosticAnswers = {
  businessGoal?: string;
  team?: string;
  channel?: "web" | "messaging" | "internal" | "email" | "unknown";
  dataReadiness?: "knowledge-ready" | "some-docs" | "scattered" | "unknown";
  d360Status?: "ready" | "in-progress" | "not-started" | "unknown";
  permissionsStatus?: "ready" | "needs-work" | "unknown";
  automationStatus?: "many-flows" | "some-flows" | "none" | "unknown";
};

export type DiagnosticSummary = {
  source: "intake only" | "intake + org scan" | "org scan only";
  readiness: "early" | "blocked" | "ready-to-build";
  signals: string[];
};

export type DiagnosticRecord = {
  answers: DiagnosticAnswers;
  summary: DiagnosticSummary;
  blockers: string[];
  updated_at?: string;
};

export type RecommendedUseCase = {
  id: string;
  title: string;
  fit: string;
  effort: "Low" | "Medium" | "High";
  prerequisites: string[];
  blockers: string[];
  impact: string;
  basedOn: "intake only" | "intake + org scan" | "org scan only";
  missionIds: string[];
};

export type SelectedUseCase = {
  useCase: RecommendedUseCase;
  stage: "agents_created" | "activated";
  selected_at?: string;
  updated_at?: string;
};

export type ActivationPlanItem = {
  mission: Mission;
  sectionSlug: string;
  sectionTitle: string;
  href: string;
  reason: string;
  blockedBy: string[];
  dependencies: string[];
};

type LatestScan = {
  scanned_at: string;
  score: number | null;
  snapshot_json: Record<string, unknown>;
};

const ACTIVATION_MISSION_IDS = [
  "pre-agent-setup.defining-use-cases",
  "pre-agent-setup.knowledge",
  "salesforce-setup.licenses",
  "salesforce-setup.permission-sets",
  "salesforce-setup.turn-on-agentforce",
  "data-foundations.knowledge",
  "data-foundations.data-cloud",
  "build-your-agent.pick-agent-type",
  "build-your-agent.topics",
  "build-your-agent.actions-inventory",
  "build-your-agent.prompt-templates",
  "build-your-agent.testing",
  "channels-and-launch.channels-picker",
  "channels-and-launch.trust-and-governance",
  "channels-and-launch.go-live",
];

function readPath(obj: Record<string, unknown> | null | undefined, path: string): unknown {
  let cur: unknown = obj;
  for (const part of path.split(".")) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

async function latestScan(userId: string): Promise<LatestScan | null> {
  return await queryOne<LatestScan>(
    `SELECT scanned_at, score, snapshot_json
     FROM org_assessments WHERE user_id = $1 ORDER BY scanned_at DESC LIMIT 1`,
    [userId],
  );
}

function normalizeAnswers(input: unknown): DiagnosticAnswers {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  return {
    businessGoal: typeof raw.businessGoal === "string" ? raw.businessGoal.slice(0, 400) : "",
    team: typeof raw.team === "string" ? raw.team.slice(0, 120) : "",
    channel: typeof raw.channel === "string" ? raw.channel as DiagnosticAnswers["channel"] : "unknown",
    dataReadiness: typeof raw.dataReadiness === "string" ? raw.dataReadiness as DiagnosticAnswers["dataReadiness"] : "unknown",
    d360Status: typeof raw.d360Status === "string" ? raw.d360Status as DiagnosticAnswers["d360Status"] : "unknown",
    permissionsStatus: typeof raw.permissionsStatus === "string" ? raw.permissionsStatus as DiagnosticAnswers["permissionsStatus"] : "unknown",
    automationStatus: typeof raw.automationStatus === "string" ? raw.automationStatus as DiagnosticAnswers["automationStatus"] : "unknown",
  };
}

function summarize(answers: DiagnosticAnswers, scan: LatestScan | null): DiagnosticRecord {
  const signals: string[] = [];
  const blockers: string[] = [];
  const source = scan ? "intake + org scan" : "intake only";

  const knowledgeCount = Number(readPath(scan?.snapshot_json, "data.knowledge_articles") ?? 0);
  const dmos = Number(readPath(scan?.snapshot_json, "data.data_cloud_dmos") ?? 0);
  const aiPerms = Number(readPath(scan?.snapshot_json, "access.ai_permission_sets") ?? 0);
  const activeBots = Number(readPath(scan?.snapshot_json, "agentforceSetup.bot_versions_active") ?? readPath(scan?.snapshot_json, "agents.bots") ?? 0);
  const flows = Number(readPath(scan?.snapshot_json, "automation.flows_active") ?? 0);

  if (scan) signals.push(`Latest org scan score: ${scan.score ?? "unknown"}.`);
  if (knowledgeCount > 0 || answers.dataReadiness === "knowledge-ready") signals.push("Knowledge appears usable for a grounded first agent.");
  if (dmos > 0 || answers.d360Status === "ready") signals.push("Data Cloud/D360 appears started.");
  if (aiPerms > 0 || answers.permissionsStatus === "ready") signals.push("Agentforce-related permission work appears started.");
  if (flows > 0 || answers.automationStatus === "many-flows" || answers.automationStatus === "some-flows") signals.push("Existing automation can be reused for actions.");
  if (activeBots > 0) signals.push("At least one active agent/bot version was detected.");

  if (answers.d360Status === "not-started" || (scan && dmos === 0)) blockers.push("D360/Data Cloud may need to be started early because setup can take 24+ hours.");
  if (answers.dataReadiness === "scattered" || (scan && knowledgeCount === 0)) blockers.push("Knowledge grounding is not ready enough for a trustworthy first agent.");
  if (answers.permissionsStatus === "needs-work" || (scan && aiPerms === 0)) blockers.push("Permission sets and user access need to be configured before activation.");
  if (answers.channel && answers.channel !== "unknown") signals.push(`Preferred first channel: ${answers.channel}.`);

  const readiness = blockers.length >= 2 ? "blocked" : blockers.length === 1 ? "early" : "ready-to-build";
  return { answers, blockers, summary: { source, readiness, signals } };
}

function recommendFromDiagnostic(record: DiagnosticRecord): RecommendedUseCase[] {
  const { answers, blockers, summary } = record;
  const serviceGoal = `${answers.businessGoal ?? ""} ${answers.team ?? ""}`.toLowerCase();
  const wantsInternal = answers.channel === "internal" || serviceGoal.includes("employee") || serviceGoal.includes("internal");
  const wantsSales = serviceGoal.includes("sales") || serviceGoal.includes("lead") || serviceGoal.includes("opportunit");
  const knowledgeReady = answers.dataReadiness === "knowledge-ready" || !blockers.some((b) => b.includes("Knowledge"));
  const d360Blocker = blockers.find((b) => b.includes("D360"));
  const permissionBlocker = blockers.find((b) => b.includes("Permission"));

  const first: RecommendedUseCase = wantsSales
    ? {
        id: "first-agent-sales-coach",
        title: "Sales follow-up coach",
        fit: "This is achievable when the first value story is rep productivity and account follow-up rather than complex service automation.",
        effort: d360Blocker ? "High" : "Medium",
        prerequisites: ["Sales data access", "Agentforce builder access", "Prompt template grounding", "Pilot user permission sets"],
        blockers: [d360Blocker, permissionBlocker].filter(Boolean) as string[],
        impact: "Helps prove value with faster follow-up drafts, account summaries, and consistent seller coaching.",
        basedOn: summary.source,
        missionIds: [
          "pre-agent-setup.defining-use-cases",
          "salesforce-setup.permission-sets",
          "build-your-agent.prompt-templates",
          "build-your-agent.testing",
          "channels-and-launch.go-live",
        ],
      }
    : wantsInternal
      ? {
          id: "first-agent-internal-knowledge",
          title: "Internal policy and process assistant",
          fit: "This keeps the first launch contained to employees while you learn Agentforce setup and trust patterns.",
          effort: knowledgeReady ? "Medium" : "High",
          prerequisites: ["Curated internal knowledge", "Employee access model", "Prompt quality checks", "Feedback loop"],
          blockers: blockers.filter((b) => b.includes("Knowledge") || b.includes("Permission")),
          impact: "Deflects repeated internal questions and creates a lower-risk first proof point before customer-facing launch.",
          basedOn: summary.source,
          missionIds: [
            "pre-agent-setup.knowledge",
            "data-foundations.knowledge",
            "salesforce-setup.permission-sets",
            "build-your-agent.topics",
            "build-your-agent.testing",
          ],
        }
      : {
          id: "first-agent-service-deflection",
          title: "Customer service FAQ deflection agent",
          fit: "This is the clearest first Agentforce wedge when customers need a business-critical but bounded support use case.",
          effort: knowledgeReady && !d360Blocker ? "Medium" : "High",
          prerequisites: ["Approved support knowledge", "Escalation path", "Service user permissions", "Pilot channel"],
          blockers: blockers.filter((b) => b.includes("Knowledge") || b.includes("D360") || b.includes("Permission")),
          impact: "Reduces repetitive service questions while producing measurable deflection and quality metrics.",
          basedOn: summary.source,
          missionIds: [
            "pre-agent-setup.defining-use-cases",
            "pre-agent-setup.knowledge",
            "data-foundations.knowledge",
            "salesforce-setup.permission-sets",
            "build-your-agent.testing",
            "channels-and-launch.channels-picker",
          ],
        };

  const options: RecommendedUseCase[] = [
    first,
    {
      id: "first-agent-case-triage",
      title: "Case triage and escalation assistant",
      fit: "Good when support teams already have cases, queues, and flows that an agent can reason over or hand off to.",
      effort: answers.automationStatus === "many-flows" || answers.automationStatus === "some-flows" ? "Medium" : "High",
      prerequisites: ["Case fields and queues", "Escalation rules", "Reusable flow or action inventory", "Permission sets"],
      blockers: [permissionBlocker].filter(Boolean) as string[],
      impact: "Improves routing consistency and gives leaders a concrete activation story beyond generic Q&A.",
      basedOn: summary.source,
      missionIds: [
        "pre-agent-setup.defining-use-cases",
        "build-your-agent.actions-inventory",
        "build-your-agent.topics",
        "build-your-agent.testing",
        "channels-and-launch.trust-and-governance",
      ],
    },
    {
      id: "first-agent-knowledge-gap-finder",
      title: "Knowledge readiness gap finder",
      fit: "Best first step when Knowledge or D360 is the blocker and the customer needs a path before building the final agent.",
      effort: "Low",
      prerequisites: ["Known support topics", "Source document owners", "Knowledge audit", "Activation plan owner"],
      blockers: [],
      impact: "Turns a stuck implementation into an ordered cleanup plan and front-loads the 24-hour D360 dependency.",
      basedOn: summary.source,
      missionIds: [
        "pre-agent-setup.knowledge",
        "data-foundations.knowledge",
        "data-foundations.data-cloud",
        "salesforce-setup.turn-on-agentforce",
        "salesforce-setup.permission-sets",
      ],
    },
  ];

  return options.slice(0, 3);
}

export async function getDiagnostic(userId: string): Promise<DiagnosticRecord | null> {
  const row = await queryOne<{ answers_json: DiagnosticAnswers; summary_json: DiagnosticSummary; blockers_json: string[]; updated_at: string }>(
    `SELECT answers_json, summary_json, blockers_json, updated_at
     FROM org_diagnostics WHERE user_id = $1`,
    [userId],
  );
  if (!row) return null;
  return {
    answers: row.answers_json ?? {},
    summary: row.summary_json,
    blockers: row.blockers_json ?? [],
    updated_at: row.updated_at,
  };
}

export async function saveDiagnostic(userId: string, input: unknown): Promise<DiagnosticRecord> {
  const answers = normalizeAnswers(input);
  const scan = await latestScan(userId);
  const record = summarize(answers, scan);
  await query(
    `INSERT INTO org_diagnostics (user_id, answers_json, summary_json, blockers_json, updated_at)
     VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       answers_json = EXCLUDED.answers_json,
       summary_json = EXCLUDED.summary_json,
       blockers_json = EXCLUDED.blockers_json,
       updated_at = NOW()`,
    [userId, JSON.stringify(record.answers), JSON.stringify(record.summary), JSON.stringify(record.blockers)],
  );
  return record;
}

export async function ensureRecommendations(userId: string): Promise<RecommendedUseCase[]> {
  let diagnostic = await getDiagnostic(userId);
  if (!diagnostic) {
    const scan = await latestScan(userId);
    diagnostic = summarize({}, scan);
  }
  const items = recommendFromDiagnostic(diagnostic);
  await query(
    `INSERT INTO recommended_use_cases (user_id, items_json, generated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (user_id) DO UPDATE SET items_json = EXCLUDED.items_json, generated_at = NOW()`,
    [userId, JSON.stringify(items)],
  );
  return items;
}

export async function getRecommendations(userId: string): Promise<RecommendedUseCase[]> {
  const row = await queryOne<{ items_json: RecommendedUseCase[] }>(
    `SELECT items_json FROM recommended_use_cases WHERE user_id = $1`,
    [userId],
  );
  return row?.items_json ?? [];
}

export async function selectUseCase(userId: string, useCaseId: string): Promise<SelectedUseCase> {
  const current = await getRecommendations(userId);
  const recommendations = current.length > 0 ? current : await ensureRecommendations(userId);
  const useCase = recommendations.find((u) => u.id === useCaseId) ?? recommendations[0];
  if (!useCase) throw new Error("No use case recommendations available");
  await query(
    `INSERT INTO selected_use_cases (user_id, use_case_json, stage, selected_at, updated_at)
     VALUES ($1, $2::jsonb, 'agents_created', NOW(), NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       use_case_json = EXCLUDED.use_case_json,
       stage = 'agents_created',
       updated_at = NOW()`,
    [userId, JSON.stringify(useCase)],
  );
  return { useCase, stage: "agents_created" };
}

export async function getSelectedUseCase(userId: string): Promise<SelectedUseCase | null> {
  const row = await queryOne<{ use_case_json: RecommendedUseCase; stage: "agents_created" | "activated"; selected_at: string; updated_at: string }>(
    `SELECT use_case_json, stage, selected_at, updated_at FROM selected_use_cases WHERE user_id = $1`,
    [userId],
  );
  if (!row) return null;
  return { useCase: row.use_case_json, stage: row.stage, selected_at: row.selected_at, updated_at: row.updated_at };
}

export function buildActivationPlan(selected: SelectedUseCase | null, diagnostic: DiagnosticRecord | null): ActivationPlanItem[] {
  const selectedIds = selected?.useCase.missionIds ?? [];
  const ids = [...new Set([...selectedIds, ...ACTIVATION_MISSION_IDS])];
  const blockerText = diagnostic?.blockers ?? [];
  const out: ActivationPlanItem[] = [];

  for (const id of ids) {
    const mission = getMissionById(id);
    if (!mission) continue;
    const section = sections.find((s) => s.missions.some((m) => m.id === id));
    if (!section) continue;
    const blockedBy: string[] = [];
    if (id.includes("data-cloud") && blockerText.some((b) => b.includes("D360"))) blockedBy.push("Start D360/Data Cloud early; setup may take 24+ hours.");
    if (id.includes("knowledge") && blockerText.some((b) => b.includes("Knowledge"))) blockedBy.push("Knowledge sources need curation before activation.");
    if (id.includes("permission") && blockerText.some((b) => b.includes("Permission"))) blockedBy.push("Permission sets are not ready for pilot users.");
    out.push({
      mission,
      sectionSlug: section.slug,
      sectionTitle: section.title,
      href: `/missions/${section.slug}/${mission.slug}`,
      reason: selectedIds.includes(id)
        ? "Directly required for the selected first agent."
        : "Recommended dependency for a clean first activation.",
      blockedBy,
      dependencies: mission.dependencies ?? [],
    });
  }
  return out.slice(0, 10);
}
