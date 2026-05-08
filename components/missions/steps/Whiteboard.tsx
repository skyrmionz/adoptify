"use client";

import { useEffect, useRef, useState } from "react";
import type { Step } from "@/content/types";
import { Plus, Trash2 } from "lucide-react";

// Lightweight sticky-note canvas. We deliberately avoid pulling in tldraw at first run
// to keep bundle weight down and side-step its CSS theming work — this gives the same
// "drop notes, drag to rearrange" affordance with full control over the dark theme.

type Note = {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
};

const PALETTE = ["#1FE0FF", "#7C8AFF", "#F5B83D", "#22C55E", "#EF4444"];

export function WhiteboardStep({
  step,
  evidence,
  onEvidence,
}: {
  step: Extract<Step, { kind: "whiteboard" }>;
  evidence: Record<string, unknown>;
  onEvidence: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const stored = (evidence[step.persistKey] as Note[]) ?? [];
  const [notes, setNotes] = useState<Note[]>(stored);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Debounced persistence — don't write on every drag pixel.
  useEffect(() => {
    const t = setTimeout(() => {
      onEvidence({ [step.persistKey]: notes });
    }, 600);
    return () => clearTimeout(t);
  }, [notes, onEvidence, step.persistKey]);

  function addNote() {
    const id = Math.random().toString(36).slice(2, 9);
    const color = PALETTE[notes.length % PALETTE.length];
    setNotes((ns) => [
      ...ns,
      { id, text: "", x: 24 + (ns.length % 5) * 30, y: 24 + Math.floor(ns.length / 5) * 30, color },
    ]);
  }

  function removeNote(id: string) {
    setNotes((ns) => ns.filter((n) => n.id !== id));
  }

  function onPointerDown(e: React.PointerEvent, n: Note) {
    if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      id: n.id,
      offsetX: e.clientX - rect.left - n.x,
      offsetY: e.clientY - rect.top - n.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const id = dragRef.current.id;
    const x = Math.max(0, Math.min(rect.width - 200, e.clientX - rect.left - dragRef.current.offsetX));
    const y = Math.max(0, Math.min(rect.height - 140, e.clientY - rect.top - dragRef.current.offsetY));
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, x, y } : n)));
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{step.title}</h2>
          {step.description && <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">{step.description}</p>}
        </div>
        <button
          onClick={addNote}
          className="h-10 px-4 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <Plus size={14} /> Add note
        </button>
      </div>

      <div
        ref={canvasRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="relative surface-card p-0 overflow-hidden grid-fade"
        style={{ height: 480 }}
      >
        {notes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-[var(--color-text-subtle)]">
            Click &quot;Add note&quot; to start brainstorming.
          </div>
        )}
        {notes.map((n) => (
          <div
            key={n.id}
            onPointerDown={(e) => onPointerDown(e, n)}
            className="absolute select-none rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-md"
            style={{
              left: n.x,
              top: n.y,
              width: 200,
              minHeight: 130,
              borderTopColor: n.color,
              borderTopWidth: 3,
            }}
          >
            <div className="flex items-center justify-end p-1.5">
              <button
                onClick={() => removeNote(n.id)}
                className="h-6 w-6 rounded text-[var(--color-text-subtle)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface-3)] flex items-center justify-center"
                aria-label="Remove note"
              >
                <Trash2 size={12} />
              </button>
            </div>
            <textarea
              value={n.text}
              onChange={(e) => setNotes((ns) => ns.map((x) => (x.id === n.id ? { ...x, text: e.target.value } : x)))}
              placeholder="Use case idea…"
              className="w-full px-3 pb-3 bg-transparent border-0 outline-none resize-none text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)]"
              rows={4}
            />
          </div>
        ))}
      </div>
      <p className="text-[11px] text-[var(--color-text-subtle)] mt-2">Notes auto-save when you stop editing.</p>
    </div>
  );
}
