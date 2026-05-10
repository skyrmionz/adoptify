import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDiagnostic, saveDiagnostic } from "@/lib/diagnostic";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const diagnostic = await getDiagnostic(user.id);
  return NextResponse.json({ diagnostic });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const diagnostic = await saveDiagnostic(user.id, body?.answers ?? body);
  return NextResponse.json({ ok: true, diagnostic });
}
