import type { Mission } from "@/content/types";

export const apiActions: Mission = {
  id: "build-your-agent.api-actions",
  slug: "api-actions",
  number: 6,
  title: "API Actions (HTTP Callouts)",
  summary: "Expose third-party APIs to the agent using Named Credentials + External Services.",
  estMinutes: 20,
  steps: [
    {
      kind: "richContent",
      title: "The path: OpenAPI → Named Credential → Action",
      blocks: [
        { kind: "ol", items: [
          "Set up auth in Named Credentials (OAuth 2.0, JWT, or API Key in a header).",
          "Register your API in External Services from an OpenAPI 3.0 spec.",
          "Salesforce auto-generates Apex stubs and turns each operation into a GenAiFunction.",
          "Attach the function to a Topic in Agent Builder.",
        ] },
        { kind: "callout", tone: "info", text: "If your API doesn't have an OpenAPI spec, you can hand-write one for the operations you want to expose. It's faster than wrapping in Apex and gives the agent typed inputs/outputs." },
        { kind: "h", level: 3, text: "MuleSoft as an alternative" },
        { kind: "p", text: "If you already have APIs catalogued in Anypoint, MuleSoft Topic Center exposes them as agent actions through the MuleSoft for Agentforce connector — no manual OpenAPI work required." },
      ],
    },
    {
      kind: "setupChecklist",
      title: "Verify API plumbing",
      items: [
        {
          id: "api.named-cred",
          label: "At least one Named Credential",
          verify: { kind: "scanner.path", path: "integrations.named_credentials", expect: { gte: 1 } },
        },
        {
          id: "api.external-service",
          label: "At least one External Service registered",
          verify: { kind: "scanner.path", path: "integrations.external_services", expect: { gte: 1 } },
        },
        {
          id: "api.test-call",
          label: "Test call from Setup completes successfully",
          help: "Setup → External Services → Operations → Test.",
          verify: { kind: "manual" },
        },
        {
          id: "api.error-handling",
          label: "Error handling agreed on with the external API owner",
          help: "What happens on 4xx / 5xx? The agent needs a sensible fallback.",
          verify: { kind: "manual" },
        },
      ],
    },
  ],
  verify: {
    type: "evidence.review",
    explain: "Named Credential + External Service set up, or explicitly out of scope.",
  },
};
