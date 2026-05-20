import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getOrMintRawToken, getTokenMeta, mintToken } from "@/lib/api-tokens";

export const runtime = "nodejs";

// GET — return the *current* token, minting one on first read so the panel can
// show it. We can do this safely because the value is encrypted at rest with
// AUTH_SECRET, not just hashed.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { raw, lastFour } = await getOrMintRawToken(user.id);
  const meta = await getTokenMeta(user.id);
  return NextResponse.json({
    token: raw,
    lastFour,
    createdAt: meta?.created_at ?? null,
    lastUsedAt: meta?.last_used_at ?? null,
  });
}

// POST — rotate. Old token starts returning 401 immediately.
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const minted = await mintToken(user.id);
  return NextResponse.json({ token: minted.raw, lastFour: minted.lastFour });
}
