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
