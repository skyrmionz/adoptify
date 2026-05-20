import { getMission } from "@/content";
import { getSessionUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { getAllProgress, getProgress } from "@/lib/progress";
import { MissionRenderer } from "@/components/missions/MissionRenderer";
import { queryOne } from "@/lib/db";
import Link from "next/link";
import { ChevronRight, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const runtime = "nodejs";

type Params = { section: string; mission: string };

export default async function MissionPage(props: { params: Promise<Params> }) {
  const { section: sectionSlug, mission: missionSlug } = await props.params;
  const user = await getSessionUser();
  if (!user) return null;

  const found = getMission(sectionSlug, missionSlug);
  if (!found) notFound();
  const { section, mission } = found;

  const [progress, allProgress, conn] = await Promise.all([
    getProgress(user.id, mission.id),
    getAllProgress(user.id),
    queryOne<{ id: string; instance_url: string }>(
      `SELECT id, instance_url FROM salesforce_connections WHERE user_id = $1 AND disconnected_at IS NULL ORDER BY created_at DESC LIMIT 1`,
      [user.id],
    ),
  ]);

  const byId = new Map(allProgress.map((p) => [p.mission_id, p]));
  const idx = section.missions.findIndex((m) => m.id === mission.id);
  const prev = idx > 0 ? section.missions[idx - 1] : null;
  const next = idx >= 0 && idx < section.missions.length - 1 ? section.missions[idx + 1] : null;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-5">
        <ol className="flex items-center flex-wrap gap-1.5 text-xs text-[var(--color-text-muted)]">
          <li>
            <Link href="/missions" className="hover:text-[var(--color-text)] transition-colors whitespace-nowrap">
              Missions
            </Link>
          </li>
          <li className="text-[var(--color-text-subtle)]"><ChevronRight size={12} /></li>
          <li>
            <Link
              href={`/missions/${section.slug}`}
              className="hover:text-[var(--color-text)] transition-colors whitespace-nowrap"
            >
              {section.title}
            </Link>
          </li>
          <li className="text-[var(--color-text-subtle)]"><ChevronRight size={12} /></li>
          <li className="text-[var(--color-text)] whitespace-nowrap truncate max-w-[40ch]">
            Mission {mission.number}: {mission.title}
          </li>
        </ol>
      </nav>

      <div className="mb-2 flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-accent)] whitespace-nowrap">
          {section.title} · Mission {mission.number} of {section.missions.length}
        </span>
      </div>
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{mission.title}</h1>
      <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">{mission.summary}</p>

      <div className="mt-5 mb-8">
        <MissionStepper
          currentIndex={idx}
          missions={section.missions.map((m) => ({
            id: m.id,
            slug: m.slug,
            title: m.title,
            number: m.number,
            href: `/missions/${section.slug}/${m.slug}`,
            status: byId.get(m.id)?.status ?? "not_started",
          }))}
        />
      </div>

      <MissionRenderer
        mission={mission}
        initialEvidence={progress?.evidence_json ?? {}}
        initialStatus={progress?.status ?? "not_started"}
        connected={!!conn}
      />

      <nav className="mt-12 pt-6 border-t border-[var(--color-border)] flex items-center justify-between gap-4">
        {prev ? (
          <Link
            href={`/missions/${section.slug}/${prev.slug}`}
            className="group flex flex-col gap-0.5 hover:text-[var(--color-text)] transition-colors text-[var(--color-text-muted)] min-w-0"
          >
            <span className="text-[10px] uppercase tracking-[0.25em] inline-flex items-center gap-1 whitespace-nowrap">
              <ChevronLeft size={10} /> Previous
            </span>
            <span className="text-sm font-semibold text-[var(--color-text)] truncate">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/missions/${section.slug}/${next.slug}`}
            className="group flex flex-col gap-0.5 items-end hover:text-[var(--color-text)] transition-colors text-[var(--color-text-muted)] min-w-0 text-right"
          >
            <span className="text-[10px] uppercase tracking-[0.25em] inline-flex items-center gap-1 whitespace-nowrap">
              Next <ChevronRightIcon size={10} />
            </span>
            <span className="text-sm font-semibold text-[var(--color-text)] truncate">{next.title}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </>
  );
}

function MissionStepper({
  currentIndex,
  missions,
}: {
  currentIndex: number;
  missions: { id: string; slug: string; title: string; number: number; href: string; status: string }[];
}) {
  return (
    <ol className="flex items-center gap-2">
      {missions.map((m, i) => {
        const isCurrent = i === currentIndex;
        const isDone = m.status === "completed";
        return (
          <li key={m.id} className="flex items-center gap-2">
            <Link
              href={m.href}
              title={`Mission ${m.number}: ${m.title}`}
              className={cn(
                "h-7 px-2.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1.5 border transition-colors whitespace-nowrap",
                isCurrent
                  ? "bg-[var(--color-accent)]/15 border-[var(--color-accent)]/40 text-[var(--color-glow)]"
                  : isDone
                    ? "bg-[var(--color-success)]/15 border-[var(--color-success)]/30 text-[var(--color-success)]"
                    : "bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
              )}
            >
              <span className="opacity-70">{m.number}</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">{m.title}</span>
              {isDone && <span className="hidden sm:inline">✓</span>}
            </Link>
            {i < missions.length - 1 && <span className="h-px w-3 bg-[var(--color-border)]" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
