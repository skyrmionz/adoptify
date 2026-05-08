import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getLatestConnection } from "@/lib/salesforce";
import { buildMockScan, runScan } from "@/lib/metadata-scanner";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const conn = await getLatestConnection(user.id);
  if (!conn) {
    // Mock-first: surface a plausible report even before OAuth so customers can see the UI.
    const mock = buildMockScan();
    return NextResponse.json(mock);
  }

  let result;
  try {
    result = await runScan(conn);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "scan_failed" }, { status: 500 });
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

  return NextResponse.json(result);
}
