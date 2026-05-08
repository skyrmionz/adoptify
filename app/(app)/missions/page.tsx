import { sections } from "@/content";
import { getAllProgress } from "@/lib/progress";
import { getSessionUser } from "@/lib/auth";
import { ChaptersList } from "@/components/missions/ChaptersList";

export const runtime = "nodejs";

export default async function MissionsPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const progress = await getAllProgress(user.id);
  const progressMap: Record<string, { status: string; completed_at: string | null }> = {};
  for (const p of progress) {
    progressMap[p.mission_id] = { status: p.status, completed_at: p.completed_at };
  }

  return (
    <>
      <div className="mb-10">
        <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2">Your journey</div>
        <h1 className="text-3xl font-semibold tracking-tight">Missions</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">
          Interactive tracks that move you from zero Agentforce experience to a deployed agent. Open a chapter to see its missions.
        </p>
      </div>

      <ChaptersList sections={sections} progress={progressMap} />
    </>
  );
}
