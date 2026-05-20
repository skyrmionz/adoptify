import { createHash } from "node:crypto";
import { decryptFromBytes, encryptToBytes, randomToken } from "./crypto";
import { query, queryOne } from "./db";

const TOKEN_PREFIX = "adp_";

function hashToken(raw: string): Buffer {
  return createHash("sha256").update(raw, "utf8").digest();
}

export type ApiTokenRow = {
  user_id: string;
  last_four: string;
  created_at: string;
  last_used_at: string | null;
};

export type MintResult = {
  raw: string;
  lastFour: string;
};

export async function mintToken(userId: string): Promise<MintResult> {
  const raw = `${TOKEN_PREFIX}${randomToken(32)}`;
  const lastFour = raw.slice(-4);
  await query(
    `INSERT INTO api_tokens (user_id, token_hash, token_enc, last_four)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE SET
       token_hash   = EXCLUDED.token_hash,
       token_enc    = EXCLUDED.token_enc,
       last_four    = EXCLUDED.last_four,
       created_at   = NOW(),
       last_used_at = NULL`,
    [userId, hashToken(raw), encryptToBytes(raw), lastFour],
  );
  return { raw, lastFour };
}

export async function getTokenMeta(userId: string): Promise<ApiTokenRow | null> {
  return await queryOne<ApiTokenRow>(
    `SELECT user_id, last_four, created_at, last_used_at FROM api_tokens WHERE user_id = $1`,
    [userId],
  );
}

// Returns the raw token, minting one if none exists. Used when serving copy-prompt
// requests so the same token can be re-embedded into multiple prompts.
export async function getOrMintRawToken(userId: string): Promise<MintResult> {
  const row = await queryOne<{ token_enc: Buffer; last_four: string }>(
    `SELECT token_enc, last_four FROM api_tokens WHERE user_id = $1`,
    [userId],
  );
  if (row?.token_enc) {
    return { raw: decryptFromBytes(row.token_enc), lastFour: row.last_four };
  }
  return await mintToken(userId);
}

export async function findUserIdByToken(raw: string): Promise<string | null> {
  if (!raw.startsWith(TOKEN_PREFIX)) return null;
  const row = await queryOne<{ user_id: string }>(
    `UPDATE api_tokens SET last_used_at = NOW() WHERE token_hash = $1 RETURNING user_id`,
    [hashToken(raw)],
  );
  return row?.user_id ?? null;
}
