import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getLatestConnection } from "@/lib/salesforce";
import { buildMockScan, runScan } from "@/lib/metadata-scanner";
import { query } from "@/lib/db";
import { queryOne } from "@/lib/db";
import { safeSalesforceError } from "@/lib/salesforce";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null) as { force?: boolean } | null;
  const force = body?.force === true;

  const conn = await getLatestConnection(user.id);
  if (!conn) {
    // Mock-first: surface a plausible report even before OAuth so customers can see the UI.
    const mock = buildMockScan();
    return NextResponse.json(mock);
  }

  if (!force) {
    const cached = await queryOne<{ scanned_at: string; snapshot_json: unknown; score: number; findings_json: unknown }>(
      `SELECT scanned_at, snapshot_json, score, findings_json
       FROM org_assessments
       WHERE user_id = $1 AND connection_id = $2 AND scanned_at > NOW() - INTERVAL '24 hours'
       ORDER BY scanned_at DESC LIMIT 1`,
      [user.id, conn.id],
    );
    if (cached) {
      return NextResponse.json({
        scanned_at: cached.scanned_at,
        is_mock: false,
        is_cached: true,
        score: cached.score,
        snapshot: cached.snapshot_json,
        findings: cached.findings_json,
      });
    }
  }

  let result;
  try {
    result = await runScan(conn);
  } catch (err) {
    return NextResponse.json({ error: safeSalesforceError(err) }, { status: 500 });
  }

  await query(
    `INSERT INTO org_assessments (connection_id, user_id, snapshot_json, score, findings_json)
     VALUES ($1, $2, $3::jsonb, $4, $5::jsonb)`,
    [conn.id, user.id, JSON.stringify(result.snapshot), result.score, JSON.stringify(result.findings)],
  );
  await query(
    `UPDATE salesforce_connections SET last_scanned_at = NOW() WHERE id = $1`,
    [conn.id],
  );

  return NextResponse.json({ ...result, is_cached: false });
}
