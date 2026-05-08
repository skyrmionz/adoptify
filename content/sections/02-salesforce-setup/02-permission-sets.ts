import type { Mission } from "@/content/types";

export const permissionSets: Mission = {
  id: "salesforce-setup.permission-sets",
  slug: "permission-sets",
  number: 2,
  title: "Permission Sets & PSLs",
  summary: "Assign the permission sets your builders, runtime users, and integration users need.",
  estMinutes: 15,
  steps: [
    {
      kind: "richContent",
      title: "Two layers, often confused",
      blocks: [
        { kind: "p", text: "A Permission Set License (PSL) is the entitlement to use a feature — granted to your org. A Permission Set is the actual in-app permission you assign to a user. You almost always need to do both: assign the PSL, then assign the matching permission set." },
        { kind: "h", level: 3, text: "Who needs what" },
        { kind: "kv", rows: [
          { k: "Builders / admins", v: "Agentforce User + Prompt Template Manager + Data Cloud Admin (if grounding via Data Cloud)" },
          { k: "End users (interactive)", v: "Agentforce User + Prompt Template User" },
          { k: "Service runtime user", v: "Agentforce Service Agent User (for the agent's own runtime context)" },
          { k: "Integration / API caller", v: "A dedicated Integration User profile + Agentforce User + Connected App permissions" },
        ] },
        { kind: "callout", tone: "warn", text: "Your agent runs as a real user. Whatever that user can read, the agent can repeat back to whoever it's talking to. Use a least-privilege Integration User for guest / public channels." },
      ],
    },
    {
      kind: "setupChecklist",
      title: "Assign the right permission sets",
      description: "Each verification queries Salesforce to confirm at least one user has the listed permission set.",
      items: [
        {
          id: "perms.agentforce-user",
          label: "Permission set 'Agentforce User' (or equivalent) assigned",
          help: "Required for anyone who builds or interacts with an agent.",
          verify: {
            kind: "rest.soql",
            soql: "SELECT COUNT(Id) FROM PermissionSetAssignment WHERE PermissionSet.Label LIKE '%Agentforce%'",
            expect: { minCount: 1 },
          },
        },
        {
          id: "perms.prompt-template",
          label: "Permission set 'Prompt Template Manager' or 'Prompt Template User' assigned",
          help: "Required for using or editing prompt templates.",
          verify: {
            kind: "rest.soql",
            soql: "SELECT COUNT(Id) FROM PermissionSetAssignment WHERE PermissionSet.Label LIKE '%Prompt Template%'",
            expect: { minCount: 1 },
          },
        },
        {
          id: "perms.data-cloud-admin",
          label: "Permission set for Data Cloud Admin / Data Cloud User assigned",
          help: "Needed for builders working with retrievers and grounded data.",
          verify: {
            kind: "rest.soql",
            soql: "SELECT COUNT(Id) FROM PermissionSetAssignment WHERE PermissionSet.Label LIKE '%Data Cloud%'",
            expect: { minCount: 1 },
          },
        },
        {
          id: "perms.einstein-copilot",
          label: "Permission set 'Einstein Copilot for Salesforce User' (or equivalent) present",
          help: "Used for in-app copilot experiences. May not exist in all orgs.",
          verify: {
            kind: "rest.soql",
            soql: "SELECT COUNT(Id) FROM PermissionSet WHERE Label LIKE '%Einstein%'",
            expect: { minCount: 1 },
          },
        },
        {
          id: "perms.integration-user",
          label: "Dedicated Integration User identified for headless / guest channels",
          help: "For Agentforce API or guest Experience Cloud, designate a least-privilege user. Mark manually once chosen.",
          verify: { kind: "manual" },
        },
      ],
    },
  ],
  verify: {
    type: "evidence.review",
    explain: "All required permission sets are assigned to at least one user, and an Integration User is identified.",
  },
};
