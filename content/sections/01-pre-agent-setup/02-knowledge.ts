import type { Mission } from "@/content/types";

export const knowledge: Mission = {
  id: "pre-agent-setup.knowledge",
  slug: "knowledge",
  number: 2,
  title: "Knowledge",
  summary: "Make sure your agent has somewhere reliable to look things up.",
  estMinutes: 20,
  steps: [
    {
      kind: "framework",
      title: "Why grounding matters",
      subtitle: "An agent without knowledge is just an opinion engine.",
      cards: [
        {
          title: "Retrieval beats memorization",
          body: "An agent that retrieves from your knowledge sources at runtime stays current as your business changes. One that 'knows' from training drifts immediately.",
        },
        {
          title: "Citations build trust",
          body: "Customers and employees trust an agent more when it shows its sources. Plan for citations from day one.",
        },
        {
          title: "Permissions are knowledge",
          body: "Whatever the agent retrieves, it can repeat back. Make sure access mirrors the user's real permissions, not the most-privileged service account.",
        },
        {
          title: "Quality over quantity",
          body: "100 high-quality articles will out-perform 10,000 stale ones. Curate before you connect.",
        },
      ],
    },
    {
      kind: "knowledgeAudit",
      title: "Register your knowledge sources",
      description: "Tell us where your agent should look. We'll do a live check on Salesforce-native sources to confirm they're populated and accessible.",
    },
    {
      kind: "framework",
      title: "Quality checklist",
      subtitle: "Before you ground an agent on a source, run through these.",
      cards: [
        { title: "Coverage", body: "Does the source actually contain answers for the use cases you captured?" },
        { title: "Freshness", body: "What's the typical age of an article? Is there an owner who keeps it current?" },
        { title: "Structure", body: "Headings, sections, metadata — these dramatically improve retrieval quality." },
        { title: "Access", body: "Who can read it today, and does that match who the agent will serve?" },
      ],
    },
  ],
  verify: {
    type: "evidence.review",
    explain: "At least one knowledge source registered, with live validation passing for any Salesforce-native source.",
  },
};
