import type { Mission } from "@/content/types";

export const objectsReadiness: Mission = {
  id: "data-foundations.objects-readiness",
  slug: "object-and-field-readiness",
  number: 3,
  title: "Object & Field Readiness",
  summary: "Make sure the objects your agent will read from are field-described and properly shared.",
  estMinutes: 15,
  steps: [
    {
      kind: "richContent",
      title: "Help Text + Description = agent grounding",
      blocks: [
        { kind: "p", text: "When an agent calls a Standard or Apex action that returns a record, the LLM doesn't see your screens or your Lightning page layouts. It sees field API names, types, and the Help Text + Description metadata you've written. That metadata becomes the planner's source of truth for how to interpret each field." },
        { kind: "p", text: "Spend an afternoon improving Help Text on the 10–20 fields your agent will most often read. The lift in answer quality is enormous and has zero LLM cost." },
        { kind: "h", level: 3, text: "Sharing" },
        { kind: "p", text: "An agent runs as a user. Whatever that user can see (org-wide defaults, role hierarchy, sharing rules, manual sharing), the agent can return. Walk through the sharing model on each candidate object to confirm the agent's runtime user has the right exposure — not too much, not too little." },
      ],
    },
    {
      kind: "checklist",
      title: "Object readiness attestations",
      items: [
        { id: "obj.help-text", label: "Help Text reviewed on top fields the agent will read" },
        { id: "obj.descriptions", label: "Field Description filled in (it's distinct from Help Text and the LLM uses both)" },
        { id: "obj.sharing-rules", label: "Sharing model reviewed for the agent's runtime user" },
        { id: "obj.fls", label: "Field-Level Security audited for sensitive fields (SSN, payment info, etc.)" },
        { id: "obj.activities", label: "Activities / Tasks / Events enabled if the agent will log against the object" },
      ],
    },
  ],
  verify: {
    type: "evidence.review",
    explain: "All object-readiness items reviewed.",
  },
};
