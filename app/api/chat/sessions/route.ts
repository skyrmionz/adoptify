import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSession, listSessions } from "@/lib/chat-sessions";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const limit = Math.min(100, Number(url.searchParams.get("limit") ?? "50"));
  const sessions = await listSessions(user.id, limit);
  return NextResponse.json({ sessions });
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const session = await createSession(user.id);
  return NextResponse.json({ session });
}
