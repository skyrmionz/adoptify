import { sections } from "@/content";
import { getAllProgress } from "@/lib/progress";
import { getSessionUser } from "@/lib/auth";
import Link from "next/link";
import { CheckCircle2, Circle, Clock } from "lucide-react";

export const runtime = "nodejs";

export default async function MissionsPage() {
  const user = await getSessionUser();
  if (!user) return null; // layout redirects to /login
  const progress = await getAllProgress(user.id);
  const byId = new Map(progress.map((p) => [p.mission_id, p]));

  return (
    <>
      <div className="mb-10">
        <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2">Your journey</div>
        <h1 className="text-3xl font-semibold tracking-tight">Missions</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">
          Interactive tracks that move you from zero Agentforce experience to a deployed agent. Complete missions in order — each one unlocks new ground.
        </p>
      </div>

      {sections.map((section) => {
        const completedInSection = section.missions.filter((m) => byId.get(m.id)?.status === "completed").length;
        return (
          <section key={section.id} className="mb-10">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">Section · {section.required ? "Required" : "Optional"}</div>
                <h2 className="text-xl font-semibold mt-1">{section.title}</h2>
                <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-2xl">{section.description}</p>
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">{completedInSection} / {section.missions.length} done</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {section.missions.map((mission) => {
                const p = byId.get(mission.id);
                const completed = p?.status === "completed";
                const inProgress = p && !completed;
                return (
                  <Link
                    key={mission.id}
                    href={`/missions/${section.slug}/${mission.slug}`}
                    className="surface-card p-5 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] transition group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">Mission {mission.number}</div>
                      {completed ? (
                        <span className="pill pill-success"><CheckCircle2 size={12} /> Done</span>
                      ) : inProgress ? (
                        <span className="pill pill-accent"><Clock size={12} /> In progress</span>
                      ) : (
                        <span className="pill"><Circle size={12} /> Not started</span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold mb-2 group-hover:text-[var(--color-glow)] transition-colors">{mission.title}</h3>
                    <p className="text-sm text-[var(--color-text-muted)] line-clamp-3">{mission.summary}</p>
                    <div className="mt-4 text-xs text-[var(--color-text-subtle)]">~{mission.estMinutes} min</div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}
