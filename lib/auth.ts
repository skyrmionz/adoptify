import { cookies } from "next/headers";
import { query, queryOne } from "./db";
import { randomToken } from "./crypto";
import { hashPassword, verifyPassword } from "./passwords";
import { findUserIdByToken } from "./api-tokens";

const SESSION_COOKIE = "adoptify_session";
const SESSION_TTL_DAYS = 30;

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
};

type UserRow = SessionUser & { password_hash: Buffer | null };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  return await queryOne<UserRow>(
    `SELECT id, email, name, password_hash FROM users WHERE email = $1`,
    [normalizeEmail(email)],
  );
}

export async function createUserWithPassword(args: {
  email: string;
  password: string;
  name?: string | null;
}): Promise<SessionUser> {
  const email = normalizeEmail(args.email);
  const hash = await hashPassword(args.password);
  // Upsert: if a passwordless row exists (left over from older auth flows),
  // claim it by setting the password. If a row already has a password, reject.
  const row = await queryOne<SessionUser>(
    `INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       name = COALESCE(EXCLUDED.name, users.name)
     WHERE users.password_hash IS NULL
     RETURNING id, email, name`,
    [email, args.name ?? null, hash],
  );
  if (!row) throw new Error("Failed to create user");
  return row;
}

export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  const row = await findUserByEmail(email);
  if (!row || !row.password_hash) return null;
  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) return null;
  return { id: row.id, email: row.email, name: row.name };
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

export async function getUserFromBearer(req: Request): Promise<SessionUser | null> {
  const auth = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!auth) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(auth);
  if (!match) return null;
  const userId = await findUserIdByToken(match[1]);
  if (!userId) return null;
  return await queryOne<SessionUser>(
    `SELECT id, email, name FROM users WHERE id = $1`,
    [userId],
  );
}

export async function getUserFromBearerOrSession(req: Request): Promise<SessionUser | null> {
  const fromBearer = await getUserFromBearer(req);
  if (fromBearer) return fromBearer;
  return await getSessionUser();
}
