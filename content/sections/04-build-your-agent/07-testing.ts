import type { Mission } from "@/content/types";

export const testingAgent: Mission = {
  id: "build-your-agent.testing",
  slug: "testing-your-agent",
  number: 7,
  title: "Testing Your Agent",
  summary: "Use Conversation Preview and Testing Center to verify the agent before launch.",
  estMinutes: 25,
  steps: [
    {
      kind: "richContent",
      title: "Two testing modes, both essential",
      blocks: [
        { kind: "h", level: 3, text: "Conversation Preview" },
        { kind: "p", text: "Agent Builder includes a side panel that runs a real conversation against the current draft. You can see the planner's reasoning trace — which Topic it picked, which Actions it called, what it sent to the LLM, what the LLM said. Use this for fast manual iteration while you're designing." },
        { kind: "h", level: 3, text: "Testing Center" },
        { kind: "p", text: "Setup → Testing Center provides a structured test framework. You author Test Cases in YAML or via UI; each case has an utterance, expected Topic, expected Actions, and expected output. The framework runs them in batch and reports topic-match rate, action-match rate, output coherence, and latency." },
        { kind: "p", text: "The metadata is AiEvaluationDefinition + AiEvaluationTestSet. You can author with Agent Script DX and run via 'sf agent test run' — wire it into CI as a deploy gate." },
      ],
    },
    {
      kind: "richContent",
      title: "What to test",
      blocks: [
        { kind: "ul", items: [
          "The 'happy path' for each Topic — the user phrasings you designed for.",
          "Edge phrasings — synonyms, typos, abbreviations. The planner should still route correctly.",
          "Out-of-scope messages — agent should refuse politely, not hallucinate.",
          "Multi-turn — does the agent maintain context across follow-ups?",
          "Permission edge cases — what does the agent return when a record is hidden by sharing?",
          "Failure modes — what happens when an Action throws, times out, or returns no rows?",
        ] },
      ],
    },
    {
      kind: "coderPrompt",
      title: "Generate and run an Agentforce test suite",
      subtitle: "Agent Script DX includes 'sf agent test run'. Let a coding agent build the test set from your captured use cases and wire it into CI.",
      prompts: [
        {
          id: "test.generate-suite",
          title: "Generate AiEvaluationTestSet from use cases",
          goal: "Turn captured use cases into AiEvaluationDefinition + AiEvaluationTestSet committed to the repo.",
          tools: ["claude-code", "adlc", "sf-cli"],
          prompt: `Generate an Agentforce test suite for agent \${AGENT_NAME} on org \${ORG_ALIAS}.

INPUT — captured use cases (paste from Adoptify):
\${USE_CASES_JSON}

Steps:
1. For each use case, write 3 test cases: happy-path utterance, edge phrasing (synonym/typo/abbrev), and out-of-scope rephrasing the agent should refuse.
2. Each test case has: utterance, expectedTopic, expectedActions[], expectedOutputContains.
3. Save as YAML under force-app/main/default/aiEvaluationDefinitions/ and force-app/main/default/aiEvaluationTestSets/.
4. Deploy: sf project deploy start --source-dir force-app/main/default/aiEvaluationDefinitions --target-org \${ORG_ALIAS}
5. Run: sf agent test run --target-org \${ORG_ALIAS} --evaluation \${EvaluationDefName} --output-format json
6. Parse output: total cases, pass rate, list failures with utterance + expected vs. actual.
7. Open a PR with the YAML files. Description includes the pass-rate summary.

Optional: write a GitHub Actions workflow at .github/workflows/agent-tests.yml that runs the suite on every PR.`,
        },
      ],
    },
    {
      kind: "setupChecklist",
      title: "Testing checklist",
      items: [
        {
          id: "test.preview-run",
          label: "Ran 5+ representative conversations in Conversation Preview",
          verify: { kind: "manual" },
        },
        {
          id: "test.testing-center",
          label: "Test set defined in Testing Center",
          help: "Or YAML committed under aiEvaluationDefinitions/.",
          verify: { kind: "manual" },
        },
        {
          id: "test.cli",
          label: "Ran 'sf agent test run' at least once",
          help: "Confirms your test set executes via CLI.",
          verify: { kind: "manual" },
        },
        {
          id: "test.thresholds",
          label: "Pass/fail thresholds agreed (e.g. ≥90% topic-match, ≥85% action-match)",
          verify: { kind: "manual" },
        },
        {
          id: "test.regression",
          label: "Hallucination/safety baseline reviewed",
          help: "Trust Layer's toxicity detector + prompt defense scores logged per test run.",
          verify: { kind: "manual" },
        },
      ],
    },
  ],
  verify: {
    type: "evidence.review",
    explain: "Agent has been exercised in Preview and a structured test set exists.",
  },
};
