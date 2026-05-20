import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getLatestSnapshot } from "@/lib/snapshot-store";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const latest = await getLatestSnapshot(user.id);
  if (!latest) {
    return NextResponse.json({ snapshot: null, scanned_at: null, score: null, findings: [] });
  }
  return NextResponse.json({
    scanned_at: latest.scanned_at,
    score: latest.score,
    snapshot: latest.snapshot,
    findings: latest.findings,
    is_mock: false,
  });
}
