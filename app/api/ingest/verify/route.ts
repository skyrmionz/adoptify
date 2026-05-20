import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth";
import { upsertProgress } from "@/lib/progress";
import { queryOne } from "@/lib/db";

export const runtime = "nodejs";

type VerifyResult = {
  ok: boolean;
  count?: number;
  sample?: string;
  error?: string;
};

type IngestBody = {
  ruleId?: string;
  missionId?: string;
  stepId?: string;
  result?: VerifyResult;
};

export async function POST(req: Request) {
  const user = await getUserFromBearer(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: IngestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.ruleId || !body.missionId || !body.result) {
    return NextResponse.json(
      { error: "ruleId, missionId, and result are required" },
      { status: 400 },
    );
  }

  const existing = await queryOne<{ evidence_json: { setupChecks?: Record<string, VerifyResult> } }>(
    `SELECT evidence_json FROM mission_progress WHERE user_id = $1 AND mission_id = $2`,
    [user.id, body.missionId],
  );

  const setupChecks = existing?.evidence_json?.setupChecks ?? {};
  setupChecks[body.ruleId] = {
    ...body.result,
    ...{ verifiedAt: new Date().toISOString() },
  } as VerifyResult & { verifiedAt: string };

  await upsertProgress(user.id, body.missionId, {
    evidence: { setupChecks },
  });

  return NextResponse.json({ ok: true, ruleId: body.ruleId });
}
