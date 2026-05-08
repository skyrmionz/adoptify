// Strongly-typed mission spec authored as TS modules in /content/sections.
// The MissionRenderer consumes these and renders the appropriate step UI.

export type RichBlock =
  | { kind: "h"; level: 2 | 3; text: string }
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "callout"; tone: "info" | "warn" | "success"; text: string }
  | { kind: "code"; lang?: string; code: string }
  | { kind: "image"; src: string; alt: string }
  | { kind: "kv"; rows: { k: string; v: string }[] };

export type SetupCheckVerify =
  | { kind: "manual" }
  | { kind: "tooling.soql"; soql: string; expect: "exists" | { minCount: number } }
  | { kind: "rest.soql"; soql: string; expect: "exists" | { minCount: number } }
  | { kind: "rest.path"; path: string; jsonPath?: string; expect: "truthy" | "equals"; value?: unknown }
  | { kind: "scanner.path"; path: string; expect: "truthy" | { gte: number } };

export type SetupCheckItem = {
  id: string;
  label: string;
  help?: string;
  doc?: string; // optional Salesforce help URL
  verify: SetupCheckVerify;
};

export type ChannelOption = {
  id: string;
  name: string;
  blurb: string;
  prerequisites: string[]; // human-readable, persisted as evidence
  scannerPath?: string; // optional dot-path on Snapshot to auto-detect "ready"
};

export type CoderTool =
  | "sf-cli"
  | "adlc"
  | "data-360"
  | "metadata-api"
  | "claude-code"
  | "cursor";

export type CoderPrompt = {
  id: string;
  title: string;
  goal: string; // single-line description
  tools: CoderTool[];
  prompt: string; // multi-line; rendered in a copyable code block
  notes?: string;
};

export type Step =
  | { kind: "framework"; title: string; cards: FrameworkCard[]; subtitle?: string }
  | { kind: "embed"; title: string; provider: "youtube" | "url" | "iframe"; src: string; description?: string }
  | { kind: "checklist"; title: string; items: { id: string; label: string; help?: string }[] }
  | { kind: "whiteboard"; title: string; description?: string; persistKey: string }
  | { kind: "useCaseCapture"; title: string; description?: string; minCount?: number }
  | { kind: "knowledgeAudit"; title: string; description?: string }
  | { kind: "orgScanReport"; title: string; description?: string; requireConnection: true }
  | { kind: "verifyInOrg"; title: string; description?: string; rule: VerifyRule }
  | { kind: "richContent"; title: string; subtitle?: string; blocks: RichBlock[] }
  | { kind: "setupChecklist"; title: string; description?: string; items: SetupCheckItem[] }
  | { kind: "actionInventory"; title: string; description?: string }
  | { kind: "channelPlanner"; title: string; description?: string; options: ChannelOption[] }
  | { kind: "promptDesigner"; title: string; description?: string }
  | { kind: "coderPrompt"; title: string; subtitle?: string; prompts: CoderPrompt[] };

export type FrameworkCard = {
  title: string;
  body: string;
  bullets?: string[];
  example?: string;
};

export type VerifyRule =
  | { type: "snapshot.metric.gte"; path: string; value: number; explain: string }
  | { type: "snapshot.contains"; path: string; explain: string }
  | { type: "evidence.review"; explain: string };

export type Mission = {
  id: string;            // stable id used for mission_progress.mission_id
  slug: string;          // url segment
  number: number;        // display order in section
  title: string;
  summary: string;       // 1-line description shown on mission card
  estMinutes: number;    // estimated time
  steps: Step[];
  verify: VerifyRule;
};

export type Section = {
  id: string;
  slug: string;
  title: string;
  description: string;
  required: boolean;     // informational only — gating not enforced
  missions: Mission[];
};
