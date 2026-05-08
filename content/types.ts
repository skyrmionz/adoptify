// Strongly-typed mission spec authored as TS modules in /content/sections.
// The MissionRenderer consumes these and renders the appropriate step UI.

export type Step =
  | { kind: "framework"; title: string; cards: FrameworkCard[]; subtitle?: string }
  | { kind: "embed"; title: string; provider: "youtube" | "url" | "iframe"; src: string; description?: string }
  | { kind: "checklist"; title: string; items: { id: string; label: string; help?: string }[] }
  | { kind: "whiteboard"; title: string; description?: string; persistKey: string }
  | { kind: "useCaseCapture"; title: string; description?: string; minCount?: number }
  | { kind: "knowledgeAudit"; title: string; description?: string }
  | { kind: "orgScanReport"; title: string; description?: string; requireConnection: true }
  | { kind: "verifyInOrg"; title: string; description?: string; rule: VerifyRule };

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
  required: boolean;     // true means later sections are gated until this is complete
  missions: Mission[];
};
