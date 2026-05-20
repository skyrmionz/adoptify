import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth";
import { upsertProgress } from "@/lib/progress";
import { queryOne } from "@/lib/db";

export const runtime = "nodejs";

type KnowledgeKind = "salesforce-knowledge" | "data-cloud";

type IngestBody = {
  sourceId?: string;
  missionId?: string;
  kind?: KnowledgeKind;
  result?: { ok: boolean; count?: number; sample?: string; dmoCount?: number; error?: string };
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

  if (!body.kind || !body.result) {
    return NextResponse.json({ error: "kind and result are required" }, { status: 400 });
  }
  const missionId = body.missionId ?? "pre-agent-setup.knowledge";

  const existing = await queryOne<{ evidence_json: { knowledgeSources?: unknown[] } }>(
    `SELECT evidence_json FROM mission_progress WHERE user_id = $1 AND mission_id = $2`,
    [user.id, missionId],
  );

  type Source = {
    id: string;
    kind: KnowledgeKind | "external";
    status: "unchecked" | "checking" | "ok" | "error";
    checkResult?: unknown;
  };

  const sources: Source[] = ((existing?.evidence_json?.knowledgeSources as Source[]) ?? []).slice();
  const target = body.sourceId
    ? sources.find((s) => s.id === body.sourceId)
    : sources.find((s) => s.kind === body.kind);

  if (target) {
    target.status = body.result.ok ? "ok" : "error";
    target.checkResult = body.result;
  } else {
    sources.push({
      id: body.sourceId ?? Math.random().toString(36).slice(2, 9),
      kind: body.kind,
      status: body.result.ok ? "ok" : "error",
      checkResult: body.result,
    });
  }

  await upsertProgress(user.id, missionId, {
    evidence: { knowledgeSources: sources },
  });

  return NextResponse.json({ ok: true });
}
