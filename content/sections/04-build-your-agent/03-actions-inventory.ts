import type { Mission } from "@/content/types";

export const actionsInventory: Mission = {
  id: "build-your-agent.actions-inventory",
  slug: "actions-inventory",
  number: 3,
  title: "Actions Inventory",
  summary: "Inventory the Apex, Flow, and External Service actions in your org that could become agent tools.",
  estMinutes: 15,
  steps: [
    {
      kind: "richContent",
      title: "Action types, in order of how fast they ship",
      blocks: [
        { kind: "kv", rows: [
          { k: "Standard Actions", v: "Salesforce-shipped GenAiFunctions (Identify Record by Name, Query Records, Answer Questions with Knowledge, Summarize Record). Always the first thing to try." },
          { k: "Flow Actions", v: "Autolaunched Flow with Available-for-Agentforce inputs/outputs. Best for low-code orchestration." },
          { k: "Apex Actions", v: "@InvocableMethod with typed inputs and outputs. Use when business logic is complex or already lives in Apex." },
          { k: "Prompt Template Actions", v: "A Prompt Template invoked as a tool. Use for content generation (drafts, summaries) that needs grounding." },
          { k: "External Service Actions", v: "OpenAPI-described HTTP callouts. Use when the data lives in a non-Salesforce system." },
        ] },
        { kind: "callout", tone: "info", text: "Don't build new actions until you've inventoried what's already in the org. The next step pulls a real list from your connected org and lets you tag the candidates." },
      ],
    },
    {
      kind: "actionInventory",
      title: "Inventory candidates",
      description: "Click 'Scan org for candidates' to load Apex, Flow, and External Service items the agent could use today.",
    },
  ],
  verify: {
    type: "evidence.review",
    explain: "At least one candidate action is selected from the inventory.",
  },
};
