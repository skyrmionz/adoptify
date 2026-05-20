import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { deleteConnection, getConnectionForDisconnect, revokeConnectionToken } from "@/lib/salesforce";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body.connectionId !== "string") {
    return NextResponse.json({ error: "connectionId required" }, { status: 400 });
  }
  const conn = await getConnectionForDisconnect(user.id, body.connectionId);
  if (conn) await revokeConnectionToken(conn);
  await deleteConnection(user.id, body.connectionId);
  return NextResponse.json({ ok: true });
}
