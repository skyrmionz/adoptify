import { NextResponse } from "next/server";
import { consumeMagicLinkToken, createSession, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", url));
  }
  const userId = await consumeMagicLinkToken(token);
  if (!userId) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", url));
  }
  const sessionId = await createSession(userId);
  await setSessionCookie(sessionId);
  return NextResponse.redirect(new URL("/missions", url));
}
