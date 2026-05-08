import type { ToolDef } from "./openrouter";
import { sections, getMissionById } from "@/content";
import { getAllProgress, upsertProgress } from "./progress";
import { query, queryOne } from "./db";
import { API_VERSION, getLatestConnection, sfJson } from "./salesforce";
import { runScan } from "./metadata-scanner";

export const agentTools: ToolDef[] = [
  // --- Read: Adoptify state ---
  {
    type: "function",
    function: {
      name: "list_missions",
      description: "List every Adoptify chapter and mission with the user's current status (not_started / in_progress / completed). Use this to ground 'what should I do next?' answers.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "read_mission_content",
      description: "Read the structured content of a specific mission (steps, framework cards, setup checks, embedded videos). Useful when the user asks 'what does mission X cover?' or you need to cite specific guidance.",
      parameters: {
        type: "object",
        properties: { missionId: { type: "string", description: "The mission id, e.g. 'salesforce-setup.permission-sets'." } },
        required: ["missionId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_mission_evidence",
      description: "Read the user's saved evidence (form data, captured items, scan results) for a specific mission.",
      parameters: {
        type: "object",
        properties: { missionId: { type: "string" } },
        required: ["missionId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_use_cases",
      description: "Shortcut: returns the use cases the user captured in the Defining Use Cases mission.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "read_knowledge_sources",
      description: "Shortcut: returns the knowledge sources the user registered in the Knowledge mission.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "read_org_snapshot",
      description: "Read the user's most recent Salesforce org assessment (snapshot, findings, score, byChapter readiness). Returns null if no scan has been run.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "read_setup_checks",
      description: "Read every SetupChecklist item the user has run, across all missions, with pass/fail/manual status.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "read_channel_plan",
      description: "Read the channels the user picked in Channels & Launch with per-channel prerequisite acks.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "read_action_inventory",
      description: "Read the user's selected agent-action candidates from Build Your Agent.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "read_prompt_drafts",
      description: "Read the user's drafted prompt templates from the Prompt Templates mission.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },

  // --- Read: Salesforce org ---
  {
    type: "function",
    function: {
      name: "sf_query",
      description: "Run a read-only SOQL query against the user's connected Salesforce org. Specify api='tooling' for setup/metadata objects (BotDefinition, Flow, ApexClass, etc.) or api='rest' for data objects (Account, Knowledge__kav, MessagingSession). Read-only: no DML, no Apex, no deploys. Returns at most 200 rows.",
      parameters: {
        type: "object",
        properties: {
          soql: { type: "string", description: "The SOQL query. SELECT only. Must include LIMIT or you'll be capped at 200." },
          api: { type: "string", enum: ["tooling", "rest"], description: "Which API to hit." },
        },
        required: ["soql", "api"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "sf_describe",
      description: "Describe a Salesforce object's fields. Useful for figuring out what fields exist before composing a sf_query.",
      parameters: {
        type: "object",
        properties: { objectName: { type: "string", description: "API name, e.g. 'Account', 'Knowledge__kav', 'BotDefinition'." } },
        required: ["objectName"],
        additionalProperties: false,
      },
    },
  },

  // --- Write: Adoptify state ---
  {
    type: "function",
    function: {
      name: "mark_mission_complete",
      description: "Mark a single mission as completed for the user. Use only when the user asks you to, or when their evidence clearly satisfies the mission. Always confirm in your reply.",
      parameters: {
        type: "object",
        properties: { missionId: { type: "string" } },
        required: ["missionId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mark_mission_incomplete",
      description: "Re-open a mission (set status back to in_progress).",
      parameters: {
        type: "object",
        properties: { missionId: { type: "string" } },
        required: ["missionId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mark_chapter_complete",
      description: "Mark every mission in a chapter as completed. Use when the user explicitly says they've already done the work outside Adoptify.",
      parameters: {
        type: "object",
        properties: { sectionSlug: { type: "string", description: "e.g. 'pre-agent-setup', 'salesforce-setup', 'data-foundations', 'build-your-agent', 'channels-and-launch'." } },
        required: ["sectionSlug"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_org_scan",
      description: "Trigger a fresh Salesforce metadata scan and store the new snapshot. The user will see updated readiness on Analytics + Progress.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "navigate",
      description: "Surface a clickable navigation chip in the chat so the user can jump to a page in Adoptify (mission, chapter, analytics, settings) or an external Salesforce URL. Use this whenever a recommendation has a clear destination.",
      parameters: {
        type: "object",
        properties: {
          label: { type: "string", description: "Short label shown on the chip, e.g. 'Open Permission Sets mission'." },
          url: { type: "string", description: "Absolute or app-relative URL." },
          rationale: { type: "string", description: "1-sentence reason this is the next step." },
        },
        required: ["label", "url"],
        additionalProperties: false,
      },
    },
  },
];

type ToolHandlerArgs = {
  userId: string;
};

const APP_LINKS = {
  missions: "/missions",
  agent: "/agent",
  progress: "/progress",
  analytics: "/analytics",
  settings: "/settings",
} as const;

function isReadOnlySoql(soql: string): { ok: boolean; reason?: string } {
  const trimmed = soql.trim();
  const upper = trimmed.toUpperCase();
  if (!upper.startsWith("SELECT")) return { ok: false, reason: "Only SELECT queries are allowed." };
  for (const banned of ["INSERT ", "UPDATE ", "DELETE ", "UPSERT ", "MERGE "]) {
    if (upper.includes(banned)) return { ok: false, reason: `'${banned.trim()}' is not allowed.` };
  }
  return { ok: true };
}

export async function executeTool(name: string, rawArgs: unknown, ctx: ToolHandlerArgs): Promise<unknown> {
  const args = (rawArgs && typeof rawArgs === "object" ? rawArgs : {}) as Record<string, unknown>;
  switch (name) {
    case "list_missions": {
      const progress = await getAllProgress(ctx.userId);
      const byId = new Map(progress.map((p) => [p.mission_id, p]));
      return sections.map((s) => ({
        slug: s.slug,
        section: s.title,
        missions: s.missions.map((m) => ({
          id: m.id,
          title: m.title,
          summary: m.summary,
          status: byId.get(m.id)?.status ?? "not_started",
          completed_at: byId.get(m.id)?.completed_at ?? null,
          url: `${APP_LINKS.missions}/${s.slug}/${m.slug}`,
        })),
      }));
    }
    case "read_mission_content": {
      const id = String(args.missionId ?? "");
      const mission = getMissionById(id);
      if (!mission) return { error: `unknown missionId: ${id}` };
      return {
        id: mission.id,
        title: mission.title,
        summary: mission.summary,
        verify: mission.verify,
        steps: mission.steps.map((s) => ({ kind: s.kind, title: (s as { title?: string }).title })),
      };
    }
    case "read_mission_evidence": {
      const id = String(args.missionId ?? "");
      const row = await queryOne<{ status: string; evidence_json: unknown; completed_at: string | null }>(
        `SELECT status, evidence_json, completed_at FROM mission_progress WHERE user_id = $1 AND mission_id = $2`,
        [ctx.userId, id],
      );
      return row ?? { status: "not_started", evidence_json: {}, completed_at: null };
    }
    case "read_use_cases": {
      const row = await queryOne<{ evidence_json: { useCases?: unknown[] } }>(
        `SELECT evidence_json FROM mission_progress WHERE user_id = $1 AND mission_id = 'pre-agent-setup.defining-use-cases'`,
        [ctx.userId],
      );
      return row?.evidence_json?.useCases ?? [];
    }
    case "read_knowledge_sources": {
      const row = await queryOne<{ evidence_json: { knowledgeSources?: unknown[] } }>(
        `SELECT evidence_json FROM mission_progress WHERE user_id = $1 AND mission_id = 'pre-agent-setup.knowledge'`,
        [ctx.userId],
      );
      return row?.evidence_json?.knowledgeSources ?? [];
    }
    case "read_org_snapshot": {
      const row = await queryOne<{ scanned_at: string; snapshot_json: unknown; findings_json: unknown; score: number }>(
        `SELECT scanned_at, snapshot_json, findings_json, score
         FROM org_assessments WHERE user_id = $1 ORDER BY scanned_at DESC LIMIT 1`,
        [ctx.userId],
      );
      return row ?? null;
    }
    case "read_setup_checks": {
      const rows = await query<{ mission_id: string; evidence_json: { setupChecks?: Record<string, unknown> } }>(
        `SELECT mission_id, evidence_json FROM mission_progress
         WHERE user_id = $1 AND evidence_json ? 'setupChecks'`,
        [ctx.userId],
      );
      return rows.map((r) => ({ mission_id: r.mission_id, checks: r.evidence_json?.setupChecks ?? {} }));
    }
    case "read_channel_plan": {
      const row = await queryOne<{ evidence_json: { channels?: unknown } }>(
        `SELECT evidence_json FROM mission_progress
         WHERE user_id = $1 AND mission_id = 'channels-and-launch.channels-picker'`,
        [ctx.userId],
      );
      return row?.evidence_json?.channels ?? [];
    }
    case "read_action_inventory": {
      const row = await queryOne<{ evidence_json: { actionInventory?: unknown } }>(
        `SELECT evidence_json FROM mission_progress
         WHERE user_id = $1 AND mission_id = 'build-your-agent.actions-inventory'`,
        [ctx.userId],
      );
      return row?.evidence_json?.actionInventory ?? null;
    }
    case "read_prompt_drafts": {
      const row = await queryOne<{ evidence_json: { promptTemplates?: unknown } }>(
        `SELECT evidence_json FROM mission_progress
         WHERE user_id = $1 AND mission_id = 'build-your-agent.prompt-templates'`,
        [ctx.userId],
      );
      return row?.evidence_json?.promptTemplates ?? [];
    }

    case "sf_query": {
      const soql = String(args.soql ?? "");
      const api = String(args.api ?? "rest");
      const guard = isReadOnlySoql(soql);
      if (!guard.ok) return { error: guard.reason };
      const conn = await getLatestConnection(ctx.userId);
      if (!conn) return { error: "No Salesforce org connected. Direct the user to /settings to connect one." };
      try {
        const path = api === "tooling"
          ? `/services/data/${API_VERSION}/tooling/query?q=${encodeURIComponent(soql)}`
          : `/services/data/${API_VERSION}/query?q=${encodeURIComponent(soql)}`;
        const r = await sfJson<{ totalSize: number; done: boolean; records: Array<Record<string, unknown>> }>(conn, path);
        const records = (r.records ?? []).slice(0, 200);
        return { totalSize: r.totalSize, recordsReturned: records.length, records };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "query_failed" };
      }
    }
    case "sf_describe": {
      const obj = String(args.objectName ?? "");
      const conn = await getLatestConnection(ctx.userId);
      if (!conn) return { error: "No Salesforce org connected." };
      try {
        const r = await sfJson<{ name: string; label: string; fields: Array<{ name: string; label: string; type: string; custom: boolean; nillable: boolean; referenceTo?: string[] }> }>(
          conn,
          `/services/data/${API_VERSION}/sobjects/${encodeURIComponent(obj)}/describe`,
        );
        return {
          name: r.name,
          label: r.label,
          fields: r.fields.map((f) => ({ name: f.name, label: f.label, type: f.type, custom: f.custom, nillable: f.nillable, referenceTo: f.referenceTo })),
        };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "describe_failed" };
      }
    }

    case "mark_mission_complete": {
      const id = String(args.missionId ?? "");
      if (!getMissionById(id)) return { error: `unknown missionId: ${id}` };
      const row = await upsertProgress(ctx.userId, id, {
        completed: true,
        evidence: { marked_done_via_agent_at: new Date().toISOString() },
      });
      return { ok: true, missionId: id, status: row.status };
    }
    case "mark_mission_incomplete": {
      const id = String(args.missionId ?? "");
      if (!getMissionById(id)) return { error: `unknown missionId: ${id}` };
      const row = await upsertProgress(ctx.userId, id, {
        completed: false,
        evidence: { reopened_via_agent_at: new Date().toISOString() },
      });
      return { ok: true, missionId: id, status: row.status };
    }
    case "mark_chapter_complete": {
      const slug = String(args.sectionSlug ?? "");
      const section = sections.find((s) => s.slug === slug);
      if (!section) return { error: `unknown sectionSlug: ${slug}` };
      const updated: string[] = [];
      for (const m of section.missions) {
        await upsertProgress(ctx.userId, m.id, {
          completed: true,
          evidence: { marked_done_via_agent_at: new Date().toISOString() },
        });
        updated.push(m.id);
      }
      return { ok: true, sectionSlug: slug, missionsMarked: updated.length };
    }
    case "run_org_scan": {
      const conn = await getLatestConnection(ctx.userId);
      if (!conn) return { error: "No Salesforce org connected. Direct the user to /settings to connect one before scanning." };
      try {
        const result = await runScan(conn);
        await query(
          `INSERT INTO org_assessments (connection_id, user_id, snapshot_json, score, findings_json)
           VALUES ($1, $2, $3::jsonb, $4, $5::jsonb)`,
          [conn.id, ctx.userId, JSON.stringify(result.snapshot), result.score, JSON.stringify(result.findings)],
        );
        await query(`UPDATE salesforce_connections SET last_scanned_at = NOW() WHERE id = $1`, [conn.id]);
        return {
          ok: true,
          score: result.score,
          scanned_at: result.scanned_at,
          byChapter: result.byChapter,
          findingsCount: result.findings.length,
        };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "scan_failed" };
      }
    }

    case "navigate": {
      const label = String(args.label ?? "");
      const url = String(args.url ?? "");
      const rationale = args.rationale ? String(args.rationale) : undefined;
      if (!label || !url) return { error: "label and url required" };
      return { ok: true, label, url, rationale };
    }
  }
  return { error: `Unknown tool: ${name}` };
}
