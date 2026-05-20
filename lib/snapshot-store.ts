import type { Snapshot, ScanResult } from "./metadata-scanner";
import { query, queryOne } from "./db";

export type StoredAssessment = {
  scanned_at: string;
  score: number;
  snapshot: Snapshot;
  findings: ScanResult["findings"];
};

export async function getLatestSnapshot(userId: string): Promise<StoredAssessment | null> {
  const row = await queryOne<{
    scanned_at: string;
    score: number;
    snapshot_json: Snapshot;
    findings_json: ScanResult["findings"];
  }>(
    `SELECT scanned_at, score, snapshot_json, findings_json
     FROM org_assessments WHERE user_id = $1 ORDER BY scanned_at DESC LIMIT 1`,
    [userId],
  );
  if (!row) return null;
  return {
    scanned_at: row.scanned_at,
    score: row.score,
    snapshot: row.snapshot_json,
    findings: row.findings_json ?? [],
  };
}

export async function saveScanIngest(args: {
  userId: string;
  orgId: string;
  instanceUrl: string;
  orgName: string | null;
  isSandbox: boolean;
  result: ScanResult;
}): Promise<{ assessmentId: string; connectionId: string }> {
  const conn = await queryOne<{ id: string }>(
    `INSERT INTO salesforce_connections (user_id, instance_url, org_id, org_name, is_sandbox, last_scanned_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (user_id, org_id) DO UPDATE SET
       instance_url    = EXCLUDED.instance_url,
       org_name        = COALESCE(EXCLUDED.org_name, salesforce_connections.org_name),
       is_sandbox      = EXCLUDED.is_sandbox,
       last_scanned_at = NOW()
     RETURNING id`,
    [args.userId, args.instanceUrl, args.orgId, args.orgName, args.isSandbox],
  );
  if (!conn) throw new Error("Failed to upsert salesforce_connection");
  const assessment = await queryOne<{ id: string }>(
    `INSERT INTO org_assessments (connection_id, user_id, snapshot_json, score, findings_json)
     VALUES ($1, $2, $3::jsonb, $4, $5::jsonb) RETURNING id`,
    [
      conn.id,
      args.userId,
      JSON.stringify(args.result.snapshot),
      args.result.score,
      JSON.stringify(args.result.findings ?? []),
    ],
  );
  if (!assessment) throw new Error("Failed to insert org_assessment");
  return { assessmentId: assessment.id, connectionId: conn.id };
}

export async function getKnownConnections(userId: string) {
  return await query<{
    id: string;
    instance_url: string;
    org_name: string | null;
    is_sandbox: boolean;
    last_scanned_at: string | null;
    created_at: string;
  }>(
    `SELECT id, instance_url, org_name, is_sandbox, last_scanned_at, created_at
     FROM salesforce_connections WHERE user_id = $1 ORDER BY last_scanned_at DESC NULLS LAST, created_at DESC`,
    [userId],
  );
}
