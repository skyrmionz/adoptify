import { sections } from "@/content";
import { getAllProgress } from "@/lib/progress";
import { getSessionUser } from "@/lib/auth";
import { ChaptersList } from "@/components/missions/ChaptersList";
import { PocketFdePanel } from "@/components/missions/PocketFdePanel";
import { buildActivationPlan, getDiagnostic, getRecommendations, getSelectedUseCase } from "@/lib/diagnostic";
import { queryOne } from "@/lib/db";

export const runtime = "nodejs";

export default async function MissionsPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const [progress, diagnostic, recommendations, selected, conn] = await Promise.all([
    getAllProgress(user.id),
    getDiagnostic(user.id),
    getRecommendations(user.id),
    getSelectedUseCase(user.id),
    queryOne<{ id: string }>(
      `SELECT id FROM salesforce_connections WHERE user_id = $1 AND disconnected_at IS NULL ORDER BY created_at DESC LIMIT 1`,
      [user.id],
    ),
  ]);
  const progressMap: Record<string, { status: string; completed_at: string | null }> = {};
  for (const p of progress) {
    progressMap[p.mission_id] = { status: p.status, completed_at: p.completed_at };
  }
  const plan = buildActivationPlan(selected, diagnostic).map((item) => ({
    missionId: item.mission.id,
    title: item.mission.title,
    summary: item.mission.summary,
    href: item.href,
    sectionTitle: item.sectionTitle,
    reason: item.reason,
    blockedBy: item.blockedBy,
    dependencies: item.dependencies,
  }));

  return (
    <>
      <div className="mb-10">
        <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2">Stage 1-2 activation</div>
        <h1 className="text-3xl font-semibold tracking-tight">Missions</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">
          Diagnose your readiness, choose the right first Agentforce use case, then work the ordered activation plan.
        </p>
      </div>

      <PocketFdePanel
        diagnostic={diagnostic}
        recommendations={recommendations}
        selected={selected}
        plan={plan}
        connected={!!conn}
        progress={progressMap}
      />

      <div className="mb-4">
        <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2">Full curriculum</div>
        <h2 className="text-xl font-semibold tracking-tight">All chapters</h2>
      </div>
      <ChaptersList sections={sections} progress={progressMap} />
    </>
  );
}
