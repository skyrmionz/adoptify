import type { Mission } from "@/content/types";

export const topics: Mission = {
  id: "build-your-agent.topics",
  slug: "topics-101",
  number: 2,
  title: "Topics 101",
  summary: "Topics are how the agent decides what to do. Get this design right and everything else gets easier.",
  estMinutes: 20,
  steps: [
    {
      kind: "richContent",
      title: "What a Topic actually is",
      subtitle: "A Topic = a domain of work the agent can handle, with the actions and instructions to handle it.",
      blocks: [
        { kind: "p", text: "When a user message arrives, the Atlas Reasoning Engine reads each Topic's Classification Description and decides which Topic the message belongs to. It then runs that Topic's Instructions and chooses among that Topic's Actions to fulfill the request." },
        { kind: "h", level: 3, text: "Anatomy of a Topic" },
        { kind: "kv", rows: [
          { k: "Classification Description", v: "Plain English description of what user messages this topic handles. Most-impactful field for routing." },
          { k: "Scope", v: "The narrower domain boundary. Helps the planner reject out-of-scope requests." },
          { k: "Instructions", v: "Behavioral guardrails: how to greet, what to refuse, when to escalate. Shorter is better." },
          { k: "Actions", v: "The tools the agent can use within this topic. Standard, Apex, Flow, Prompt, External." },
        ] },
        { kind: "h", level: 3, text: "Underlying metadata" },
        { kind: "p", text: "Topics are stored as GenAiPlugin / GenAiPluginDefinition metadata, attached to a GenAiPlanner (or, for multi-planner orchestration, GenAiPlannerBundle) on a BotVersion. You usually don't edit the XML directly — Agent Builder is the right surface." },
      ],
    },
    {
      kind: "embed",
      title: "Watch: Topic design walkthrough",
      provider: "url",
      src: "",
      description: "We'll add a recorded walkthrough here. For now, this is a placeholder.",
    },
    {
      kind: "richContent",
      title: "Common pitfalls",
      blocks: [
        { kind: "ul", items: [
          "Topics that overlap. If two topics could plausibly handle the same message, the planner will guess. Make boundaries unambiguous.",
          "Vague Classification Descriptions. 'Helps with cases' is too broad. Name specific user phrasings.",
          "Action sprawl in one Topic. If a Topic has more than ~6 actions, split it.",
          "Long Instructions that read like documentation. The planner doesn't read 12 paragraphs well; keep it under 200 words.",
        ] },
      ],
    },
    {
      kind: "checklist",
      title: "Topic-design self-check",
      items: [
        { id: "topics.distinct", label: "Each topic has a clearly distinct Classification Description" },
        { id: "topics.scope", label: "Each topic has Scope set" },
        { id: "topics.short-instructions", label: "Instructions stay under ~200 words" },
        { id: "topics.actions-per-topic", label: "No topic has more than ~6 actions" },
        { id: "topics.fallback", label: "An out-of-scope or fallback Topic exists for unclassified messages" },
      ],
    },
  ],
  verify: {
    type: "evidence.review",
    explain: "Topic-design checklist reviewed.",
  },
};
