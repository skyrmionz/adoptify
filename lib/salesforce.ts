import { decryptFromBytes, encryptToBytes } from "./crypto";
import { query, queryOne } from "./db";

export type SfConnectionRow = {
  id: string;
  user_id: string;
  instance_url: string;
  org_id: string;
  org_name: string | null;
  access_token_enc: Buffer;
  refresh_token_enc: Buffer | null;
  is_sandbox: boolean;
  last_scanned_at: string | null;
};

export type SfCredentials = {
  id: string;
  instanceUrl: string;
  accessToken: string;
  refreshToken: string | null;
  isSandbox: boolean;
  orgId: string;
  orgName: string | null;
};

export function loginUrl(isSandbox = false): string {
  if (process.env.SF_LOGIN_URL) return process.env.SF_LOGIN_URL;
  return isSandbox ? "https://test.salesforce.com" : "https://login.salesforce.com";
}

export function authorizeUrl(args: { state: string; isSandbox?: boolean }): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SF_CLIENT_ID ?? "",
    redirect_uri: process.env.SF_REDIRECT_URI ?? "",
    scope: "api refresh_token offline_access",
    state: args.state,
  });
  return `${loginUrl(args.isSandbox)}/services/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  instance_url: string;
  id: string; // identity URL containing org id + user id
}> {
  const res = await fetch(`${loginUrl()}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.SF_CLIENT_ID ?? "",
      client_secret: process.env.SF_CLIENT_SECRET ?? "",
      redirect_uri: process.env.SF_REDIRECT_URI ?? "",
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Salesforce token exchange failed: ${res.status} ${txt}`);
  }
  return await res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; instance_url: string }> {
  const res = await fetch(`${loginUrl()}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.SF_CLIENT_ID ?? "",
      client_secret: process.env.SF_CLIENT_SECRET ?? "",
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Salesforce refresh failed: ${res.status} ${txt}`);
  }
  return await res.json();
}

export function parseOrgIdFromIdentityUrl(idUrl: string): string {
  // Format: https://login.salesforce.com/id/<orgId>/<userId>
  const parts = idUrl.split("/");
  return parts[parts.length - 2] ?? "";
}

export async function saveConnection(args: {
  userId: string;
  accessToken: string;
  refreshToken: string;
  instanceUrl: string;
  orgId: string;
  orgName?: string | null;
  isSandbox: boolean;
}): Promise<string> {
  const access = encryptToBytes(args.accessToken);
  const refresh = encryptToBytes(args.refreshToken);
  const row = await queryOne<{ id: string }>(
    `INSERT INTO salesforce_connections (user_id, instance_url, org_id, org_name, access_token_enc, refresh_token_enc, is_sandbox)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, org_id) DO UPDATE SET
       instance_url = EXCLUDED.instance_url,
       org_name = COALESCE(EXCLUDED.org_name, salesforce_connections.org_name),
       access_token_enc = EXCLUDED.access_token_enc,
       refresh_token_enc = EXCLUDED.refresh_token_enc,
       is_sandbox = EXCLUDED.is_sandbox
     RETURNING id`,
    [args.userId, args.instanceUrl, args.orgId, args.orgName ?? null, access, refresh, args.isSandbox],
  );
  if (!row) throw new Error("Failed to save connection");
  return row.id;
}

export async function getLatestConnection(userId: string): Promise<SfCredentials | null> {
  const row = await queryOne<SfConnectionRow>(
    `SELECT id, user_id, instance_url, org_id, org_name, access_token_enc, refresh_token_enc, is_sandbox, last_scanned_at
     FROM salesforce_connections
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId],
  );
  if (!row) return null;
  return {
    id: row.id,
    instanceUrl: row.instance_url,
    orgId: row.org_id,
    orgName: row.org_name,
    isSandbox: row.is_sandbox,
    accessToken: decryptFromBytes(row.access_token_enc),
    refreshToken: row.refresh_token_enc ? decryptFromBytes(row.refresh_token_enc) : null,
  };
}

export async function deleteConnection(userId: string, connectionId: string) {
  await query(
    `DELETE FROM salesforce_connections WHERE user_id = $1 AND id = $2`,
    [userId, connectionId],
  );
}

export async function sfFetch(
  creds: SfCredentials,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${creds.instanceUrl}${path}`;
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${creds.accessToken}`);
  headers.set("Accept", "application/json");
  return await fetch(url, { ...init, headers });
}

export async function sfJson<T = unknown>(creds: SfCredentials, path: string, init?: RequestInit): Promise<T> {
  const res = await sfFetch(creds, path, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Salesforce ${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export const API_VERSION = "v62.0";

// --- Setup-check verifier ---------------------------------------
// Runs a single SetupCheckItem.verify rule against a connected org.
// Returns a normalized result the renderer can show.
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

function meetsExpect(count: number, expect: VerifyExpect): boolean {
  if (expect === "exists") return count > 0;
  return count >= (expect.minCount ?? 1);
}

function readJsonPath(obj: unknown, path?: string): unknown {
  if (!path) return obj;
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

export async function runVerifyCheck(creds: SfCredentials, rule: VerifyRule): Promise<VerifyResult> {
  try {
    if (rule.kind === "manual") return { ok: false, error: "Manual checks must be marked manually." };
    if (rule.kind === "tooling.soql" || rule.kind === "rest.soql") {
      const base = rule.kind === "tooling.soql"
        ? `/services/data/${API_VERSION}/tooling/query?q=`
        : `/services/data/${API_VERSION}/query?q=`;
      const r = await sfJson<{ totalSize: number; records: Array<Record<string, unknown>> }>(
        creds,
        base + encodeURIComponent(rule.soql),
      );
      const count = r.totalSize ?? r.records?.length ?? 0;
      const sampleRow = r.records?.[0];
      const sampleStr = sampleRow
        ? (sampleRow.Name as string | undefined) ?? (sampleRow.Label as string | undefined) ?? (sampleRow.DeveloperName as string | undefined)
        : undefined;
      const ok = meetsExpect(count, rule.expect);
      return { ok, count, sample: sampleStr ?? undefined };
    }
    if (rule.kind === "rest.path") {
      const r = await sfJson<unknown>(creds, rule.path);
      const v = readJsonPath(r, rule.jsonPath);
      if (rule.expect === "truthy") return { ok: !!v };
      if (rule.expect === "equals") return { ok: v === rule.value };
      return { ok: false, error: "unsupported expect" };
    }
    if (rule.kind === "scanner.path") {
      // scanner.path is resolved server-side in the route by passing the latest snapshot.
      return { ok: false, error: "scanner.path resolved by route" };
    }
    return { ok: false, error: "unsupported rule" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "verify_failed" };
  }
}

