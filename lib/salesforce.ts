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
  access_token_issued_at: string | null;
  access_token_expires_at: string | null;
  disconnected_at: string | null;
  is_sandbox: boolean;
  last_scanned_at: string | null;
};

export type SfCredentials = {
  id: string;
  instanceUrl: string;
  accessToken: string;
  refreshToken: string | null;
  accessTokenIssuedAt: string | null;
  accessTokenExpiresAt: string | null;
  isSandbox: boolean;
  orgId: string;
  orgName: string | null;
};

export class SalesforceConnectionExpiredError extends Error {
  constructor() {
    super("Your org connection has expired — reconnect to continue.");
    this.name = "SalesforceConnectionExpiredError";
  }
}

export class SalesforceApiError extends Error {
  constructor(message = "Salesforce request failed. Check your org connection and try again.") {
    super(message);
    this.name = "SalesforceApiError";
  }
}

export function safeSalesforceError(err: unknown): string {
  if (err instanceof SalesforceConnectionExpiredError) return err.message;
  if (err instanceof SalesforceApiError) return err.message;
  return "Salesforce request failed. Check your org connection and try again.";
}

export function loginUrl(isSandbox = false, allowEnvOverride = true): string {
  if (allowEnvOverride && process.env.SF_LOGIN_URL) return process.env.SF_LOGIN_URL;
  return isSandbox ? "https://test.salesforce.com" : "https://login.salesforce.com";
}

// Use the same public client id the Salesforce CLI uses for `sf org login device`.
// This means Adoptify needs no Connected App of its own and no env vars for Salesforce auth.
// SF_CLIENT_ID can still be set to override (e.g. with a custom Connected App).
const DEFAULT_CLIENT_ID = "PlatformCLI";

function clientId(): string {
  return process.env.SF_CLIENT_ID?.trim() || DEFAULT_CLIENT_ID;
}

function tokenEndpoint(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/services/oauth2/token`;
}

function revokeEndpoint(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/services/oauth2/revoke`;
}

function issuedAtToIso(issuedAt?: string): string | null {
  if (!issuedAt) return null;
  const n = Number(issuedAt);
  return Number.isFinite(n) ? new Date(n).toISOString() : null;
}

function expiresAtFromNow(expiresIn?: number): string | null {
  if (!expiresIn || !Number.isFinite(expiresIn)) return null;
  return new Date(Date.now() + Math.max(0, expiresIn - 60) * 1000).toISOString();
}

export type DeviceCodeResponse = {
  device_code: string;
  user_code: string;
  verification_uri: string;
  interval: number;
};

export async function requestDeviceCode(isSandbox: boolean): Promise<DeviceCodeResponse> {
  const res = await fetch(tokenEndpoint(loginUrl(isSandbox, false)), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      response_type: "device_code",
      client_id: clientId(),
      scope: "api refresh_token openid",
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new SalesforceApiError(
      text.includes("unsupported_response_type")
        ? "Salesforce rejected the device flow request. The org may block this login method."
        : "Could not start Salesforce login. Try again in a moment.",
    );
  }
  return await res.json();
}

export type DevicePollOutcome =
  | { status: "pending" }
  | { status: "slow_down" }
  | { status: "denied" }
  | { status: "expired" }
  | {
      status: "success";
      access_token: string;
      refresh_token: string;
      instance_url: string;
      id: string;
      issued_at?: string;
      expires_in?: number;
    };

export async function pollDeviceToken(deviceCode: string, isSandbox: boolean): Promise<DevicePollOutcome> {
  const res = await fetch(tokenEndpoint(loginUrl(isSandbox, false)), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "device",
      client_id: clientId(),
      code: deviceCode,
    }),
  });
  if (res.ok) {
    const json = await res.json();
    return { status: "success", ...json };
  }
  const errJson = (await res.json().catch(() => null)) as { error?: string } | null;
  switch (errJson?.error) {
    case "authorization_pending":
      return { status: "pending" };
    case "slow_down":
      return { status: "slow_down" };
    case "access_denied":
      return { status: "denied" };
    case "expired_token":
      return { status: "expired" };
    default:
      throw new SalesforceApiError("Salesforce login failed. Start over and try again.");
  }
}

