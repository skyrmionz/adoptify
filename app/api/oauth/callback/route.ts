import { handleOAuthCallback } from "@/lib/oauth-callback";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  return handleOAuthCallback(req);
}
