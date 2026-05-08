import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { listSessions } from "@/lib/chat-sessions";
import { NewConversationButton } from "@/components/agent/Chat";

export const runtime = "nodejs";

export default async function SessionsPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const sessions = await listSessions(user.id, 200);

  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2">Conversations</div>
          <h1 className="text-3xl font-semibold tracking-tight">All conversations</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">
            Pick one to resume, or start a new conversation.
          </p>
        </div>
        <NewConversationButton />
      </div>

      {sessions.length === 0 ? (
        <div className="surface-card p-8 text-center text-sm text-[var(--color-text-muted)]">
          No conversations yet. <Link className="text-[var(--color-accent)] underline" href="/agent">Start one</Link>.
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/agent/${s.id}`}
              className="surface-card p-4 flex items-center gap-4 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] transition group"
            >
              <div className="h-9 w-9 rounded-md bg-[var(--color-surface-2)] flex items-center justify-center shrink-0">
                <MessageCircle size={16} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-glow)]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{s.title ?? "Untitled conversation"}</div>
                <div className="text-xs text-[var(--color-text-subtle)] mt-0.5">
                  Last activity {new Date(s.last_message_at).toLocaleString()}
                </div>
              </div>
              <ArrowRight size={14} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-glow)] shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
