import type { Mission } from "@/content/types";

export const pickAgentType: Mission = {
  id: "build-your-agent.pick-agent-type",
  slug: "pick-agent-type",
  number: 1,
  title: "Pick Your Agent Type",
  summary: "Choose the right Agentforce template — or start custom — based on your use case.",
  estMinutes: 15,
  steps: [
    {
      kind: "richContent",
      title: "The shipped Agentforce templates",
      subtitle: "Templates aren't just defaults. They come pre-wired with topic structures, system prompts, and starter actions tailored to a domain.",
      blocks: [
        { kind: "kv", rows: [
          { k: "Agentforce Service Agent", v: "Customer-facing case deflection. Default channel: Embedded Service / Messaging." },
          { k: "Agentforce Sales Coach", v: "Internal coaching agent that role-plays with reps before customer meetings." },
          { k: "Agentforce SDR", v: "Inbound lead nurture and qualification agent." },
          { k: "Agentforce Internal Copilot", v: "Embedded in App utility bar; org-aware Q&A for employees." },
          { k: "Agentforce Personal Shopper", v: "Vertical retail template — product discovery + recommendation." },
          { k: "Custom Agent", v: "Start from blank or from an Agent Spec. Use when none of the above fits." },
        ] },
        { kind: "callout", tone: "info", text: "When in doubt, pick the closest template and trim what you don't need. Starting from a template is almost always faster than blank, even if you delete half the topics on day one." },
      ],
    },
    {
      kind: "useCaseCapture",
      title: "Map your use cases to agent types",
      description: "For each use case from Chapter 1, name the agent template you'd use and one sentence explaining why.",
      minCount: 1,
    },
  ],
  verify: {
    type: "evidence.review",
    explain: "At least one use case has a chosen agent template.",
  },
};
