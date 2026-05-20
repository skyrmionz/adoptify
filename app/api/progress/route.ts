import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getMissionById } from "@/content";
import { getProgress, upsertProgress } from "@/lib/progress";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const missionId = url.searchParams.get("missionId");
  if (!missionId) return NextResponse.json({ error: "missionId required" }, { status: 400 });
  const row = await getProgress(user.id, missionId);
  return NextResponse.json({
    status: row?.status ?? "not_started",
    completed_at: row?.completed_at ?? null,
    evidence: row?.evidence_json ?? {},
    updated_at: row?.updated_at ?? null,
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.missionId !== "string") {
    return NextResponse.json({ error: "missionId required" }, { status: 400 });
  }
  if (!getMissionById(body.missionId)) {
    return NextResponse.json({ error: "unknown mission" }, { status: 404 });
  }

  const evidence = (body.evidence && typeof body.evidence === "object") ? body.evidence as Record<string, unknown> : {};
  const completed = body.completed === true;

  const row = await upsertProgress(user.id, body.missionId, {
    completed,
    evidence,
  });
  return NextResponse.json({ ok: true, progress: row });
}
