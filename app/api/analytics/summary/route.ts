import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export const runtime = "nodejs";

type Snapshot = {
  data?: { knowledge_articles?: number };
  agents?: { bots?: number; topics?: number; actions?: number };
  limits?: { daily_api_used?: number; daily_api_max?: number };
  code?: { invocable?: number; classes?: number };
  automation?: { flows_active?: number };
};

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const latest = await queryOne<{ score: number; scanned_at: string; snapshot_json: Snapshot }>(
    `SELECT score, scanned_at, snapshot_json
     FROM org_assessments WHERE user_id = $1 ORDER BY scanned_at DESC LIMIT 1`,
    [user.id],
  );

  // Synthetic 14-day series for now — real Agentforce telemetry connectors come later.
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  });
  const seedFromScore = (latest?.score ?? 35) / 100;
  const invocations = days.map((_, i) => Math.round(40 + 80 * seedFromScore + i * 6 + Math.sin(i / 2) * 12));
  const tokens = days.map((_, i) => Math.round(20_000 + 40_000 * seedFromScore + i * 1500 + Math.cos(i / 3) * 4000));
  const tools = days.map((_, i) => Math.round(8 + 20 * seedFromScore + i * 1.2 + Math.sin(i) * 3));

  return NextResponse.json({
    score: latest?.score ?? null,
    scanned_at: latest?.scanned_at ?? null,
    snapshot: latest?.snapshot_json ?? null,
    series: { days, invocations, tokens, tools },
  });
}
