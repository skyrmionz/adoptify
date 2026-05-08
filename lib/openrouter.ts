// Minimal OpenRouter client. OpenAI-compatible Chat Completions with streaming + tool calling.

export type ToolDef = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[] }
  | { role: "tool"; tool_call_id: string; content: string };

export const DEFAULT_MODEL = process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-4.6";

export type StreamCallbacks = {
  onText?: (chunk: string) => void;
  onToolCallStart?: (id: string, name: string) => void;
  onToolCallArgsDelta?: (id: string, deltaJson: string) => void;
  onFinish?: (msg: ChatMessage) => void;
};

type StreamingDelta = {
  content?: string;
  tool_calls?: Array<{
    index: number;
    id?: string;
    type?: string;
    function?: { name?: string; arguments?: string };
  }>;
};

type StreamingChoice = {
  delta?: StreamingDelta;
  finish_reason?: string | null;
};

export async function streamCompletion(args: {
  model?: string;
  messages: ChatMessage[];
  tools?: ToolDef[];
  cb: StreamCallbacks;
  signal?: AbortSignal;
}): Promise<void> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
      "X-Title": "Adoptify",
    },
    body: JSON.stringify({
      model: args.model ?? DEFAULT_MODEL,
      messages: args.messages,
      tools: args.tools,
      tool_choice: args.tools && args.tools.length > 0 ? "auto" : undefined,
      stream: true,
    }),
    signal: args.signal,
  });
  if (!res.ok || !res.body) {
    const text = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }

  // Accumulators for the final assistant message.
  let textBuf = "";
  const callBufs = new Map<number, { id: string; name: string; arguments: string }>();

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") break;
      try {
        const json = JSON.parse(payload) as { choices?: StreamingChoice[] };
        const choice = json.choices?.[0];
        if (!choice) continue;
        const delta = choice.delta;
        if (delta?.content) {
          textBuf += delta.content;
          args.cb.onText?.(delta.content);
        }
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const existing = callBufs.get(tc.index) ?? { id: "", name: "", arguments: "" };
            if (tc.id) existing.id = tc.id;
            if (tc.function?.name) existing.name = tc.function.name;
            if (tc.function?.arguments) existing.arguments += tc.function.arguments;
            callBufs.set(tc.index, existing);
            if (tc.id && tc.function?.name) {
              args.cb.onToolCallStart?.(existing.id, existing.name);
            }
            if (tc.function?.arguments) {
              args.cb.onToolCallArgsDelta?.(existing.id, tc.function.arguments);
            }
          }
        }
      } catch {
        // skip malformed line
      }
    }
  }

  const toolCalls = Array.from(callBufs.values()).map((c) => ({
    id: c.id,
    type: "function" as const,
    function: { name: c.name, arguments: c.arguments || "{}" },
  }));

  const finalMsg: ChatMessage =
    toolCalls.length > 0
      ? { role: "assistant", content: textBuf || null, tool_calls: toolCalls }
      : { role: "assistant", content: textBuf };

  args.cb.onFinish?.(finalMsg);
}
