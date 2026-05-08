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
      kind: "coderPrompt",
      title: "Wire an external API as an agent action",
      subtitle: "Hand the OpenAPI spec to a coding agent. It registers the External Service and surfaces operations to Agentforce.",
      prompts: [
        {
          id: "api.register-external-service",
          title: "Register an External Service from OpenAPI",
          goal: "Create the Named Credential + External Service so API operations show up as agent actions.",
          tools: ["claude-code", "sf-cli", "metadata-api"],
          prompt: `Register an external API as an Agentforce action on org \${ORG_ALIAS}.

API NAME: \${API_NAME}
OPENAPI SPEC PATH: \${PATH_TO_OPENAPI_YAML}
AUTH TYPE: \${OAUTH2 | API_KEY_HEADER | JWT}
BASE URL: \${BASE_URL}

Steps:
1. Create a Named Credential matching \${AUTH_TYPE}. Generate Metadata XML under force-app/main/default/namedCredentials/ and force-app/main/default/externalCredentials/ as needed.
2. Validate the OpenAPI spec (must be 3.0). Trim down to the operations we want exposed (5–10 to start).
3. Deploy the credential: sf project deploy start --metadata "NamedCredential:\${API_NAME}" --target-org \${ORG_ALIAS}
4. Register the External Service. UI path: sf org open --target-org \${ORG_ALIAS} --path /lightning/setup/ExternalServices/home — paste the trimmed spec. Or script via Tooling API ExternalServiceRegistration.
5. Confirm: sf data query --use-tooling-api --target-org \${ORG_ALIAS} --query "SELECT Id, DeveloperName FROM ExternalServiceRegistration WHERE DeveloperName = '\${API_NAME}'"
6. List auto-generated GenAiFunctions: sf data query --use-tooling-api --target-org \${ORG_ALIAS} --query "SELECT Id, DeveloperName FROM GenAiFunction WHERE DeveloperName LIKE '%\${API_NAME}%'"
7. Run a smoke-test invocation and report the response or error.`,
          notes: "If the OpenAPI spec is large, ask the agent to limit the registration to 5-10 operations at first.",
        },
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
