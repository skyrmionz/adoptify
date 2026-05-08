import { query, queryOne } from "./db";

export type MissionProgressRow = {
  mission_id: string;
  status: string;
  completed_at: string | null;
  evidence_json: Record<string, unknown>;
  updated_at: string;
};

export async function getProgress(userId: string, missionId: string): Promise<MissionProgressRow | null> {
  return await queryOne<MissionProgressRow>(
    `SELECT mission_id, status, completed_at, evidence_json, updated_at
     FROM mission_progress WHERE user_id = $1 AND mission_id = $2`,
    [userId, missionId],
  );
}

export async function getAllProgress(userId: string): Promise<MissionProgressRow[]> {
  return await query<MissionProgressRow>(
    `SELECT mission_id, status, completed_at, evidence_json, updated_at
     FROM mission_progress WHERE user_id = $1`,
    [userId],
  );
}

export async function upsertProgress(
  userId: string,
  missionId: string,
  patch: { status?: string; completed?: boolean; evidence?: Record<string, unknown> },
): Promise<MissionProgressRow> {
  // We merge evidence_json on the DB side to avoid clobbering parallel writes for different keys.
  const evidence = patch.evidence ?? {};
  const status = patch.status ?? (patch.completed ? "completed" : "in_progress");
  const completedAt = patch.completed ? "NOW()" : "NULL";

  const sql = `
    INSERT INTO mission_progress (user_id, mission_id, status, completed_at, evidence_json, updated_at)
    VALUES ($1, $2, $3, ${completedAt}, $4::jsonb, NOW())
    ON CONFLICT (user_id, mission_id) DO UPDATE SET
      status = EXCLUDED.status,
      completed_at = COALESCE(EXCLUDED.completed_at, mission_progress.completed_at),
      evidence_json = mission_progress.evidence_json || EXCLUDED.evidence_json,
      updated_at = NOW()
    RETURNING mission_id, status, completed_at, evidence_json, updated_at
  `;
  const row = await queryOne<MissionProgressRow>(sql, [userId, missionId, status, JSON.stringify(evidence)]);
  if (!row) throw new Error("Failed to upsert progress");
  return row;
}
