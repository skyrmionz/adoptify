import type { Mission } from "@/content/types";

export const apexAndFlow: Mission = {
  id: "build-your-agent.apex-and-flow",
  slug: "apex-and-flow-as-actions",
  number: 5,
  title: "Apex & Flow as Actions",
  summary: "Wire your existing Apex methods and autolaunched Flows into the agent as first-class tools.",
  estMinutes: 25,
  steps: [
    {
      kind: "richContent",
      title: "Apex actions",
      subtitle: "Conventions matter. The LLM reads your annotations to know how to call your method.",
      blocks: [
        { kind: "code", lang: "apex", code: `public with sharing class CaseTriageAction {
    public class Input {
        @InvocableVariable(label='Case ID' description='15- or 18-char Salesforce Case Id' required=true)
        public Id caseId;
    }
    public class Output {
        @InvocableVariable(label='Recommended owner' description='User Id of the rep best suited to handle this case')
        public Id recommendedOwnerId;
        @InvocableVariable(label='Reason' description='One-sentence explanation for the recommendation')
        public String reason;
    }

    @InvocableMethod(
        label='Triage Case'
        description='Recommend a case owner based on workload, expertise, and SLA.'
        callout=true
    )
    public static List<Output> triage(List<Input> inputs) {
        // ... your business logic
    }
}` },
        { kind: "ul", items: [
          "Always with sharing — agents must respect the runtime user's permissions.",
          "Inputs and outputs are typed inner classes with @InvocableVariable. The description fields are the LLM's documentation.",
          "Return List<Output> even for a single result. The Bulk API contract assumes lists.",
          "Set callout=true if your method makes HTTP requests.",
          "Avoid SObject as a return type when you can — typed Apex classes give the planner more schema info.",
        ] },
      ],
    },
    {
      kind: "richContent",
      title: "Flow actions",
      blocks: [
        { kind: "p", text: "Autolaunched Flows can be agent actions out of the box. Inputs and outputs need to be marked 'Available for Input' / 'Available for Output' on each variable. Each variable's description shows up to the LLM as the parameter doc." },
        { kind: "callout", tone: "warn", text: "Screen Flows are not directly assignable as Topic actions. To pop a screen during a conversation, use the standard 'Show Screen Flow' action in Service Cloud." },
      ],
    },
    {
      kind: "setupChecklist",
      title: "Verify your action surfaces",
      items: [
        {
          id: "actions.invocable",
          label: "At least one @InvocableMethod Apex class",
          help: "Pulled from the metadata scanner.",
          verify: { kind: "scanner.path", path: "code.invocable", expect: { gte: 1 } },
        },
        {
          id: "actions.autolaunched",
          label: "At least one active autolaunched Flow",
          help: "Required for low-code agent actions.",
          verify: { kind: "scanner.path", path: "automation.types.AutoLaunchedFlow", expect: { gte: 1 } },
        },
        {
          id: "actions.with-sharing",
          label: "Apex actions reviewed for 'with sharing'",
          help: "Critical: agents inherit the runtime user's sharing context.",
          verify: { kind: "manual" },
        },
        {
          id: "actions.descriptions",
          label: "@InvocableVariable descriptions are written for the LLM",
          help: "Treat them like API docs the planner will read.",
          verify: { kind: "manual" },
        },
      ],
    },
  ],
  verify: {
    type: "evidence.review",
    explain: "At least one Apex or Flow action is ready to attach to a Topic.",
  },
};
