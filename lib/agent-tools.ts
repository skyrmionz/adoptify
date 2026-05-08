import type { ToolDef } from "./openrouter";
import { sections } from "@/content";
import { getAllProgress } from "./progress";
import { queryOne } from "./db";

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
  }
  return { error: `Unknown tool: ${name}` };
}
