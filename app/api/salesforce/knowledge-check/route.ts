import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { API_VERSION, getLatestConnection, sfJson } from "@/lib/salesforce";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const conn = await getLatestConnection(user.id);
  if (!conn) return NextResponse.json({ error: "Connect a Salesforce org first" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const kind = body?.kind as string | undefined;

  try {
    if (kind === "salesforce-knowledge") {
      const r = await sfJson<{ totalSize: number; records: { Title?: string }[] }>(
        conn,
        `/services/data/${API_VERSION}/query?q=${encodeURIComponent("SELECT Title FROM Knowledge__kav WHERE PublishStatus = 'Online' LIMIT 1")}`,
      );
      return NextResponse.json({ count: r.totalSize, sample: r.records[0]?.Title });
    }
    if (kind === "data-cloud") {
      const r = await sfJson<{ totalSize: number }>(
        conn,
        `/services/data/${API_VERSION}/tooling/query?q=${encodeURIComponent("SELECT Id FROM MktDataModelObject")}`,
      );
      return NextResponse.json({ dmoCount: r.totalSize });
    }
    return NextResponse.json({ error: "unknown kind" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "check_failed" }, { status: 500 });
  }
}
