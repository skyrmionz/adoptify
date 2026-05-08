import type { Mission } from "@/content/types";

export const licenses: Mission = {
  id: "salesforce-setup.licenses",
  slug: "licenses-and-consumption",
  number: 1,
  title: "Licenses & Consumption",
  summary: "Confirm your org has the SKUs, capacity, and consumption tracking Agentforce needs.",
  estMinutes: 20,
  steps: [
    {
      kind: "richContent",
      title: "What you need to license",
      subtitle: "Agentforce is metered separately from your Sales/Service licenses.",
      blocks: [
        { kind: "p", text: "An Agentforce build always involves three commercial decisions: which Agentforce SKU you're entitled to, how much consumption (Agentforce Conversations) you've purchased, and whether the foundational add-ons your agent will need — Data Cloud, Service Cloud, MuleSoft — are already in your contract." },
        { kind: "h", level: 3, text: "Common SKUs" },
        { kind: "kv", rows: [
          { k: "Agentforce Service Agent", v: "Customer-facing case-deflection agent." },
          { k: "Agentforce Sales Coach", v: "Internal coaching agent that role-plays with reps." },
          { k: "Agentforce SDR Agent", v: "Inbound lead-nurture agent." },
          { k: "Agentforce for Sales / Service", v: "In-app copilot embedded in Sales/Service Cloud Lightning experience." },
          { k: "Salesforce Foundations", v: "Free entry-point capacity for existing customers — useful for proofs of concept." },
        ] },
        { kind: "callout", tone: "info", text: "Consumption is billed in 'Agentforce Conversations' units (formerly 'Einstein Requests'). Track your balance in Setup → Your Account or via the Digital Wallet." },
      ],
    },
    {
      kind: "setupChecklist",
      title: "Verify your entitlements",
      description: "We can't always read commercial entitlements directly, so a few of these are manual attestations.",
      items: [
        {
          id: "license.org-info-reviewed",
          label: "Reviewed Setup → Company Information for active entitlements",
          help: "Confirm you can see Agentforce-related licenses or Foundations capacity.",
          verify: { kind: "manual" },
          doc: "https://help.salesforce.com/s/articleView?id=sf.companyinfo.htm",
        },
        {
          id: "license.data-cloud-detected",
          label: "Data Cloud provisioned",
          help: "We look for any Data Lake / Model Object presence as a signal Data Cloud is enabled.",
          verify: { kind: "scanner.path", path: "dataDepth.data_lake_objects", expect: { gte: 1 } },
        },
        {
          id: "license.permission-set-licenses",
          label: "Agentforce / Einstein PSLs visible in Setup",
          help: "Setup → Permission Set Licenses. Look for Agentforce User, Prompt Template Manager, etc.",
          verify: { kind: "manual" },
          doc: "https://help.salesforce.com/s/articleView?id=sf.copilot_permission_sets.htm",
        },
        {
          id: "license.consumption-balance",
          label: "Reviewed Agentforce Conversations balance",
          help: "Setup → Your Account → confirm the team knows how many conversations are funded.",
          verify: { kind: "manual" },
          doc: "https://help.salesforce.com/s/articleView?id=sf.usage_based_entitlements.htm",
        },
      ],
    },
  ],
  verify: {
    type: "evidence.review",
    explain: "All license / consumption checks have been verified or marked manually.",
  },
};
