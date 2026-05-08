import type { Mission } from "@/content/types";

export const turnOnAgentforce: Mission = {
  id: "salesforce-setup.turn-on-agentforce",
  slug: "turn-on-agentforce",
  number: 3,
  title: "Turn on Agentforce",
  summary: "Flip the Setup toggles required before you can create an agent.",
  estMinutes: 15,
  steps: [
    {
      kind: "richContent",
      title: "Setup toggles, in order",
      subtitle: "Each toggle gates the next; turn them on left-to-right.",
      blocks: [
        { kind: "ol", items: [
          "Setup → Einstein Setup → Turn on Einstein.",
          "Setup → Einstein Generative AI → Enable Einstein Generative AI.",
          "Setup → Agents (Agentforce Studio) → Turn on Agentforce.",
          "Setup → Einstein Trust Layer → confirm Trust Layer is on (default), configure data masking and audit collection.",
          "Setup → Agentforce Default Agent → choose default agent for the org.",
        ] },
        { kind: "callout", tone: "info", text: "If you can't see one of these pages, it's almost always a missing PSL or a missing SKU. Re-check Chapter 2 → Mission 1." },
        { kind: "h", level: 3, text: "My Domain & Enhanced Domains" },
        { kind: "p", text: "Your org's My Domain must be deployed (not just registered) for Agentforce to work on Lightning, Experience Cloud, and Embedded Service. Most modern orgs already have this; legacy orgs may need a one-time deployment window." },
      ],
    },
    {
      kind: "setupChecklist",
      title: "Verify the toggles",
      description: "Some toggles are not exposed via API; for those, verify in Setup and 'Mark manually'. Where we can detect signal, we will.",
      items: [
        {
          id: "toggle.einstein",
          label: "Einstein turned on",
          help: "Setup → Einstein Setup",
          verify: { kind: "manual" },
          doc: "https://help.salesforce.com/s/articleView?id=sf.einstein_setup.htm",
        },
        {
          id: "toggle.genai",
          label: "Einstein Generative AI enabled",
          help: "Detected indirectly via the presence of GenAI-related metadata.",
          verify: { kind: "scanner.path", path: "agentforceSetup.genai_enabled", expect: "truthy" },
          doc: "https://help.salesforce.com/s/articleView?id=sf.generative_ai_enable.htm",
        },
        {
          id: "toggle.agentforce",
          label: "Agentforce enabled",
          help: "Detected via BotVersion presence; verify the toggle in Setup → Agents.",
          verify: { kind: "scanner.path", path: "agentforceSetup.agentforce_enabled", expect: "truthy" },
        },
        {
          id: "toggle.trust-layer",
          label: "Einstein Trust Layer reviewed",
          help: "Confirm masking, audit, and toxicity detection match your governance policy.",
          verify: { kind: "manual" },
          doc: "https://help.salesforce.com/s/articleView?id=sf.generative_ai_trust.htm",
        },
        {
          id: "toggle.my-domain",
          label: "My Domain deployed",
          help: "Setup → My Domain → 'Deployed to Users' state.",
          verify: { kind: "manual" },
          doc: "https://help.salesforce.com/s/articleView?id=sf.domain_name_overview.htm",
        },
        {
          id: "toggle.enhanced-domains",
          label: "Enhanced Domains enabled",
          help: "Setup → My Domain → Routing & Policies. Required for many Agentforce channels.",
          verify: { kind: "manual" },
        },
      ],
    },
  ],
  verify: {
    type: "evidence.review",
    explain: "All Agentforce toggles verified or marked manually.",
  },
};
