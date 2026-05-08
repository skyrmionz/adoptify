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
      kind: "coderPrompt",
      title: "Let a coding agent assign the permission sets",
      subtitle: "Skip clicking through Setup. Hand this prompt to Claude Code or Cursor and it will use the Salesforce CLI to assign every permission set in one shot.",
      prompts: [
        {
          id: "perms.cli-assign",
          title: "Assign Agentforce permission sets to a user",
          goal: "Assign the Agentforce User, Prompt Template Manager, and Data Cloud Admin permission sets via sf CLI.",
          tools: ["claude-code", "sf-cli"],
          prompt: `You are working in a Salesforce DX project. Use the Salesforce CLI to assign Agentforce-related permission sets to the user with username \${USERNAME} on org alias \${ORG_ALIAS}.

Steps:
1. Run \`sf org list\` to confirm \${ORG_ALIAS} is connected. If not, prompt me to authenticate.
2. Run \`sf data query --target-org \${ORG_ALIAS} --query "SELECT Id, Name, Label FROM PermissionSet WHERE Label LIKE '%Agentforce%' OR Label LIKE '%Prompt Template%' OR Label LIKE '%Data Cloud%'"\` and show me the matches.
3. For each permission set we agree on, run \`sf org assign permset --target-org \${ORG_ALIAS} --name <DeveloperName> --on-behalf-of \${USERNAME}\`.
4. After every assignment, run \`sf data query --target-org \${ORG_ALIAS} --query "SELECT PermissionSet.Label FROM PermissionSetAssignment WHERE Assignee.Username = '\${USERNAME}'"\` to confirm.
5. Print a summary of what was assigned.

Do not edit metadata files. Only run CLI commands. If a permission set is missing, tell me which PSL needs to be assigned at the org level first.`,
          notes: "Replace ${USERNAME} and ${ORG_ALIAS} with your values before pasting.",
        },
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
