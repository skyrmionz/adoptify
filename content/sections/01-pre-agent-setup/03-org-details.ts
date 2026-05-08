import type { Mission } from "@/content/types";

export const orgDetails: Mission = {
  id: "pre-agent-setup.org-details",
  slug: "org-details",
  number: 3,
  title: "Org Details",
  summary: "Connect your org and get a graded report of what's there — and what's missing.",
  estMinutes: 15,
  steps: [
    {
      kind: "framework",
      title: "Why we scan your org",
      subtitle: "We can't tell you how ready you are without looking.",
      cards: [
        { title: "Foundations", body: "Custom objects, fields, relationships, and record counts tell us what business shape your data is in." },
        { title: "Automation", body: "Flows are the most likely thing your agent will call. We measure how many you have and how complex they are." },
        { title: "Code", body: "Apex classes — particularly @InvocableMethod — are first-class agent actions. We surface candidates." },
        { title: "Data + Knowledge", body: "Knowledge articles, Data Cloud DMOs, and standard-object record counts size your grounding surface." },
      ],
    },
    {
      kind: "orgScanReport",
      title: "Run a full org scan",
      description: "We'll pull metadata + counts via your connected org. Nothing is written.",
      requireConnection: true,
    },
  ],
  verify: {
    type: "evidence.review",
    explain: "Scan completed within the last 7 days and you've reviewed the findings.",
  },
};
