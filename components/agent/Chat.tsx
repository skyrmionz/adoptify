"use client";

import { useRef, useState } from "react";
import { Send, Wrench, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type DisplayMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; toolCalls: { id: string; name: string; result?: unknown }[] };

export function Chat() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    const userMsg: DisplayMessage = { role: "user", content: text };
    setMessages((m) => [...m, userMsg, { role: "assistant", content: "", toolCalls: [] }]);
    setStreaming(true);

    const apiMessages = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: text },
    ];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf("\n\n")) !== -1) {
          const block = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          handleEvent(block);
        }
      }
    } catch (err) {
      setMessages((m) => {
        const last = m[m.length - 1];
        if (last && last.role === "assistant") {
          return [...m.slice(0, -1), { ...last, content: last.content + `\n\n[error: ${err instanceof Error ? err.message : "failed"}]` }];
        }
        return m;
      });
    } finally {
      setStreaming(false);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }));
    }
  }

  function handleEvent(block: string) {
    const lines = block.split("\n");
    let event = "";
    let data = "";
    for (const l of lines) {
      if (l.startsWith("event:")) event = l.slice(6).trim();
      else if (l.startsWith("data:")) data = l.slice(5).trim();
    }
    if (!event) return;
    let payload: unknown = null;
    try { payload = JSON.parse(data); } catch { payload = data; }

    setMessages((m) => {
      const last = m[m.length - 1];
      if (!last || last.role !== "assistant") return m;

      if (event === "text") {
        return [...m.slice(0, -1), { ...last, content: last.content + (typeof payload === "string" ? payload : "") }];
      }
      if (event === "tool_start" && payload && typeof payload === "object") {
        const p = payload as { id: string; name: string };
        return [...m.slice(0, -1), { ...last, toolCalls: [...last.toolCalls, { id: p.id, name: p.name }] }];
      }
      if (event === "tool_result" && payload && typeof payload === "object") {
        const p = payload as { id: string; name: string; result: unknown };
        return [
          ...m.slice(0, -1),
          {
            ...last,
            toolCalls: last.toolCalls.map((tc) => (tc.id === p.id ? { ...tc, result: p.result } : tc)),
          },
        ];
      }
      return m;
    });
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }));
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2">
        {messages.length === 0 && <EmptyState onPick={(q) => setInput(q)} />}
        <div className="space-y-5 max-w-3xl">
          {messages.map((m, i) => (
            <Message key={i} m={m} streaming={streaming && i === messages.length - 1 && m.role === "assistant"} />
          ))}
        </div>
      </div>
      <div className="pt-4">
        <div className="surface-card p-2 flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask anything about your Agentforce adoption…"
            rows={1}
            className="flex-1 bg-transparent border-0 outline-none resize-none text-sm py-2 px-2 max-h-40 placeholder:text-[var(--color-text-subtle)]"
          />
          <button
            onClick={send}
            disabled={!input.trim() || streaming}
            className="h-10 px-4 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-40 text-white text-sm font-semibold inline-flex items-center gap-2"
          >
            {streaming ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function Message({ m, streaming }: { m: DisplayMessage; streaming: boolean }) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] surface-card px-4 py-3 bg-[var(--color-surface-2)] border-[var(--color-border-strong)]">
          <div className="text-sm whitespace-pre-wrap">{m.content}</div>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-2">
        <span className={cn("h-2 w-2 rounded-full bg-[var(--color-glow)]", streaming && "animate-pulse")} />
        Adoptify Agent
      </div>
      {m.toolCalls.map((tc) => (
        <details key={tc.id} className="surface-card mb-2 p-3 text-xs">
          <summary className="cursor-pointer flex items-center gap-2 text-[var(--color-text-muted)] select-none">
            <Wrench size={12} className="text-[var(--color-glow)]" />
            <span className="font-mono">{tc.name}</span>
            {tc.result === undefined ? <Loader2 size={12} className="animate-spin ml-1" /> : <span className="text-[var(--color-success)] ml-1">·</span>}
          </summary>
          {tc.result !== undefined && (
            <pre className="mt-2 text-[10px] overflow-x-auto p-2 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)]">
              {JSON.stringify(tc.result, null, 2)}
            </pre>
          )}
        </details>
      ))}
      {m.content && (
        <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
      )}
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  const suggestions = [
    "What use cases did I capture, and how do they map to my org?",
    "What's missing for me to launch my first agent?",
    "Summarize my latest org scan in 3 bullet points.",
  ];
  return (
    <div className="max-w-3xl">
      <div className="mb-4 text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)]">Try</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onPick(s)}
            className="surface-card p-4 text-left hover:border-[var(--color-border-strong)] transition"
          >
            <div className="text-sm">{s}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
