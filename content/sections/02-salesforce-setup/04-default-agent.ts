import type { Mission } from "@/content/types";

export const defaultAgent: Mission = {
  id: "salesforce-setup.default-agent",
  slug: "default-agent-and-utility-bar",
  number: 4,
  title: "Default Agent & Utility Bar",
  summary: "Make sure users can actually invoke an agent from inside Salesforce.",
  estMinutes: 10,
  steps: [
    {
      kind: "richContent",
      title: "Where users will see the agent",
      blocks: [
        { kind: "p", text: "Once Agentforce is on, you still have to make the agent accessible. There are two in-app entry points to wire up." },
        { kind: "h", level: 3, text: "Default Agent" },
        { kind: "p", text: "Setup → Agentforce Default Agent. The default agent is what users see when they open the Agentforce panel without a more specific agent assigned. Set this per app or per profile depending on your edition." },
        { kind: "h", level: 3, text: "Lightning App utility bar" },
        { kind: "p", text: "App Manager → your Lightning app → Utility Items → add the Agentforce panel. This pins the agent button to the bottom of the app for the chosen audience." },
        { kind: "callout", tone: "info", text: "If the Agentforce icon doesn't appear on the utility bar after adding it, log out and back in — the entitlement check is cached at session start." },
      ],
    },
    {
      kind: "setupChecklist",
      title: "Configure the in-app entry points",
      items: [
        {
          id: "default.agent-set",
          label: "Default Agent selected for at least one Lightning app",
          help: "Setup → Agentforce Default Agent",
          verify: { kind: "manual" },
        },
        {
          id: "default.utility-bar",
          label: "Agentforce utility bar item added to a Lightning app",
          help: "App Manager → your app → Utility Items → New Utility Item → Agentforce.",
          verify: { kind: "manual" },
        },
        {
          id: "default.test-launch",
          label: "Verified the panel opens for a test user",
          help: "Login as a user with the Agentforce User PSL. Click the icon. Should open the agent without errors.",
          verify: { kind: "manual" },
        },
      ],
    },
  ],
  verify: {
    type: "evidence.review",
    explain: "Default Agent + utility bar are configured and tested.",
  },
};
