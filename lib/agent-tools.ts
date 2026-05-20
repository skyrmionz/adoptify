import type { ToolDef } from "./openrouter";
import { sections, getMissionById } from "@/content";
import { getAllProgress, upsertProgress } from "./progress";
import { query, queryOne } from "./db";
import { getLatestSnapshot } from "./snapshot-store";
import { buildActivationPlan, getDiagnostic, getSelectedUseCase } from "./diagnostic";
import { buildScanPrompt } from "./prompts";
import { getOrMintRawToken } from "./api-tokens";

export const agentTools: ToolDef[] = [
  // --- Read: Pocket FDE diagnostic ---
  {
    type: "function",
    function: {
      name: "read_diagnostic",
      description: "Read the user's Pocket FDE diagnostic: intake answers, readiness summary, and Stage 1-2 blockers.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "read_selected_use_case",
      description: "Read the user's selected first Agentforce use case, including fit, prerequisites, blockers, and business impact.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "read_activation_plan",
      description: "Read the ordered activation plan derived from the diagnostic and selected first agent. Use this for next-step guidance.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },

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

  // --- Read: Salesforce snapshot (ingested by the user's coding agent) ---
  {
    type: "function",
    function: {
      name: "lookup_snapshot",
      description: "Read a value from the user's most recently ingested Salesforce snapshot using a dot-path. Adoptify does not query Salesforce directly anymore — the user's coding agent ingests snapshots via /api/ingest/scan. Returns the value at the path, or { error: 'no_snapshot' } if the user hasn't synced yet. Examples of paths: 'foundations.custom_objects', 'agents.bots', 'integrations.sample.apex', 'access.ai_permission_sets'.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Dot-path into the snapshot. See lib/metadata-scanner.ts Snapshot type for the full shape." },
        },
        required: ["path"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_snapshot_keys",
      description: "List the top-level sections of the latest ingested snapshot (e.g. 'foundations', 'automation', 'agents'). Use this when you don't know what to ask for.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
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
      name: "get_scan_prompt",
      description: "Return the exact prompt the user should paste into their coding agent (Claude Code, Cursor, etc.) to scan their Salesforce org and sync the results back to Adoptify. Adoptify itself can't run the scan — the user's local agent does, using their `sf` CLI auth, and POSTs the JSON to /api/ingest/scan. The returned prompt has the user's API token embedded.",
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

function readJsonPath(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

export async function executeTool(name: string, rawArgs: unknown, ctx: ToolHandlerArgs): Promise<unknown> {
  const args = (rawArgs && typeof rawArgs === "object" ? rawArgs : {}) as Record<string, unknown>;
  switch (name) {
    case "read_diagnostic": {
      return await getDiagnostic(ctx.userId);
    }
    case "read_selected_use_case": {
      return await getSelectedUseCase(ctx.userId);
    }
    case "read_activation_plan": {
      const [diagnostic, selected] = await Promise.all([
        getDiagnostic(ctx.userId),
        getSelectedUseCase(ctx.userId),
      ]);
      return buildActivationPlan(selected, diagnostic).map((item) => ({
        missionId: item.mission.id,
        title: item.mission.title,
        href: item.href,
        section: item.sectionTitle,
        reason: item.reason,
        blockedBy: item.blockedBy,
        dependencies: item.dependencies,
      }));
    }
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

    case "lookup_snapshot": {
      const path = String(args.path ?? "");
      if (!path) return { error: "path is required" };
      const latest = await getLatestSnapshot(ctx.userId);
      if (!latest) {
        return {
          error: "no_snapshot",
          hint: "Use get_scan_prompt to give the user a prompt that syncs their org to Adoptify, then ask again.",
        };
      }
      const value = readJsonPath(latest.snapshot, path);
      return { path, value, scanned_at: latest.scanned_at };
    }
    case "list_snapshot_keys": {
      const latest = await getLatestSnapshot(ctx.userId);
      if (!latest) return { error: "no_snapshot" };
      return {
        scanned_at: latest.scanned_at,
        score: latest.score,
        sections: Object.keys(latest.snapshot),
        findings_count: latest.findings.length,
      };
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
    case "get_scan_prompt": {
      const { raw } = await getOrMintRawToken(ctx.userId);
      const appUrl = process.env.APP_URL ?? "http://localhost:3000";
      const prompt = buildScanPrompt({ apiToken: raw, appUrl });
      return {
        ok: true,
        prompt,
        instructions: "Hand the prompt to the user verbatim and tell them to paste it into their coding agent (Claude Code, Cursor, etc.). The agent will run the scan locally and POST the result to /api/ingest/scan; the page will pick up the new snapshot automatically.",
      };
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
