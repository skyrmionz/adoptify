import { Chat } from "@/components/agent/Chat";

export const runtime = "nodejs";

export default function AgentPage() {
  return (
    <div className="-mx-8 -my-10 h-[calc(100vh-3.5rem)] flex flex-col">
      <Chat />
    </div>
  );
}
