import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "./auth";
import { exchangeCode, parseOrgIdFromIdentityUrl, safeSalesforceError, saveConnection, type SfCredentials } from "./salesforce";
import { runScan } from "./metadata-scanner";
import { query } from "./db";

function appRedirect(path: string): URL {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return new URL(path, base.replace(/\/$/, ""));
}

async function storeInitialScan(userId: string, conn: SfCredentials) {
  try {
    const result = await runScan(conn);
    await query(
      `INSERT INTO org_assessments (connection_id, user_id, snapshot_json, score, findings_json)
       VALUES ($1, $2, $3::jsonb, $4, $5::jsonb)`,
      [conn.id, userId, JSON.stringify(result.snapshot), result.score, JSON.stringify(result.findings)],
    );
    await query(`UPDATE salesforce_connections SET last_scanned_at = NOW() WHERE id = $1`, [conn.id]);
  } catch {
    // Best-effort only. The user can manually scan after connection.
  }
}

export async function handleOAuthCallback(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(appRedirect("/login"));

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(appRedirect("/settings?sf_error=salesforce_authorization_failed"));
  }
  if (!code || !state) {
    return NextResponse.redirect(appRedirect("/settings?sf_error=missing_code"));
  }

  const jar = await cookies();
  const expected = jar.get("sf_oauth_state")?.value;
  const isSandbox = jar.get("sf_oauth_is_sandbox")?.value === "1";
  if (!expected || expected !== state) {
    return NextResponse.redirect(appRedirect("/settings?sf_error=state_mismatch"));
  }
  jar.delete("sf_oauth_state");
  jar.delete("sf_oauth_is_sandbox");

  try {
    const tok = await exchangeCode(code, isSandbox);
    const orgId = parseOrgIdFromIdentityUrl(tok.id);
    const connectionId = await saveConnection({
      userId: user.id,
      accessToken: tok.access_token,
      refreshToken: tok.refresh_token,
      instanceUrl: tok.instance_url,
      orgId,
      orgName: new URL(tok.instance_url).hostname,
      isSandbox,
      issuedAt: tok.issued_at,
      expiresIn: tok.expires_in,
    });
    await storeInitialScan(user.id, {
      id: connectionId,
      instanceUrl: tok.instance_url,
      accessToken: tok.access_token,
      refreshToken: tok.refresh_token,
      accessTokenIssuedAt: tok.issued_at ? new Date(Number(tok.issued_at)).toISOString() : null,
      accessTokenExpiresAt: null,
      orgId,
      orgName: new URL(tok.instance_url).hostname,
      isSandbox,
    });
    return NextResponse.redirect(appRedirect("/settings?sf_connected=1"));
  } catch (err) {
    const message = encodeURIComponent(safeSalesforceError(err));
    return NextResponse.redirect(appRedirect(`/settings?sf_error=${message}`));
  }
}
