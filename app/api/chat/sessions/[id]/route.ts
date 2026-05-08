import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { deleteSession, getSession, listMessages } from "@/lib/chat-sessions";

export const runtime = "nodejs";

type Params = { id: string };

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { id } = await ctx.params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const session = await getSession(user.id, id);
  if (!session) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const messages = await listMessages(id);
  return NextResponse.json({ session, messages });
}

export async function DELETE(_req: Request, ctx: { params: Promise<Params> }) {
  const { id } = await ctx.params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await deleteSession(user.id, id);
  return NextResponse.json({ ok: true });
}
