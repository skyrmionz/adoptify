import { cookies } from "next/headers";
import { query, queryOne } from "./db";
import { randomToken } from "./crypto";

const SESSION_COOKIE = "adoptify_session";
const SESSION_TTL_DAYS = 30;
const TOKEN_TTL_MINUTES = 15;

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
};

export async function getOrCreateUser(email: string): Promise<SessionUser> {
  const normalized = email.trim().toLowerCase();
  const existing = await queryOne<SessionUser>(
    `SELECT id, email, name FROM users WHERE email = $1`,
    [normalized],
  );
  if (existing) return existing;
  const created = await queryOne<SessionUser>(
    `INSERT INTO users (email) VALUES ($1) RETURNING id, email, name`,
    [normalized],
  );
  if (!created) throw new Error("Failed to create user");
  return created;
}

export async function issueMagicLinkToken(userId: string): Promise<string> {
  const token = randomToken(24);
  const expires = new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000);
  await query(
    `INSERT INTO auth_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)`,
    [token, userId, expires.toISOString()],
  );
  return token;
}

export async function consumeMagicLinkToken(token: string): Promise<string | null> {
  const row = await queryOne<{ user_id: string }>(
    `UPDATE auth_tokens
     SET consumed_at = NOW()
     WHERE token = $1 AND consumed_at IS NULL AND expires_at > NOW()
     RETURNING user_id`,
    [token],
  );
  return row?.user_id ?? null;
}

export async function createSession(userId: string): Promise<string> {
  const id = randomToken(32);
  const expires = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);
  await query(
    `INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)`,
    [id, userId, expires.toISOString()],
  );
  return id;
}

export async function setSessionCookie(sessionId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 86_400,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const row = await queryOne<SessionUser>(
    `SELECT u.id, u.email, u.name
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = $1 AND s.expires_at > NOW()`,
    [id],
  );
  return row ?? null;
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}

export async function destroySession(sessionId: string) {
  await query(`DELETE FROM sessions WHERE id = $1`, [sessionId]);
}
