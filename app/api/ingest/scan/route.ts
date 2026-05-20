import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth";
import { saveScanIngest } from "@/lib/snapshot-store";
import type { ScanResult } from "@/lib/metadata-scanner";

export const runtime = "nodejs";
export const maxDuration = 60;

type IngestBody = {
  instanceUrl?: string;
  orgId?: string;
  orgName?: string | null;
  isSandbox?: boolean;
  result?: ScanResult;
};

function score(snapshot: ScanResult["snapshot"]): number {
  // Mirror lib/metadata-scanner scoring loosely so ingested scans get a number.
  // We deliberately recompute server-side rather than trusting the agent's value.
  const counts: number[] = [];
  if (snapshot.foundations?.custom_objects) counts.push(Math.min(snapshot.foundations.custom_objects, 30));
  if (snapshot.code?.classes) counts.push(Math.min(snapshot.code.classes, 50));
  if (snapshot.automation?.flows_active) counts.push(Math.min(snapshot.automation.flows_active * 2, 50));
  if (snapshot.access?.permission_sets) counts.push(Math.min(snapshot.access.permission_sets * 2, 40));
  const base = counts.reduce((a, b) => a + b, 0);
  return Math.min(100, Math.round(base / 2));
}

export async function POST(req: Request) {
  const user = await getUserFromBearer(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: IngestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.instanceUrl || !body.orgId || !body.result?.snapshot) {
    return NextResponse.json(
      { error: "instanceUrl, orgId, and result.snapshot are required" },
      { status: 400 },
    );
  }

  const result: ScanResult = {
    scanned_at: body.result.scanned_at ?? new Date().toISOString(),
    is_mock: false,
    score: body.result.score && body.result.score > 0 ? body.result.score : score(body.result.snapshot),
    byChapter: body.result.byChapter ?? [],
    snapshot: body.result.snapshot,
    findings: body.result.findings ?? [],
  };

  try {
    const { assessmentId } = await saveScanIngest({
      userId: user.id,
      orgId: body.orgId,
      instanceUrl: body.instanceUrl,
      orgName: body.orgName ?? null,
      isSandbox: body.isSandbox === true,
      result,
    });
    return NextResponse.json({
      ok: true,
      assessmentId,
      scannedAt: result.scanned_at,
      score: result.score,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "ingest_failed" },
      { status: 500 },
    );
  }
}
