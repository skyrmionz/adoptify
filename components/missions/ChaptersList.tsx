"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, CheckCircle2, Circle, Clock, ArrowRight, Loader2 } from "lucide-react";
import type { Section } from "@/content/types";
import { cn } from "@/lib/utils";

type ProgressMap = Record<string, { status: string; completed_at: string | null }>;

export function ChaptersList({ sections, progress }: { sections: Section[]; progress: ProgressMap }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [progressLocal, setProgressLocal] = useState<ProgressMap>(progress);
  const [busyChapter, setBusyChapter] = useState<string | null>(null);

  async function toggleChapterDone(section: Section, markDone: boolean) {
    setBusyChapter(section.id);
    try {
      const updates = await Promise.all(
        section.missions.map(async (m) => {
          const res = await fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              missionId: m.id,
              completed: markDone,
              evidence: markDone
                ? { marked_done_manually_at: new Date().toISOString() }
                : { reopened_at: new Date().toISOString() },
            }),
          });
          return { id: m.id, ok: res.ok };
        }),
      );
      setProgressLocal((prev) => {
        const next = { ...prev };
        for (const u of updates) {
          if (!u.ok) continue;
          if (markDone) {
            next[u.id] = { status: "completed", completed_at: new Date().toISOString() };
          } else {
            next[u.id] = { status: "in_progress", completed_at: null };
          }
        }
        return next;
      });
      router.refresh();
    } finally {
      setBusyChapter(null);
    }
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const total = section.missions.length;
        const done = section.missions.filter((m) => progressLocal[m.id]?.status === "completed").length;
        const pct = total === 0 ? 0 : Math.round((done / total) * 100);
        const open = openId === section.id;
        const allDone = done === total && total > 0;

        return (
          <div
            key={section.id}
            className={cn(
              "surface-card overflow-hidden transition-colors",
              open && "border-[var(--color-border-strong)]",
            )}
          >
            <button
              type="button"
              onClick={() => setOpenId(open ? null : section.id)}
              className="w-full text-left p-5 hover:bg-[var(--color-surface-2)]/60 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-accent)]">
                    Chapter
                  </div>
                  <h2 className="text-xl font-semibold mt-1 truncate">{section.title}</h2>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-2xl">{section.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                    {done} / {total} done
                  </div>
                  <ChevronDown
                    size={16}
                    className={cn(
                      "text-[var(--color-text-muted)] transition-transform duration-200",
                      open ? "rotate-180" : "rotate-0",
                    )}
                  />
                </div>
              </div>

              <div className="mt-4 h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-glow)] transition-[width] duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                  className="overflow-hidden"
                >
                  <div className="p-5 pt-0 border-t border-[var(--color-border)]">
                    <div className="flex items-center justify-between gap-3 my-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)] whitespace-nowrap">
                        Missions in this chapter
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleChapterDone(section, !allDone)}
                          disabled={busyChapter === section.id}
                          className={cn(
                            "h-9 px-3 rounded-md text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap transition",
                            allDone
                              ? "bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/30 hover:bg-[var(--color-success)]/25"
                              : "bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
                          )}
                        >
                          {busyChapter === section.id ? (
                            <><Loader2 size={12} className="animate-spin" /> Saving</>
                          ) : allDone ? (
                            <><CheckCircle2 size={12} /> Mark chapter undone</>
                          ) : (
                            <><CheckCircle2 size={12} /> Mark chapter done</>
                          )}
                        </button>
                        <Link
                          href={`/missions/${section.slug}`}
                          className="h-9 px-3 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap"
                        >
                          Go to chapter <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {section.missions.map((m) => {
                        const p = progressLocal[m.id];
                        const completed = p?.status === "completed";
                        const inProgress = p && !completed;
                        return (
                          <Link
                            key={m.id}
                            href={`/missions/${section.slug}/${m.slug}`}
                            className="surface-card p-4 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] transition group"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-subtle)] whitespace-nowrap">
                                Mission {m.number}
                              </div>
                              {completed ? (
                                <span className="pill pill-success whitespace-nowrap"><CheckCircle2 size={10} /> Done</span>
                              ) : inProgress ? (
                                <span className="pill pill-accent whitespace-nowrap"><Clock size={10} /> In progress</span>
                              ) : (
                                <span className="pill whitespace-nowrap"><Circle size={10} /> Not started</span>
                              )}
                            </div>
                            <div className="text-sm font-semibold group-hover:text-[var(--color-glow)] transition-colors">
                              {m.title}
                            </div>
                            <div className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">{m.summary}</div>
                            <div className="mt-3 text-[11px] text-[var(--color-text-subtle)]">~{m.estMinutes} min</div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
