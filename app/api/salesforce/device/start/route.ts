import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { requestDeviceCode, safeSalesforceError } from "@/lib/salesforce";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { sandbox?: boolean };
  const isSandbox = body.sandbox === true;

  try {
    const dc = await requestDeviceCode(isSandbox);
    return NextResponse.json({
      deviceCode: dc.device_code,
      userCode: dc.user_code,
      verificationUri: dc.verification_uri,
      interval: dc.interval,
      isSandbox,
    });
  } catch (err) {
    return NextResponse.json({ error: safeSalesforceError(err) }, { status: 502 });
  }
}
