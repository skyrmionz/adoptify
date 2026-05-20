import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { ensureRecommendations, getRecommendations } from "@/lib/diagnostic";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const existing = await getRecommendations(user.id);
  const recommendations = existing.length > 0 ? existing : await ensureRecommendations(user.id);
  return NextResponse.json({ recommendations });
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const recommendations = await ensureRecommendations(user.id);
  return NextResponse.json({ ok: true, recommendations });
}
