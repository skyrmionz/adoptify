import type { Mission } from "@/content/types";

export const promptTemplates: Mission = {
  id: "build-your-agent.prompt-templates",
  slug: "prompt-templates",
  number: 4,
  title: "Prompt Templates",
  summary: "Design the prompts your agent will use — Sales Email, Field Generation, Record Summary, or Flex.",
  estMinutes: 30,
  steps: [
    {
      kind: "richContent",
      title: "The four template types",
      subtitle: "Pick the right type for the job; each comes with a different grounding contract.",
      blocks: [
        { kind: "kv", rows: [
          { k: "Sales Email", v: "Drafts an email grounded in a specific record (e.g. Opportunity). Built-in placeholders for sender/recipient." },
          { k: "Field Generation", v: "Generates a value for a single field on a record. Best for things like 'Account summary' or 'Risk rating'." },
          { k: "Record Summary", v: "Summarizes one record using its fields and related records. Optimized for at-a-glance briefs." },
          { k: "Flex", v: "General purpose. Accepts arbitrary inputs, including Apex-merged data and Data Cloud retrievers. Use when none of the above fit." },
        ] },
        { kind: "h", level: 3, text: "Grounding sources" },
        { kind: "ul", items: [
          "Record merge fields — directly from the record the prompt is invoked on.",
          "Related Lists — child records of the primary record.",
          "Apex-invoked merge fields — for arbitrary structured data via @InvocableMethod returning Map<String, Object>.",
          "Data Cloud retrievers — semantic + lexical search across DMOs and unstructured content.",
          "Knowledge snippets — published articles with citations.",
        ] },
        { kind: "callout", tone: "info", text: "Every prompt invocation flows through the Einstein Trust Layer: mask PII → call LLM → demask response → log to Data Cloud. You don't have to wire this up; it's automatic." },
      ],
    },
    {
      kind: "promptDesigner",
      title: "Draft your prompts",
      description: "Sketch each prompt template before opening Prompt Builder. Capture the purpose, grounding sources, and a sample input/output pair so the implementation work is mechanical.",
    },
  ],
  verify: {
    type: "evidence.review",
    explain: "At least one prompt template drafted with purpose and sample I/O.",
  },
};
