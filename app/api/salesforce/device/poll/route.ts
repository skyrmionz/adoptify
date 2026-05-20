import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  parseOrgIdFromIdentityUrl,
  pollDeviceToken,
  safeSalesforceError,
  saveConnection,
  type SfCredentials,
} from "@/lib/salesforce";
import { runScan } from "@/lib/metadata-scanner";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

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
    // Best-effort only.
  }
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { deviceCode?: string; sandbox?: boolean };
  if (!body.deviceCode) return NextResponse.json({ error: "missing_device_code" }, { status: 400 });
  const isSandbox = body.sandbox === true;

  try {
    const outcome = await pollDeviceToken(body.deviceCode, isSandbox);
    if (outcome.status !== "success") {
      return NextResponse.json({ status: outcome.status });
    }

    const orgId = parseOrgIdFromIdentityUrl(outcome.id);
    const connectionId = await saveConnection({
      userId: user.id,
      accessToken: outcome.access_token,
      refreshToken: outcome.refresh_token,
      instanceUrl: outcome.instance_url,
      orgId,
      orgName: new URL(outcome.instance_url).hostname,
      isSandbox,
      issuedAt: outcome.issued_at,
      expiresIn: outcome.expires_in,
    });

    await storeInitialScan(user.id, {
      id: connectionId,
      instanceUrl: outcome.instance_url,
      accessToken: outcome.access_token,
      refreshToken: outcome.refresh_token,
      accessTokenIssuedAt: outcome.issued_at ? new Date(Number(outcome.issued_at)).toISOString() : null,
      accessTokenExpiresAt: null,
      orgId,
      orgName: new URL(outcome.instance_url).hostname,
      isSandbox,
    });

    return NextResponse.json({ status: "success", connectionId });
  } catch (err) {
    return NextResponse.json({ status: "error", error: safeSalesforceError(err) }, { status: 502 });
  }
}
