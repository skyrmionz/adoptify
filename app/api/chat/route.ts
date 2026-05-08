import { getSessionUser } from "@/lib/auth";
import { agentTools, executeTool } from "@/lib/agent-tools";
import { streamCompletion, ChatMessage } from "@/lib/openrouter";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Adoptify's embedded assistant — a senior Agentforce specialist who helps Salesforce customers adopt Agentforce successfully.

You can call tools to:
- list_missions: see what missions exist and where the user stands
- read_use_cases: read the use cases the user captured
- read_knowledge_sources: see the knowledge sources they've registered
- read_org_snapshot: read their latest Salesforce org scan with findings + score

Use these tools liberally to ground your answers in the user's actual setup. If they ask "what should I do next?", check missions and the org snapshot first. Be concise, concrete, and prescriptive — name specific objects, fields, flows, or permission sets when you can. If you can't tell from the data, say so and ask the user a single follow-up question.`;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

  const body = await req.json().catch(() => null) as { messages?: { role: string; content: string }[] } | null;
  if (!body?.messages || !Array.isArray(body.messages)) {
    return new Response(JSON.stringify({ error: "messages required" }), { status: 400 });
  }

  // Stream Server-Sent Events back to the client.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      function emit(event: string, data: unknown) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      const messages: ChatMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...(body.messages as ChatMessage[]),
      ];

      try {
        // Tool-calling loop. Cap iterations to prevent runaway loops.
        for (let i = 0; i < 6; i++) {
          const captured: { msg: ChatMessage | null } = { msg: null };
          await streamCompletion({
            messages,
            tools: agentTools,
            cb: {
              onText: (chunk) => emit("text", chunk),
              onToolCallStart: (id, name) => emit("tool_start", { id, name }),
              onToolCallArgsDelta: (id, delta) => emit("tool_args", { id, delta }),
              onFinish: (msg) => { captured.msg = msg; },
            },
          });
          const assistantMsg = captured.msg;
          if (!assistantMsg) break;
          messages.push(assistantMsg);
          const toolCalls = assistantMsg.role === "assistant" ? assistantMsg.tool_calls : undefined;
          if (!toolCalls || toolCalls.length === 0) break;

          for (const tc of toolCalls) {
            let parsedArgs: unknown = {};
            try { parsedArgs = JSON.parse(tc.function.arguments); } catch { /* leave empty */ }
            const result = await executeTool(tc.function.name, parsedArgs, { userId: user.id });
            const resultText = JSON.stringify(result);
            emit("tool_result", { id: tc.id, name: tc.function.name, result });
            messages.push({ role: "tool", tool_call_id: tc.id, content: resultText });
          }
        }
        emit("done", {});
      } catch (err) {
        emit("error", { message: err instanceof Error ? err.message : "stream_failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
