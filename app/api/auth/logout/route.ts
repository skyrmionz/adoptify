import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearSessionCookie, destroySession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const jar = await cookies();
  const id = jar.get("adoptify_session")?.value;
  if (id) await destroySession(id);
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
}
