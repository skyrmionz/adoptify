import { NextResponse } from "next/server";
import { getOrCreateUser, issueMagicLinkToken } from "@/lib/auth";
import { magicLinkEmail, sendEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let email: string | undefined;
  try {
    const body = await req.json();
    email = typeof body?.email === "string" ? body.email : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!email || !/.+@.+\..+/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const user = await getOrCreateUser(email);
  const token = await issueMagicLinkToken(user.id);
  const appUrl = process.env.APP_URL ?? new URL(req.url).origin;
  const verifyUrl = `${appUrl}/login/verify?token=${encodeURIComponent(token)}`;

  const { subject, html, text } = magicLinkEmail(verifyUrl);
  const result = await sendEmail({ to: user.email, subject, html, text });

  return NextResponse.json({
    ok: true,
    // In dev (no Resend key), surface the link so the developer can click it.
    devLink: result.devMessage ? verifyUrl : undefined,
  });
}
