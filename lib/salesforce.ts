// Adoptify no longer talks to Salesforce directly. The user's coding agent
// runs queries locally and POSTs results to /api/ingest/*. This file holds
// only the shared verification types so /api/ingest/verify and /content/types
// agree on the rule shape.

export class SalesforceApiError extends Error {
  constructor(message = "Salesforce request failed.") {
    super(message);
    this.name = "SalesforceApiError";
  }
}

type VerifyExpect = "exists" | { minCount: number };

export type VerifyRule =
  | { kind: "manual" }
  | { kind: "tooling.soql"; soql: string; expect: VerifyExpect }
  | { kind: "rest.soql"; soql: string; expect: VerifyExpect }
  | { kind: "rest.path"; path: string; jsonPath?: string; expect: "truthy" | "equals"; value?: unknown }
  | { kind: "scanner.path"; path: string; expect: "truthy" | { gte: number } };

export type VerifyResult = {
  ok: boolean;
  count?: number;
  sample?: string;
  error?: string;
};
