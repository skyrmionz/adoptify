import { getMission } from "@/content";
import { getSessionUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { getProgress } from "@/lib/progress";
import { MissionRenderer } from "@/components/missions/MissionRenderer";
import { queryOne } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const runtime = "nodejs";

type Params = { section: string; mission: string };

export default async function MissionPage(props: { params: Promise<Params> }) {
  const { section: sectionSlug, mission: missionSlug } = await props.params;
  const user = await getSessionUser();
  if (!user) return null;

  const found = getMission(sectionSlug, missionSlug);
  if (!found) notFound();
  const { section, mission } = found;

  const progress = await getProgress(user.id, mission.id);
  const conn = await queryOne<{ id: string; instance_url: string }>(
    `SELECT id, instance_url FROM salesforce_connections WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [user.id],
  );

  return (
    <>
      <div className="mb-6">
        <Link
          href="/missions"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4"
        >
          <ArrowLeft size={12} /> All missions
        </Link>
        <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent)] mb-2">
          {section.title} · Mission {mission.number}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{mission.title}</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">{mission.summary}</p>
      </div>

      <MissionRenderer
        mission={mission}
        initialEvidence={progress?.evidence_json ?? {}}
        initialStatus={progress?.status ?? "not_started"}
        connected={!!conn}
      />
    </>
  );
}
