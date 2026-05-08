import { query, queryOne } from "./db";

export type ChatSession = {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at?: string;
};

export type ChatMessageRow = {
  id: string;
  session_id: string;
  role: "system" | "user" | "assistant" | "tool";
  content: unknown;
  created_at: string;
};

export async function listSessions(userId: string, limit = 50): Promise<(ChatSession & { last_message_at: string })[]> {
  return await query<ChatSession & { last_message_at: string }>(
    `SELECT s.id, s.user_id, s.title, s.created_at,
            COALESCE(MAX(m.created_at), s.created_at) AS last_message_at
     FROM chat_sessions s
     LEFT JOIN chat_messages m ON m.session_id = s.id
     WHERE s.user_id = $1
     GROUP BY s.id, s.user_id, s.title, s.created_at
     ORDER BY last_message_at DESC
     LIMIT $2`,
    [userId, limit],
  );
}

export async function getSession(userId: string, sessionId: string): Promise<ChatSession | null> {
  return await queryOne<ChatSession>(
    `SELECT id, user_id, title, created_at FROM chat_sessions WHERE id = $1 AND user_id = $2`,
    [sessionId, userId],
  );
}

export async function createSession(userId: string, title: string | null = null): Promise<ChatSession> {
  const row = await queryOne<ChatSession>(
    `INSERT INTO chat_sessions (user_id, title) VALUES ($1, $2)
     RETURNING id, user_id, title, created_at`,
    [userId, title],
  );
  if (!row) throw new Error("Failed to create chat session");
  return row;
}

export async function updateSessionTitle(userId: string, sessionId: string, title: string): Promise<void> {
  await query(
    `UPDATE chat_sessions SET title = $1 WHERE id = $2 AND user_id = $3`,
    [title.slice(0, 120), sessionId, userId],
  );
}

export async function deleteSession(userId: string, sessionId: string): Promise<void> {
  await query(`DELETE FROM chat_sessions WHERE id = $1 AND user_id = $2`, [sessionId, userId]);
}

export async function listMessages(sessionId: string): Promise<ChatMessageRow[]> {
  return await query<ChatMessageRow>(
    `SELECT id, session_id, role, content, created_at FROM chat_messages
     WHERE session_id = $1 ORDER BY created_at ASC`,
    [sessionId],
  );
}

export async function appendMessage(
  sessionId: string,
  role: ChatMessageRow["role"],
  content: unknown,
): Promise<void> {
  await query(
    `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3::jsonb)`,
    [sessionId, role, JSON.stringify(content)],
  );
}

export async function countMessages(sessionId: string): Promise<number> {
  const row = await queryOne<{ ct: number | string }>(
    `SELECT COUNT(*)::int AS ct FROM chat_messages WHERE session_id = $1`,
    [sessionId],
  );
  return row ? Number(row.ct) : 0;
}
