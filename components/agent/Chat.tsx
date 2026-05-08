"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Plus, Send, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

type ChipPayload = { id: string; label: string; url: string; rationale?: string };

type DisplayMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; toolCalls: { id: string; name: string; result?: unknown }[]; chips: ChipPayload[] };

type StoredMessage = { role: "user" | "assistant" | "tool" | "system"; content: unknown; tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }>; tool_call_id?: string };

function isAppRelative(url: string): boolean {
  return url.startsWith("/");
}

export function Chat({ sessionId: initialSessionId }: { sessionId?: string }) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(!!initialSessionId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialSessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/chat/sessions/${initialSessionId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { messages?: { content: StoredMessage }[] };
        if (cancelled) return;
        const restored: DisplayMessage[] = [];
        const toolResultsByCallId = new Map<string, unknown>();
        for (const m of data.messages ?? []) {
          const stored = m.content;
          if (stored?.role === "tool" && stored.tool_call_id) {
            try { toolResultsByCallId.set(stored.tool_call_id, JSON.parse(String(stored.content))); }
            catch { toolResultsByCallId.set(stored.tool_call_id, stored.content); }
          }
        }
        for (const m of data.messages ?? []) {
          const stored = m.content;
          if (!stored) continue;
          if (stored.role === "user") {
            restored.push({ role: "user", content: String(stored.content ?? "") });
          } else if (stored.role === "assistant") {
            const text = typeof stored.content === "string" ? stored.content : "";
            const toolCalls = (stored.tool_calls ?? []).map((tc) => ({
              id: tc.id,
              name: tc.function.name,
              result: toolResultsByCallId.get(tc.id),
            }));
            const chips: ChipPayload[] = [];
            for (const tc of stored.tool_calls ?? []) {
              if (tc.function.name === "navigate") {
                const r = toolResultsByCallId.get(tc.id) as { ok?: boolean; label?: string; url?: string; rationale?: string } | undefined;
                if (r?.ok && r.label && r.url) chips.push({ id: tc.id, label: r.label, url: r.url, rationale: r.rationale });
              }
            }
            restored.push({ role: "assistant", content: text ?? "", toolCalls, chips });
          }
        }
        setMessages(restored);
      } catch {
        /* leave empty */
      } finally {
        if (!cancelled) setLoadingHistory(false);
        requestAnimationFrame(() =>
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "instant" as ScrollBehavior }),
        );
      }
    })();
    return () => { cancelled = true; };
  }, [initialSessionId]);

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || streaming) return;
    if (!textOverride) setInput("");
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "", toolCalls: [], chips: [] }]);
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let newSessionId: string | undefined;
      let titleAssigned = false;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf("\n\n")) !== -1) {
          const block = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          const ev = handleEvent(block);
          if (ev?.event === "session" && ev.payload && typeof ev.payload === "object") {
            const p = ev.payload as { sessionId?: string };
            if (p.sessionId && p.sessionId !== sessionId) {
              newSessionId = p.sessionId;
              setSessionId(p.sessionId);
            }
          }
          if (ev?.event === "title") titleAssigned = true;
        }
      }
      if (newSessionId && !initialSessionId) {
        router.replace(`/agent/${newSessionId}`);
      }
      if (titleAssigned || newSessionId) router.refresh();
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
      requestAnimationFrame(() =>
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }),
      );
    }
  }

  function handleEvent(block: string): { event: string; payload: unknown } | null {
    const lines = block.split("\n");
    let event = "";
    let data = "";
    for (const l of lines) {
      if (l.startsWith("event:")) event = l.slice(6).trim();
      else if (l.startsWith("data:")) data = l.slice(5).trim();
    }
    if (!event) return null;
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
        const updated: DisplayMessage = {
          ...last,
          toolCalls: last.toolCalls.map((tc) => (tc.id === p.id ? { ...tc, result: p.result } : tc)),
        };
        if (p.name === "navigate") {
          const r = p.result as { ok?: boolean; label?: string; url?: string; rationale?: string };
          if (r?.ok && r.label && r.url) {
            updated.chips = [...last.chips, { id: p.id, label: r.label, url: r.url, rationale: r.rationale }];
          }
        }
        return [...m.slice(0, -1), updated];
      }
      return m;
    });
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }),
    );
    return { event, payload };
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2">
        {loadingHistory ? (
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]"><Loader2 size={12} className="animate-spin" /> Loading conversation…</div>
        ) : messages.length === 0 ? (
          <EmptyState onPick={(q) => send(q)} />
        ) : (
          <div className="space-y-5 max-w-3xl">
            {messages.map((m, i) => (
              <Message key={i} m={m} streaming={streaming && i === messages.length - 1 && m.role === "assistant"} />
            ))}
          </div>
        )}
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
            placeholder={sessionId ? "Reply…" : "Ask anything about your Agentforce adoption…"}
            rows={1}
            className="flex-1 bg-transparent border-0 outline-none resize-none text-sm py-2 px-2 max-h-40 placeholder:text-[var(--color-text-subtle)]"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || streaming}
            className="h-10 px-4 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-40 text-white text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap"
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
      {m.toolCalls.filter((tc) => tc.name !== "navigate").map((tc) => (
        <details key={tc.id} className="surface-card mb-2 p-3 text-xs">
          <summary className="cursor-pointer flex items-center gap-2 text-[var(--color-text-muted)] select-none">
            <Wrench size={12} className="text-[var(--color-glow)]" />
            <span className="font-mono">{tc.name}</span>
            {tc.result === undefined ? <Loader2 size={12} className="animate-spin ml-1" /> : <span className="text-[var(--color-success)] ml-1">·</span>}
          </summary>
          {tc.result !== undefined && (
            <pre className="mt-2 text-[10px] overflow-x-auto p-2 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)] max-h-80">
              {JSON.stringify(tc.result, null, 2)}
            </pre>
          )}
        </details>
      ))}
      {m.content && (
        <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
      )}
      {m.chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {m.chips.map((c) => {
            const inner = (
              <>
                <span className="font-medium">{c.label}</span>
                <ArrowRight size={12} />
              </>
            );
            return isAppRelative(c.url) ? (
              <Link
                key={c.id}
                href={c.url}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/40 text-[var(--color-glow)] text-xs hover:bg-[var(--color-accent)]/25 hover:border-[var(--color-accent)]/60 transition whitespace-nowrap"
                title={c.rationale}
              >{inner}</Link>
            ) : (
              <a
                key={c.id}
                href={c.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/40 text-[var(--color-glow)] text-xs hover:bg-[var(--color-accent)]/25 hover:border-[var(--color-accent)]/60 transition whitespace-nowrap"
                title={c.rationale}
              >{inner}</a>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  const suggestions = [
    "What should I do next on my adoption journey?",
    "Audit my Salesforce org for Agentforce readiness.",
    "What use cases did I capture, and how do they map to my org?",
    "Mark Pre-Agent Setup chapter as done — I already did it.",
  ];
  return (
    <div className="max-w-3xl">
      <div className="mb-1 text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)]">Try asking</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
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

export function NewConversationButton() {
  return (
    <Link
      href="/agent"
      className="h-9 px-3 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] text-sm inline-flex items-center gap-2 whitespace-nowrap"
    >
      <Plus size={14} /> New conversation
    </Link>
  );
}
