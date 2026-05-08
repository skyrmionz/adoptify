import type { Mission } from "@/content/types";

export const stakeholders: Mission = {
  id: "pre-agent-setup.stakeholders",
  slug: "stakeholders-and-success-metrics",
  number: 4,
  title: "Stakeholders & Success Metrics",
  summary: "Lock in who owns this and what 'done' looks like before any building starts.",
  estMinutes: 15,
  steps: [
    {
      kind: "richContent",
      title: "Why this matters",
      subtitle: "Most agent projects stall not because the tech failed, but because no one defined the win.",
      blocks: [
        { kind: "p", text: "An Agentforce build touches several teams: a sponsor who funds it, a builder who configures it, a process owner who governs the work it automates, and the end users it serves. Without naming these people early, decisions take weeks and rollouts are quietly delayed." },
        { kind: "p", text: "You also need a single, measurable definition of success. 'Improve customer service' is not a goal — '% of cases deflected without a human in 90 days' is. Pick a primary KPI you can read directly from Salesforce data, plus one or two guardrail metrics so you don't optimize one number at the expense of another." },
        { kind: "callout", tone: "info", text: "Treat this mission as a contract. The fields you fill out below become the success criteria the embedded Agent will reference when answering 'are we ready to launch?'." },
      ],
    },
    {
      kind: "richContent",
      title: "Roles to identify",
      blocks: [
        { kind: "kv", rows: [
          { k: "Executive sponsor", v: "Owns the budget and the outcome. Approves go-live." },
          { k: "Product / process owner", v: "Owns the workflow the agent automates and the SOPs around it." },
          { k: "Salesforce admin / builder", v: "Configures the agent, topics, actions, and channels." },
          { k: "Knowledge owner", v: "Owns the articles or content the agent will retrieve from." },
          { k: "Security / privacy reviewer", v: "Signs off on Trust Layer settings, masking, and data-flow." },
          { k: "End-user lead", v: "Represents the audience (customer-facing or internal) that will interact with the agent." },
        ] },
      ],
    },
    {
      kind: "richContent",
      title: "Picking the right KPI",
      subtitle: "Aim for one primary metric, one cost metric, and one quality metric.",
      blocks: [
        { kind: "h", level: 3, text: "Customer-service style use cases" },
        { kind: "ul", items: [
          "Primary: % of conversations resolved without an escalation (deflection rate).",
          "Cost: Average handle time (AHT) for cases the agent touches.",
          "Quality: CSAT on transcripts the agent participated in.",
        ] },
        { kind: "h", level: 3, text: "Sales coaching / SDR style use cases" },
        { kind: "ul", items: [
          "Primary: # of qualified meetings sourced per rep per week.",
          "Cost: Time-to-first-touch on inbound leads.",
          "Quality: Conversion rate from meeting → opportunity.",
        ] },
        { kind: "h", level: 3, text: "Internal copilot style use cases" },
        { kind: "ul", items: [
          "Primary: weekly active users out of eligible audience.",
          "Cost: average tokens / Agentforce conversation units per session.",
          "Quality: thumbs-up / thumbs-down feedback ratio.",
        ] },
        { kind: "callout", tone: "warn", text: "Do NOT use 'NPS' or 'employee satisfaction' as the primary KPI for an agent. They move too slowly to debug a bad rollout and are influenced by too many other factors." },
      ],
    },
    {
      kind: "useCaseCapture",
      title: "Lock in your stakeholders & metrics",
      description: "Re-use the capture form to record one entry per use case from Mission 1. Replace 'pain point' with the KPI definition and 'success metric' with the target value + by-when.",
      minCount: 1,
    },
  ],
  verify: {
    type: "evidence.review",
    explain: "At least one use case has stakeholders + a measurable KPI captured.",
  },
};
