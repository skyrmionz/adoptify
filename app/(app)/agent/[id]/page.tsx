import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getSession } from "@/lib/chat-sessions";
import { Chat } from "@/components/agent/Chat";

export const runtime = "nodejs";

type Params = { id: string };

export default async function AgentSessionPage(props: { params: Promise<Params> }) {
  const { id } = await props.params;
  const user = await getSessionUser();
  if (!user) return null;
  const session = await getSession(user.id, id);
  if (!session) notFound();

  return (
    <div className="-mx-8 -my-10 h-[calc(100vh-3.5rem)] flex flex-col">
      <Chat sessionId={id} />
    </div>
  );
}
