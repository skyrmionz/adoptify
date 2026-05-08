import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getLatestConnection, runVerifyCheck, type VerifyRule } from "@/lib/salesforce";
import { queryOne } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 30;

function readJsonPath(obj: unknown, path?: string): unknown {
  if (!path) return obj;
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { verify?: VerifyRule };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const rule = body.verify;
  if (!rule || typeof rule !== "object") {
    return NextResponse.json({ error: "verify rule required" }, { status: 400 });
  }

  // scanner.path resolves against the most recent org_assessment snapshot.
  if (rule.kind === "scanner.path") {
    const row = await queryOne<{ snapshot_json: unknown }>(
      `SELECT snapshot_json FROM org_assessments WHERE user_id = $1 ORDER BY scanned_at DESC LIMIT 1`,
      [user.id],
    );
    if (!row) {
      return NextResponse.json({ ok: false, error: "Run an org scan first to enable this check." });
    }
    const v = readJsonPath(row.snapshot_json, rule.path);
    if (rule.expect === "truthy") return NextResponse.json({ ok: !!v });
    if (typeof rule.expect === "object" && "gte" in rule.expect) {
      const num = typeof v === "number" ? v : 0;
      return NextResponse.json({ ok: num >= rule.expect.gte, count: num });
    }
    return NextResponse.json({ ok: false, error: "unsupported scanner.path expect" });
  }

  const conn = await getLatestConnection(user.id);
  if (!conn) {
    return NextResponse.json({ ok: false, error: "Connect a Salesforce org first." });
  }
  const result = await runVerifyCheck(conn, rule);
  return NextResponse.json(result);
}
