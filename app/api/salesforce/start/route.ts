import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth";
import { authorizeUrl } from "@/lib/salesforce";
import { randomToken } from "@/lib/crypto";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const url = new URL(req.url);
  const isSandbox = url.searchParams.get("sandbox") === "1";
  const state = randomToken(16);

  const jar = await cookies();
  jar.set("sf_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(authorizeUrl({ state, isSandbox }));
}
