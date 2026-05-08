import type { Mission } from "@/content/types";

export const trustAndGovernance: Mission = {
  id: "channels-and-launch.trust",
  slug: "trust-and-governance",
  number: 2,
  title: "Trust & Governance",
  summary: "Lock down the Trust Layer settings, sharing model, and audit posture before going live.",
  estMinutes: 20,
  steps: [
    {
      kind: "richContent",
      title: "What the Einstein Trust Layer does for you",
      subtitle: "It's on by default. But the defaults probably don't match your governance bar.",
      blocks: [
        { kind: "kv", rows: [
          { k: "Secure Data Retrieval", v: "Enforces FLS / sharing on every grounded record before it's sent to the LLM." },
          { k: "Dynamic Grounding", v: "Only sends merge-resolved data to the LLM — never raw record IDs or PII unless masked." },
          { k: "Data Masking", v: "Configurable regex / picklist of PII fields masked before LLM, demasked after." },
          { k: "Zero Data Retention", v: "Salesforce-negotiated agreement with model providers that prompts/responses are not retained." },
          { k: "Toxicity Detection", v: "Scores responses; configurable threshold to block or warn." },
          { k: "Prompt Defense", v: "Mitigates prompt-injection from user input." },
          { k: "Audit Trail", v: "Every prompt/response + masking event logged to Data Cloud (Einstein_Audit_* DMOs)." },
        ] },
        { kind: "callout", tone: "warn", text: "Default masking covers common PII patterns (email, phone, credit card). It does NOT know about your custom fields. Add picklist + regex rules for your industry-specific sensitive data." },
      ],
    },
    {
      kind: "setupChecklist",
      title: "Trust & governance checklist",
      items: [
        {
          id: "trust.audit-on",
          label: "Trust Layer audit logging enabled",
          help: "Setup → Einstein Trust Layer → Audit & Feedback Collection.",
          verify: { kind: "manual" },
        },
        {
          id: "trust.masking-configured",
          label: "Custom masking rules configured for your domain",
          help: "Add regex/picklist patterns for industry-specific PII.",
          verify: { kind: "manual" },
        },
        {
          id: "trust.toxicity",
          label: "Toxicity threshold reviewed",
          help: "Default may be too lenient or too strict for your audience.",
          verify: { kind: "manual" },
        },
        {
          id: "trust.integration-user",
          label: "Integration / runtime user uses least-privilege profile",
          help: "Especially important for guest channels (Embedded Service, Experience Cloud).",
          verify: { kind: "manual" },
        },
        {
          id: "trust.security-review",
          label: "Security / privacy reviewer signed off",
          help: "Get explicit sign-off from the role identified in Chapter 1.",
          verify: { kind: "manual" },
        },
      ],
    },
  ],
  verify: {
    type: "evidence.review",
    explain: "Trust Layer reviewed and security sign-off in place.",
  },
};
