import { sections, totalMissionCount } from "@/content";
import { getAllProgress } from "@/lib/progress";
import { getSessionUser } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { CheckCircle2, Circle, Clock } from "lucide-react";

export const runtime = "nodejs";

type ChapterScore = { chapterId: string; title: string; score: number; notes: string };
type AssessmentRow = { scanned_at: string; score: number; snapshot_json: unknown; findings_json: { byChapter?: ChapterScore[] } | null };
type ScoredSnapshot = { byChapter?: ChapterScore[] } | null;

export default async function ProgressPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const progress = await getAllProgress(user.id);
  const byId = new Map(progress.map((p) => [p.mission_id, p]));
  const total = totalMissionCount();
  const completed = progress.filter((p) => p.status === "completed").length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Pull byChapter from the latest assessment if it exists. We re-score against
  // the cached snapshot to avoid a re-run; new structure is computed by the scanner.
  const latest = await queryOne<AssessmentRow>(
    `SELECT scanned_at, score, snapshot_json, findings_json
     FROM org_assessments WHERE user_id = $1 ORDER BY scanned_at DESC LIMIT 1`,
    [user.id],
  );
  // findings_json is the legacy storage; new scans place byChapter on the snapshot via scoreSnapshot.
  // For older rows, we fall back gracefully.
  const snapshotWithChapters = latest?.snapshot_json as unknown as ScoredSnapshot;
  const byChapter = snapshotWithChapters?.byChapter ?? null;

  return (
    <>
      <div className="mb-10">
        <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2">Adoption</div>
        <h1 className="text-3xl font-semibold tracking-tight">Progress</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">
          Where you are in your Agentforce adoption journey.
        </p>
      </div>

      <div className="surface-card p-6 mb-10">
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)]">Mission completion</div>
            <div className="text-4xl font-semibold tracking-tight mt-1">{pct}%</div>
          </div>
          <div className="text-sm text-[var(--color-text-muted)]">{completed} of {total} missions complete</div>
        </div>
        <div className="h-2 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-glow)] transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {byChapter && byChapter.length > 0 && (
        <div className="surface-card p-6 mb-10">
          <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-1">Org readiness by chapter</div>
          <div className="text-sm text-[var(--color-text-muted)] mb-5">
            Inferred from your latest org scan ({latest?.scanned_at ? new Date(latest.scanned_at).toLocaleDateString() : "—"}).
          </div>
          <div className="space-y-3">
            {byChapter.map((c) => (
              <div key={c.chapterId}>
                <div className="flex items-baseline justify-between text-xs mb-1">
                  <div className="text-[var(--color-text)] font-medium">{c.title}</div>
                  <div className="text-[var(--color-text-muted)]">{c.score} / 100</div>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-glow)] transition-all"
                    style={{ width: `${c.score}%` }}
                  />
                </div>
                <div className="text-[11px] text-[var(--color-text-subtle)] mt-1">{c.notes}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-8">
        {sections.map((section) => {
          const inSection = section.missions.length;
          const doneInSection = section.missions.filter((m) => byId.get(m.id)?.status === "completed").length;
          return (
            <section key={section.id}>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <div className="text-xs text-[var(--color-text-muted)]">{doneInSection} / {inSection}</div>
              </div>
              <ol className="relative pl-6 space-y-3">
                <span className="absolute left-2 top-1 bottom-1 w-px bg-[var(--color-border)]" />
                {section.missions.map((m) => {
                  const p = byId.get(m.id);
                  const completed = p?.status === "completed";
                  const inProgress = p && !completed;
                  return (
                    <li key={m.id} className="relative">
                      <span
                        className={
                          "absolute -left-[18px] top-1 h-3 w-3 rounded-full border-2 " +
                          (completed
                            ? "bg-[var(--color-success)] border-[var(--color-success)]"
                            : inProgress
                              ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
                              : "bg-[var(--color-bg)] border-[var(--color-border)]")
                        }
                      />
                      <div className="surface-card p-4 flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold">{m.title}</div>
                          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{m.summary}</div>
                        </div>
                        {completed ? (
                          <span className="pill pill-success whitespace-nowrap"><CheckCircle2 size={12} /> Done {p?.completed_at ? new Date(p.completed_at).toLocaleDateString() : ""}</span>
                        ) : inProgress ? (
                          <span className="pill pill-accent whitespace-nowrap"><Clock size={12} /> In progress</span>
                        ) : (
                          <span className="pill whitespace-nowrap"><Circle size={12} /> Not started</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </>
  );
}
