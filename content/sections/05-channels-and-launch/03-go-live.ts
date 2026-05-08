import type { Mission } from "@/content/types";

export const goLive: Mission = {
  id: "channels-and-launch.go-live",
  slug: "go-live",
  number: 3,
  title: "Go Live",
  summary: "Activate the agent, verify a real conversation completes, and grant production user access.",
  estMinutes: 15,
  steps: [
    {
      kind: "richContent",
      title: "The launch checklist",
      blocks: [
        { kind: "ol", items: [
          "Activate a BotVersion. Until a BotVersion is Active, your agent isn't reachable on any channel.",
          "Bind the agent to your chosen channel(s). Default Agent in Setup, Messaging routing flow, etc.",
          "Run a test conversation end-to-end on each channel. A successful run produces a row in MessagingSession or ConversationEntry.",
          "Grant runtime users the right PSL and assign agent permissions per channel.",
          "Tell people. Adoption needs an announcement, not just a config change.",
        ] },
        { kind: "callout", tone: "info", text: "We can detect three of these via the org scan (active BotVersion, conversation rows in the last 30 days, channel surfaces). The rest are attestations." },
      ],
    },
    {
      kind: "setupChecklist",
      title: "Go-live verification",
      items: [
        {
          id: "live.bot-active",
          label: "At least one BotVersion is Active",
          verify: { kind: "scanner.path", path: "agentforceSetup.bot_versions_active", expect: { gte: 1 } },
        },
        {
          id: "live.channel-bound",
          label: "Agent is bound to at least one channel",
          help: "Detected via Embedded Service / Messaging / Experience Cloud / Voice presence in the org scan.",
          verify: { kind: "manual" },
        },
        {
          id: "live.first-conversation",
          label: "First production conversation logged",
          help: "Detected via MessagingSession in the last 30 days.",
          verify: { kind: "scanner.path", path: "channels.conversations_30d", expect: { gte: 1 } },
        },
        {
          id: "live.users-permissioned",
          label: "Production users have the right permission sets",
          verify: { kind: "manual" },
        },
        {
          id: "live.announcement",
          label: "Launch announcement sent to the audience",
          verify: { kind: "manual" },
        },
      ],
    },
  ],
  verify: {
    type: "evidence.review",
    explain: "Active BotVersion, channel bound, first conversation logged.",
  },
};
