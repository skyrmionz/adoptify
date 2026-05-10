import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getSelectedUseCase, selectUseCase } from "@/lib/diagnostic";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const selected = await getSelectedUseCase(user.id);
  return NextResponse.json({ selected });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.useCaseId || typeof body.useCaseId !== "string") {
    return NextResponse.json({ error: "useCaseId required" }, { status: 400 });
  }
  const selected = await selectUseCase(user.id, body.useCaseId);
  return NextResponse.json({ ok: true, selected });
}
