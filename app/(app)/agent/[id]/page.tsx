import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getSession } from "@/lib/chat-sessions";
import { Chat, NewConversationButton } from "@/components/agent/Chat";

export const runtime = "nodejs";

type Params = { id: string };

export default async function AgentSessionPage(props: { params: Promise<Params> }) {
  const { id } = await props.params;
  const user = await getSessionUser();
  if (!user) return null;
  const session = await getSession(user.id, id);
  if (!session) notFound();

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2 whitespace-nowrap">Conversation</div>
          <h1 className="text-3xl font-semibold tracking-tight truncate">{session.title ?? "Untitled conversation"}</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            Started {new Date(session.created_at).toLocaleString()}
          </p>
        </div>
        <NewConversationButton />
      </div>
      <Chat sessionId={id} />
    </>
  );
}
