import { Chat } from "@/components/agent/Chat";

export const runtime = "nodejs";

export default function AgentPage() {
  return (
    <>
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2">Conversation</div>
        <h1 className="text-3xl font-semibold tracking-tight">Agent</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">
          Your Agentforce specialist. Grounded in your missions, captured use cases, and the latest scan of your org.
        </p>
      </div>
      <Chat />
    </>
  );
}
