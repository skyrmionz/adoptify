import type { Section, Mission } from "./types";
import { preAgentSetup } from "./sections/01-pre-agent-setup";

export const sections: Section[] = [preAgentSetup];

export function getSection(slug: string): Section | undefined {
  return sections.find((s) => s.slug === slug);
}

export function getMission(sectionSlug: string, missionSlug: string): { section: Section; mission: Mission } | undefined {
  const section = getSection(sectionSlug);
  if (!section) return undefined;
  const mission = section.missions.find((m) => m.slug === missionSlug);
  if (!mission) return undefined;
  return { section, mission };
}

export function getMissionById(id: string): Mission | undefined {
  for (const s of sections) {
    const m = s.missions.find((mm) => mm.id === id);
    if (m) return m;
  }
  return undefined;
}

export function totalMissionCount(): number {
  return sections.reduce((acc, s) => acc + s.missions.length, 0);
}
