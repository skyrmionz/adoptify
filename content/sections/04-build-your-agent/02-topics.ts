import type { Mission } from "@/content/types";

export const topics: Mission = {
  id: "build-your-agent.topics",
  slug: "topics-101",
  number: 2,
  title: "Topics 101",
  summary: "Topics are how the agent decides what to do. Get this design right and everything else gets easier.",
  estMinutes: 20,
  steps: [
    {
      kind: "richContent",
      title: "What a Topic actually is",
      subtitle: "A Topic = a domain of work the agent can handle, with the actions and instructions to handle it.",
      blocks: [
        { kind: "p", text: "When a user message arrives, the Atlas Reasoning Engine reads each Topic's Classification Description and decides which Topic the message belongs to. It then runs that Topic's Instructions and chooses among that Topic's Actions to fulfill the request." },
        { kind: "h", level: 3, text: "Anatomy of a Topic" },
        { kind: "kv", rows: [
          { k: "Classification Description", v: "Plain English description of what user messages this topic handles. Most-impactful field for routing." },
          { k: "Scope", v: "The narrower domain boundary. Helps the planner reject out-of-scope requests." },
          { k: "Instructions", v: "Behavioral guardrails: how to greet, what to refuse, when to escalate. Shorter is better." },
          { k: "Actions", v: "The tools the agent can use within this topic. Standard, Apex, Flow, Prompt, External." },
        ] },
        { kind: "h", level: 3, text: "Underlying metadata" },
        { kind: "p", text: "Topics are stored as GenAiPlugin / GenAiPluginDefinition metadata, attached to a GenAiPlanner (or, for multi-planner orchestration, GenAiPlannerBundle) on a BotVersion. You usually don't edit the XML directly — Agent Builder is the right surface." },
      ],
    },
    {
      kind: "embed",
      title: "Watch: Topic design walkthrough",
      provider: "url",
      src: "",
      description: "We'll add a recorded walkthrough here. For now, this is a placeholder.",
    },
    {
      kind: "richContent",
      title: "Common pitfalls",
      blocks: [
        { kind: "ul", items: [
          "Topics that overlap. If two topics could plausibly handle the same message, the planner will guess. Make boundaries unambiguous.",
          "Vague Classification Descriptions. 'Helps with cases' is too broad. Name specific user phrasings.",
          "Action sprawl in one Topic. If a Topic has more than ~6 actions, split it.",
          "Long Instructions that read like documentation. The planner doesn't read 12 paragraphs well; keep it under 200 words.",
        ] },
      ],
    },
    {
      kind: "coderPrompt",
      title: "Have a coding agent scaffold a Topic for you",
      subtitle: "Agent Script DX (ADLC) lets a coding agent create, preview, and deploy Agentforce topics from your repo.",
      prompts: [
        {
          id: "topics.scaffold",
          title: "Scaffold a new Topic from a use case",
          goal: "Generate the GenAiPlugin metadata + classification description + scope + initial actions for a Topic.",
          tools: ["claude-code", "adlc", "sf-cli"],
          prompt: `You're working in a Salesforce DX project that has Agent Script DX (ADLC) installed. Help me scaffold a new Agentforce Topic for the use case below.

USE CASE:
\${PASTE_USE_CASE_FROM_MISSION_1}

PRIMARY USERS:
\${WHO_TALKS_TO_THE_AGENT}

Steps:
1. Run \`sf agent generate topic --name <DeveloperName> --output-dir force-app/main/default\` (or the equivalent ADLC command in this CLI version) to scaffold the Topic + GenAiPlugin metadata.
2. Edit the generated GenAiPlugin XML:
   - <classificationDescription>: a single, specific paragraph describing what user messages this topic handles. Use real user phrasings.
   - <scope>: a tighter boundary statement.
   - <instructions>: under 200 words. Define greeting, refusal, escalation behavior.
3. Recommend 2-4 initial Actions (standard, Apex, or Flow). Stub the references in the XML.
4. Run \`sf agent preview --topic <DeveloperName>\` to test classification on 5 sample utterances. Report routing accuracy.
5. Open a PR titled "feat(agent): add <DeveloperName> topic" with the new files plus a short summary in the description.

Do not deploy yet. We'll review locally first.`,
        },
      ],
    },
    {
      kind: "checklist",
      title: "Topic-design self-check",
      items: [
        { id: "topics.distinct", label: "Each topic has a clearly distinct Classification Description" },
        { id: "topics.scope", label: "Each topic has Scope set" },
        { id: "topics.short-instructions", label: "Instructions stay under ~200 words" },
        { id: "topics.actions-per-topic", label: "No topic has more than ~6 actions" },
        { id: "topics.fallback", label: "An out-of-scope or fallback Topic exists for unclassified messages" },
      ],
    },
  ],
  verify: {
    type: "evidence.review",
    explain: "Topic-design checklist reviewed.",
  },
};
