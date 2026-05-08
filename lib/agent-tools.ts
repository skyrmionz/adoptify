import type { ToolDef } from "./openrouter";
import { sections } from "@/content";
import { getAllProgress } from "./progress";
import { query, queryOne } from "./db";

export const agentTools: ToolDef[] = [
  {
    type: "function",
    function: {
      name: "list_missions",
      description: "List all sections and missions defined in Adoptify, with the user's progress on each.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "read_use_cases",
      description: "Read the use cases the user captured in Mission 1 (Defining Use Cases). Returns name, user, pain, success metric for each.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "read_knowledge_sources",
      description: "Read the knowledge sources the user registered in Mission 2 (Knowledge).",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "read_org_snapshot",
      description: "Read the user's most recent Salesforce org assessment (snapshot of metadata + findings + score). Returns null if no scan exists.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "read_setup_checks",
      description: "Read the user's accumulated SetupChecklist results across every mission. Use to answer 'what setup is left?'.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "read_channel_plan",
      description: "Read the channels the user picked in the Channels & Launch chapter, with per-channel prerequisite acknowledgements.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "read_action_inventory",
      description: "Read the user's selected agent-action candidates (Apex / Flow / External Service) from the Build Your Agent chapter.",
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
];

type ToolHandlerArgs = {
  userId: string;
};

export async function executeTool(name: string, _args: unknown, ctx: ToolHandlerArgs): Promise<unknown> {
  switch (name) {
    case "list_missions": {
      const progress = await getAllProgress(ctx.userId);
      const byId = new Map(progress.map((p) => [p.mission_id, p]));
      return sections.map((s) => ({
        section: s.title,
        required: s.required,
        missions: s.missions.map((m) => ({
          id: m.id,
          title: m.title,
          summary: m.summary,
          status: byId.get(m.id)?.status ?? "not_started",
          completed_at: byId.get(m.id)?.completed_at ?? null,
        })),
      }));
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
      return rows.map((r) => ({
        mission_id: r.mission_id,
        checks: r.evidence_json?.setupChecks ?? {},
      }));
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
  }
  return { error: `Unknown tool: ${name}` };
}
