import { getSessionUser } from "@/lib/auth";
import { agentTools, executeTool } from "@/lib/agent-tools";
import { streamCompletion, ChatMessage } from "@/lib/openrouter";
import {
  appendMessage,
  countMessages,
  createSession,
  getSession,
  listMessages,
  updateSessionTitle,
} from "@/lib/chat-sessions";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Adoptify's embedded assistant — a senior Agentforce specialist.

You exist inside the Adoptify LMS. The user is working through a 5-chapter Agentforce adoption journey:
1. Pre-Agent Setup
2. Salesforce Setup & Licensing
3. Data & Knowledge Foundations
4. Build Your Agent
5. Channels & Launch

You have powerful tools. Use them aggressively to ground every answer in the user's actual setup:

- read_diagnostic / read_selected_use_case / read_activation_plan — to understand the Pocket FDE diagnostic, first-agent choice, blockers, and current ordered plan.
- list_missions / read_mission_content / read_mission_evidence — to know exactly where they are.
- read_org_snapshot / read_setup_checks / read_use_cases / read_knowledge_sources / read_action_inventory / read_prompt_drafts / read_channel_plan — to read everything Adoptify has captured.
- sf_query (read-only SOQL on tooling or rest API) and sf_describe — to inspect the user's actual Salesforce org metadata when answering specific config questions.
- mark_mission_complete / mark_mission_incomplete / mark_chapter_complete — to update progress when the user asks ("mark Knowledge done", "I already finished Setup elsewhere") or when their evidence clearly satisfies the verify rule.
- run_org_scan — to refresh the org assessment.
- navigate — whenever you recommend an action with a destination (open a mission, run a scan, go to Analytics), call this tool to surface a clickable chip in the chat.

Style:
- Be concise, concrete, and prescriptive. Cite specific objects, fields, flows, permission sets, mission ids.
- When you don't know, run a tool. Don't guess.
- If the user asks "what now" or "what should I build", first read the diagnostic, selected use case, and activation plan.
- After mutating state (mark_mission_*, run_org_scan), confirm in plain English what changed.
- Always emit a navigate chip alongside any "you should do X next" recommendation.
- Default to the user's connected org when they ask Salesforce-specific questions; if no org is connected, surface a navigate chip to /settings.`;

const TITLE_PROMPT = `Generate a 3-6 word title that summarizes this conversation. No quotes, no punctuation at the end. Just the title text.`;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | { sessionId?: string; message?: string }
    | null;
  if (!body?.message || typeof body.message !== "string") {
    return new Response(JSON.stringify({ error: "message required" }), { status: 400 });
  }

  // Load or create session.
  let session = body.sessionId ? await getSession(user.id, body.sessionId) : null;
  if (!session) {
    session = await createSession(user.id);
  }
  const sessionId = session.id;
  const wasNew = !session.title;

  // Build the message history from the DB.
  const history = await listMessages(sessionId);
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((h) => h.content as ChatMessage),
    { role: "user", content: body.message },
  ];

  // Persist the user turn immediately so a refresh picks it up.
  await appendMessage(sessionId, "user", { role: "user", content: body.message });

  // Set an immediate fallback title from the user's first message so the sidebar
  // shows something useful right away. The LLM-refined title overwrites this later.
  let fallbackTitle: string | null = null;
  if (wasNew) {
    const words = body.message.trim().split(/\s+/).slice(0, 8).join(" ");
    fallbackTitle = words.length > 60 ? words.slice(0, 57) + "…" : words;
    if (fallbackTitle) {
      await updateSessionTitle(user.id, sessionId, fallbackTitle);
    }
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      function emit(event: string, data: unknown) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }
      // Tell the client which session this turn belongs to (esp. when one was just created).
      emit("session", { sessionId });
      if (fallbackTitle) {
        emit("title", { title: fallbackTitle });
      }

      try {
        for (let i = 0; i < 8; i++) {
          const captured: { msg: ChatMessage | null } = { msg: null };
          await streamCompletion({
            messages,
            tools: agentTools,
            cb: {
              onText: (chunk) => emit("text", chunk),
              onToolCallStart: (id, name) => emit("tool_start", { id, name }),
              onToolCallArgsDelta: (id, delta) => emit("tool_args", { id, delta }),
              onFinish: (msg) => {
                captured.msg = msg;
              },
            },
          });
          const assistantMsg = captured.msg;
          if (!assistantMsg) break;
          messages.push(assistantMsg);
          await appendMessage(sessionId, "assistant", assistantMsg);

          const toolCalls = assistantMsg.role === "assistant" ? assistantMsg.tool_calls : undefined;
          if (!toolCalls || toolCalls.length === 0) break;

          for (const tc of toolCalls) {
            let parsedArgs: unknown = {};
            try {
              parsedArgs = JSON.parse(tc.function.arguments);
            } catch {
              /* leave empty */
            }
            const result = await executeTool(tc.function.name, parsedArgs, { userId: user.id });
            const resultText = JSON.stringify(result);
            emit("tool_result", { id: tc.id, name: tc.function.name, result });
            const toolMsg: ChatMessage = { role: "tool", tool_call_id: tc.id, content: resultText };
            messages.push(toolMsg);
            await appendMessage(sessionId, "tool", toolMsg);
          }
        }

        // Auto-title after the first exchange.
        if (wasNew) {
          try {
            const total = await countMessages(sessionId);
            if (total > 0) {
              const titleMessages: ChatMessage[] = [
                { role: "system", content: TITLE_PROMPT },
                { role: "user", content: `User said: ${body.message}\n\nReturn just the title.` },
              ];
              let titleBuf = "";
              await streamCompletion({
                messages: titleMessages,
                cb: { onText: (c) => { titleBuf += c; } },
              });
              const cleaned = titleBuf.replace(/["'\n]/g, "").trim().slice(0, 60);
              if (cleaned) {
                await updateSessionTitle(user.id, sessionId, cleaned);
                emit("title", { title: cleaned });
              }
            }
          } catch {
            /* best-effort */
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
