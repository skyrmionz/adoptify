type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(args: SendArgs): Promise<{ ok: boolean; devMessage?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "Adoptify <onboarding@resend.dev>";

  if (!apiKey) {
    // Dev fallback — log the email so the magic link is recoverable without SMTP.
    console.log("[email:dev]", { to: args.to, subject: args.subject, html: args.html });
    return { ok: true, devMessage: "RESEND_API_KEY missing — link logged to server console" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
  return { ok: true };
}

export function magicLinkEmail(url: string): { subject: string; html: string; text: string } {
  const subject = "Your Adoptify sign-in link";
  const html = `
    <div style="background:#0B1220;color:#F4F7FB;font-family:system-ui,sans-serif;padding:40px;border-radius:12px;max-width:520px">
      <h1 style="font-size:22px;margin:0 0 12px">Sign in to Adoptify</h1>
      <p style="color:#97A3B6;line-height:1.55;margin:0 0 24px">
        Click below to finish signing in. This link expires in 15 minutes and can only be used once.
      </p>
      <a href="${url}" style="display:inline-block;background:#00A1E0;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600">Sign in</a>
      <p style="color:#5C6A85;font-size:12px;margin-top:24px">If you didn't request this, you can safely ignore it.</p>
    </div>
  `;
  const text = `Sign in to Adoptify: ${url}\n(expires in 15 minutes)`;
  return { subject, html, text };
}
