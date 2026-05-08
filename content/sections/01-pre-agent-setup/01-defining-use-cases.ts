import type { Mission } from "@/content/types";

export const definingUseCases: Mission = {
  id: "pre-agent-setup.defining-use-cases",
  slug: "defining-use-cases",
  number: 1,
  title: "Defining Use Cases",
  summary: "Find the work in your business that's actually a fit for an agent — and capture it.",
  estMinutes: 25,
  steps: [
    {
      kind: "framework",
      title: "When is an agent the right tool?",
      subtitle: "Not every workflow needs an LLM. Use this lens before you build.",
      cards: [
        {
          title: "Ambiguous input",
          body: "Inputs vary in phrasing, structure, or completeness. A static form or rules engine can't catch every variant.",
          example: "Customer emails describing the same problem in 100 different ways.",
        },
        {
          title: "Multi-step reasoning",
          body: "The task requires looking up information, deciding what to do next, and synthesizing a response — not a single deterministic action.",
          example: "Triage → check related cases → propose a resolution → draft a reply.",
        },
        {
          title: "Conversational UX",
          body: "Users expect to ask follow-ups, refine, and get explanations. A chat surface beats a wizard or report.",
          example: "Internal copilot for sales reps prepping a call.",
        },
        {
          title: "Tool use over data",
          body: "The work calls into APIs, queries records, or invokes flows. The agent's value is orchestrating those tools, not generating prose.",
          example: "Schedule a meeting, then create a follow-up task in the right Opportunity.",
        },
      ],
    },
    {
      kind: "embed",
      title: "Watch: Agentforce in 5 minutes",
      provider: "youtube",
      src: "https://www.youtube.com/embed/UfwPo7vN6IA",
      description: "A short overview of what Agentforce is and how customers are using it. Replace this with your own intro video when ready.",
    },
    {
      kind: "framework",
      title: "Use-case patterns that work",
      subtitle: "Most successful Agentforce deployments fit one of these shapes.",
      cards: [
        {
          title: "Service deflection",
          body: "Resolve common cases end-to-end without a human. Agent reads the question, looks up account state, runs an action, replies.",
          bullets: ["Knowledge grounding", "Read+write tool calls", "Escalation handoff"],
        },
        {
          title: "Sales coaching / prep",
          body: "Internal copilot that prepares reps before calls and drafts follow-ups after.",
          bullets: ["Account brief", "Call prep questions", "Email draft"],
        },
        {
          title: "Internal copilot",
          body: "Org-aware Q&A across knowledge, records, and policies for a defined employee audience.",
          bullets: ["Knowledge sources", "Permission-aware retrieval", "Citations"],
        },
        {
          title: "Workflow assistant",
          body: "Speeds up a multi-step process inside a record page (case, opportunity, custom object).",
          bullets: ["Record context", "Suggest next step", "Run flow / apex action"],
        },
      ],
    },
    {
      kind: "whiteboard",
      title: "Brainstorm your use cases",
      description: "Drop sticky notes for every workflow you think might benefit from an agent. Don't filter yet — capture broadly, narrow later.",
      persistKey: "defining-use-cases.whiteboard",
    },
    {
      kind: "useCaseCapture",
      title: "Capture 1–3 candidate use cases",
      description: "For each, name the user, the painful workflow, and a single success metric you'd measure.",
      minCount: 1,
    },
  ],
  verify: {
    type: "evidence.review",
    explain: "At least one use case captured with name, user, pain point, and success metric.",
  },
};