export async function refreshAccessToken(baseUrl: string, refreshToken: string): Promise<{ access_token: string; instance_url?: string; issued_at?: string; expires_in?: number }> {
  const res = await fetch(tokenEndpoint(baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId(),
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (text.includes("invalid_grant")) throw new SalesforceConnectionExpiredError();
    throw new SalesforceApiError("Salesforce session refresh failed. Reconnect your org and try again.");
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
  issuedAt?: string;
  expiresIn?: number;
}): Promise<string> {
  const access = encryptToBytes(args.accessToken);
  const refresh = encryptToBytes(args.refreshToken);
  const issuedAt = issuedAtToIso(args.issuedAt);
  const expiresAt = expiresAtFromNow(args.expiresIn);
  const row = await queryOne<{ id: string }>(
    `INSERT INTO salesforce_connections
       (user_id, instance_url, org_id, org_name, access_token_enc, refresh_token_enc, access_token_issued_at, access_token_expires_at, disconnected_at, is_sandbox)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL, $9)
     ON CONFLICT (user_id, org_id) DO UPDATE SET
       instance_url = EXCLUDED.instance_url,
       org_name = COALESCE(EXCLUDED.org_name, salesforce_connections.org_name),
       access_token_enc = EXCLUDED.access_token_enc,
       refresh_token_enc = EXCLUDED.refresh_token_enc,
       access_token_issued_at = EXCLUDED.access_token_issued_at,
       access_token_expires_at = EXCLUDED.access_token_expires_at,
       disconnected_at = NULL,
       is_sandbox = EXCLUDED.is_sandbox
     RETURNING id`,
    [args.userId, args.instanceUrl, args.orgId, args.orgName ?? null, access, refresh, issuedAt, expiresAt, args.isSandbox],
  );
  if (!row) throw new Error("Failed to save connection");
  return row.id;
}

export async function getLatestConnection(userId: string): Promise<SfCredentials | null> {
  const row = await queryOne<SfConnectionRow>(
    `SELECT id, user_id, instance_url, org_id, org_name, access_token_enc, refresh_token_enc,
            access_token_issued_at, access_token_expires_at, disconnected_at, is_sandbox, last_scanned_at
     FROM salesforce_connections
     WHERE user_id = $1 AND disconnected_at IS NULL
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
    accessTokenIssuedAt: row.access_token_issued_at,
    accessTokenExpiresAt: row.access_token_expires_at,
  };
}

export async function deleteConnection(userId: string, connectionId: string) {
  await query(
    `DELETE FROM salesforce_connections WHERE user_id = $1 AND id = $2`,
    [userId, connectionId],
  );
}

export async function getConnectionForDisconnect(userId: string, connectionId: string): Promise<SfCredentials | null> {
  const row = await queryOne<SfConnectionRow>(
    `SELECT id, user_id, instance_url, org_id, org_name, access_token_enc, refresh_token_enc,
            access_token_issued_at, access_token_expires_at, disconnected_at, is_sandbox, last_scanned_at
     FROM salesforce_connections WHERE user_id = $1 AND id = $2`,
    [userId, connectionId],
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
    accessTokenIssuedAt: row.access_token_issued_at,
    accessTokenExpiresAt: row.access_token_expires_at,
  };
}

async function updateAccessToken(connectionId: string, token: { access_token: string; instance_url?: string; issued_at?: string; expires_in?: number }) {
  await query(
    `UPDATE salesforce_connections
     SET access_token_enc = $1,
         instance_url = COALESCE($2, instance_url),
         access_token_issued_at = $3,
         access_token_expires_at = $4,
         disconnected_at = NULL
     WHERE id = $5`,
    [
      encryptToBytes(token.access_token),
      token.instance_url ?? null,
      issuedAtToIso(token.issued_at),
      expiresAtFromNow(token.expires_in),
      connectionId,
    ],
  );
}

async function markConnectionExpired(connectionId: string) {
  await query(`UPDATE salesforce_connections SET disconnected_at = NOW() WHERE id = $1`, [connectionId]);
}

function shouldRefreshBeforeCall(creds: SfCredentials): boolean {
  if (!creds.refreshToken || !creds.accessTokenExpiresAt) return false;
  return new Date(creds.accessTokenExpiresAt).getTime() <= Date.now() + 60_000;
}

async function refreshConnection(creds: SfCredentials): Promise<SfCredentials> {
  if (!creds.refreshToken) throw new SalesforceConnectionExpiredError();
  try {
    const token = await refreshAccessToken(creds.instanceUrl, creds.refreshToken);
    await updateAccessToken(creds.id, token);
    return {
      ...creds,
      accessToken: token.access_token,
      instanceUrl: token.instance_url ?? creds.instanceUrl,
      accessTokenIssuedAt: issuedAtToIso(token.issued_at),
      accessTokenExpiresAt: expiresAtFromNow(token.expires_in),
    };
  } catch (err) {
    if (err instanceof SalesforceConnectionExpiredError) await markConnectionExpired(creds.id);
    throw err;
  }
}

export async function revokeConnectionToken(creds: SfCredentials): Promise<void> {
  const token = creds.refreshToken ?? creds.accessToken;
  if (!token) return;
  await fetch(revokeEndpoint(creds.instanceUrl), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }),
  }).catch(() => undefined);
}

export async function sfFetch(
  creds: SfCredentials,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  let activeCreds = creds;
  if (shouldRefreshBeforeCall(activeCreds)) activeCreds = await refreshConnection(activeCreds);
  const makeRequest = async (c: SfCredentials) => {
    const url = path.startsWith("http") ? path : `${c.instanceUrl}${path}`;
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${c.accessToken}`);
    headers.set("Accept", "application/json");
    return await fetch(url, { ...init, headers });
  };
  let res = await makeRequest(activeCreds);
  if (res.status === 401 && activeCreds.refreshToken) {
    activeCreds = await refreshConnection(activeCreds);
    res = await makeRequest(activeCreds);
  }
  return res;
}

export async function sfJson<T = unknown>(creds: SfCredentials, path: string, init?: RequestInit): Promise<T> {
  const res = await sfFetch(creds, path, init);
  if (!res.ok) {
    if (res.status === 401) {
      await markConnectionExpired(creds.id);
      throw new SalesforceConnectionExpiredError();
    }
    throw new SalesforceApiError();
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
