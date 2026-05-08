import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Clock } from "lucide-react";
import { getSection } from "@/content";
import { getSessionUser } from "@/lib/auth";
import { getAllProgress } from "@/lib/progress";
import { ChapterMarkDoneButton } from "@/components/missions/ChapterMarkDoneButton";

export const runtime = "nodejs";

type Params = { section: string };

export default async function ChapterPage(props: { params: Promise<Params> }) {
  const { section: sectionSlug } = await props.params;
  const user = await getSessionUser();
  if (!user) return null;

  const section = getSection(sectionSlug);
  if (!section) notFound();

  const progress = await getAllProgress(user.id);
  const byId = new Map(progress.map((p) => [p.mission_id, p]));
  const total = section.missions.length;
  const done = section.missions.filter((m) => byId.get(m.id)?.status === "completed").length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const allDone = done === total && total > 0;

  return (
    <>
      <div className="mb-6">
        <Link
          href="/missions"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4 whitespace-nowrap"
        >
          <ArrowLeft size={12} /> All chapters
        </Link>
        <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent)] mb-2">
          Chapter
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{section.title}</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">{section.description}</p>
      </div>

      <div className="surface-card p-6 mb-8">
        <div className="flex items-end justify-between mb-3 gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] whitespace-nowrap">Chapter progress</div>
            <div className="text-3xl font-semibold tracking-tight mt-1">{pct}%</div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-sm text-[var(--color-text-muted)] whitespace-nowrap">{done} of {total} missions complete</div>
            <ChapterMarkDoneButton
              missionIds={section.missions.map((m) => m.id)}
              initiallyDone={allDone}
            />
          </div>
        </div>
        <div className="h-2 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-glow)] transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="space-y-3">
        {section.missions.map((m) => {
          const p = byId.get(m.id);
          const completed = p?.status === "completed";
          const inProgress = p && !completed;
          return (
            <Link
              key={m.id}
              href={`/missions/${section.slug}/${m.slug}`}
              className="surface-card p-5 flex items-center gap-5 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] transition group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-subtle)] whitespace-nowrap">
                    Mission {m.number}
                  </span>
                  {completed ? (
                    <span className="pill pill-success whitespace-nowrap"><CheckCircle2 size={10} /> Done</span>
                  ) : inProgress ? (
                    <span className="pill pill-accent whitespace-nowrap"><Clock size={10} /> In progress</span>
                  ) : (
                    <span className="pill whitespace-nowrap"><Circle size={10} /> Not started</span>
                  )}
                </div>
                <div className="text-base font-semibold group-hover:text-[var(--color-glow)] transition-colors">{m.title}</div>
                <div className="text-sm text-[var(--color-text-muted)] mt-1">{m.summary}</div>
                <div className="text-xs text-[var(--color-text-subtle)] mt-2">~{m.estMinutes} min</div>
              </div>
              <div className="shrink-0 text-[var(--color-text-muted)] group-hover:text-[var(--color-glow)] transition-colors">
                <ArrowRight size={16} />
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
