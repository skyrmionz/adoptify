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
      kind: "coderPrompt",
      title: "Generate Apex and Flow actions with a coding agent",
      subtitle: "Skip the boilerplate. These prompts produce production-shaped @InvocableMethod classes and autolaunched Flows ready for Agentforce.",
      prompts: [
        {
          id: "apex.generate-action",
          title: "Generate an @InvocableMethod Apex action",
          goal: "Produce a typed, with-sharing Apex class that the planner can invoke as a tool.",
          tools: ["claude-code", "sf-cli"],
          prompt: `Generate a Salesforce Apex class for a new agent action in my DX project (force-app/main/default/classes/).

ACTION INTENT (1 sentence): \${WHAT_THE_ACTION_DOES}
INPUT FIELDS (name + type + description):
\${INPUT_FIELDS}
OUTPUT FIELDS (name + type + description):
\${OUTPUT_FIELDS}

Requirements:
- Use \`with sharing\`.
- Wrap inputs and outputs in inner Input/Output classes with @InvocableVariable. Every field has \`label\` and \`description\` — these become the LLM's parameter docs.
- Method signature: \`@InvocableMethod(label='...' description='...' callout=<true|false>) public static List<Output> <verbName>(List<Input> inputs)\`.
- Return List<Output> even if it always returns one item.
- Add a corresponding test class with at least one positive and one negative test (≥75% coverage).
- After generating, run: sf project deploy start --source-dir force-app --target-org \${ORG_ALIAS} --test-level RunSpecifiedTests --tests <YourTestClass>
- Confirm: sf data query --use-tooling-api --target-org \${ORG_ALIAS} --query "SELECT Id, Name FROM ApexClass WHERE Name = '<NewClassName>'"

Open a PR with the class, the test, and a short README block describing the action.`,
        },
        {
          id: "apex.modernize-existing",
          title: "Modernize an existing Apex method into an agent action",
          goal: "Wrap an existing Apex method as a typed @InvocableMethod without breaking callers.",
          tools: ["claude-code", "sf-cli"],
          prompt: `I have an existing Apex method I want to expose to Agentforce. Don't break its current callers.

EXISTING CLASS / METHOD: \${PATHS_OR_SNIPPET}

Steps:
1. Read the class. Identify the method's inputs/outputs and any side effects.
2. Add a sibling method named \`agentforceInvoke\` annotated with @InvocableMethod. Inputs/outputs are typed inner classes with @InvocableVariable.
3. agentforceInvoke calls the existing method internally — do not refactor the existing signature.
4. Confirm \`with sharing\`. If it isn't, add a callout in the PR description and ask whether to switch.
5. Add tests covering the wrapper.
6. Deploy: sf project deploy start --source-dir <path> --target-org \${ORG_ALIAS} --test-level RunSpecifiedTests --tests <TestClasses>
7. Open a PR with a "before / after" diff and a one-paragraph rationale.`,
        },
        {
          id: "flow.publish-autolaunched",
          title: "Publish an autolaunched Flow as an agent action",
          goal: "Take an existing autolaunched Flow and surface it to Agentforce.",
          tools: ["claude-code", "sf-cli"],
          prompt: `Open the autolaunched Flow at \${FLOW_PATH_OR_NAME}.

1. Verify ProcessType=AutoLaunchedFlow and Status=Active.
2. For every input variable: set isInput=true (and isOutput=true only when the agent should also read it back). Add a clear description (LLM reads this).
3. If the platform version supports it, mark the Flow Available for Agentforce.
4. Deploy: sf project deploy start --metadata Flow:<DeveloperName> --target-org \${ORG_ALIAS}
5. Confirm: sf data query --use-tooling-api --target-org \${ORG_ALIAS} --query "SELECT Id, MasterLabel, Status, ProcessType FROM Flow WHERE DeveloperName = '\${FLOW_NAME}'"
6. Optional: invoke from an agent topic and report the result.`,
        },
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
