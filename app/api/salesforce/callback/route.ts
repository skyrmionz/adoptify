import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth";
import { exchangeCode, parseOrgIdFromIdentityUrl, saveConnection } from "@/lib/salesforce";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) return NextResponse.redirect(new URL(`/settings?sf_error=${encodeURIComponent(error)}`, url));
  if (!code || !state) return NextResponse.redirect(new URL("/settings?sf_error=missing_code", url));

  const jar = await cookies();
  const expected = jar.get("sf_oauth_state")?.value;
  if (!expected || expected !== state) {
    return NextResponse.redirect(new URL("/settings?sf_error=state_mismatch", url));
  }
  jar.delete("sf_oauth_state");

  try {
    const tok = await exchangeCode(code);
    const orgId = parseOrgIdFromIdentityUrl(tok.id);
    const isSandbox = tok.instance_url.includes(".sandbox.") || tok.instance_url.includes("--");
    await saveConnection({
      userId: user.id,
      accessToken: tok.access_token,
      refreshToken: tok.refresh_token,
      instanceUrl: tok.instance_url,
      orgId,
      orgName: new URL(tok.instance_url).hostname,
      isSandbox,
    });
    return NextResponse.redirect(new URL("/settings?sf_connected=1", url));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "exchange_failed";
    return NextResponse.redirect(new URL(`/settings?sf_error=${encodeURIComponent(msg)}`, url));
  }
}
