import type { Mission } from "@/content/types";

export const operateAndImprove: Mission = {
  id: "channels-and-launch.operate",
  slug: "operate-and-improve",
  number: 4,
  title: "Operate & Improve",
  summary: "Set up the review loop and the consumption monitoring that keeps the agent healthy.",
  estMinutes: 20,
  steps: [
    {
      kind: "richContent",
      title: "Three habits that keep agents working",
      blocks: [
        { kind: "h", level: 3, text: "1. Review transcripts weekly" },
        { kind: "p", text: "Look at MessagingSession / ConversationEntry list views, filtered by Escalated, Negative Feedback, and Action Failed. Five conversations a week is enough to keep your finger on the pulse." },
        { kind: "h", level: 3, text: "2. Iterate on instructions and descriptions" },
        { kind: "p", text: "When a topic mis-routes, fix the Classification Description, not the planner. When an action gets called wrong, tighten the @InvocableVariable description, not the prompt. The most-impactful tuning surface is the metadata you already control." },
        { kind: "h", level: 3, text: "3. Grow the test set after every incident" },
        { kind: "p", text: "Every reproduced failure becomes a new entry in your AiEvaluationTestSet. Wire 'sf agent test run' into CI so deploys can't regress fixed issues." },
        { kind: "callout", tone: "info", text: "Einstein Conversation Mining (Beta in some clouds) clusters failure topics automatically. Worth turning on once you have ≥100 conversations." },
      ],
    },
    {
      kind: "richContent",
      title: "Watch consumption like a hawk",
      blocks: [
        { kind: "p", text: "Agentforce is metered. Setup → Digital Wallet shows your Agentforce Conversations balance burn-down. Set Usage Alerts at 50/75/90% so you're never surprised." },
        { kind: "p", text: "If consumption is climbing fast and conversations aren't, look at retries. A single failed plan can burn many conversations. Fix the root cause, don't add capacity." },
      ],
    },
    {
      kind: "coderPrompt",
      title: "Weekly transcript review, automated",
      subtitle: "Have a coding agent pull recent conversations, cluster failures, and propose Topic / Action edits.",
      prompts: [
        {
          id: "ops.transcript-review",
          title: "Pull and triage the last week's conversations",
          goal: "Review escalated and negative-feedback transcripts; propose 3 concrete improvements.",
          tools: ["claude-code", "sf-cli"],
          prompt: `Review the last 7 days of agent conversations on org \${ORG_ALIAS}.

Steps:
1. Pull recent MessagingSession rows: sf data query --target-org \${ORG_ALIAS} --query "SELECT Id, EndUserContactId, EndTime, Status FROM MessagingSession WHERE EndTime = LAST_N_DAYS:7"
2. For each session, pull its ConversationEntry rows and reconstruct the transcript.
3. Bucket sessions: clean / escalated / negative-feedback / action-failed.
4. From the failure buckets, cluster by likely root cause (mis-routed Topic, missing Action, hallucination, permission issue).
5. Propose 3 specific improvements: which Classification Description to tighten, which Action description to fix, which test to add. Cite a specific transcript Id with each.
6. Optional: open a draft PR per recommendation against the corresponding metadata file.`,
        },
      ],
    },
    {
      kind: "setupChecklist",
      title: "Operate & improve checklist",
      items: [
        {
          id: "op.weekly-review",
          label: "Weekly transcript review process scheduled",
          help: "Pick a day. Pick an owner. Stick to it.",
          verify: { kind: "manual" },
        },
        {
          id: "op.test-set-grows",
          label: "Test set grows on every incident",
          help: "Every reproduced failure becomes a new test case.",
          verify: { kind: "manual" },
        },
        {
          id: "op.usage-alerts",
          label: "Usage alerts set at 50 / 75 / 90%",
          help: "Setup → Digital Wallet → Usage Alerts.",
          verify: { kind: "manual" },
        },
        {
          id: "op.weekly-conversations",
          label: "≥1 conversation in the last 7 days",
          help: "Detected via MessagingSession in the last 30-day window.",
          verify: { kind: "scanner.path", path: "channels.conversations_30d", expect: { gte: 1 } },
        },
        {
          id: "op.retro",
          label: "30-day retrospective scheduled",
          help: "30 days after launch, look at primary KPI vs. baseline. Decide what to invest in next.",
          verify: { kind: "manual" },
        },
      ],
    },
  ],
  verify: {
    type: "evidence.review",
    explain: "Operations cadence and consumption monitoring are in place.",
  },
};
