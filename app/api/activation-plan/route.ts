import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { buildActivationPlan, getDiagnostic, getSelectedUseCase } from "@/lib/diagnostic";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [diagnostic, selected] = await Promise.all([
    getDiagnostic(user.id),
    getSelectedUseCase(user.id),
  ]);
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
  return NextResponse.json({ diagnostic, selected, plan });
}
