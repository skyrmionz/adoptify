"use client";

import { SlideShell } from "../SlideShell";
import { CardGrid } from "../CardGrid";

export function SlideHowAdoptify() {
  return (
    <SlideShell
      eyebrow="How adoptify helps"
      headline="One opinionated path, end to end"
    >
      <CardGrid
        cards={[
          {
            title: "Structure → Missions",
            body: "Five chapters that walk you from \"no agent\" to \"live agent,\" with use-case framing and stakeholder/KPI capture built in.",
            chip: { label: "Open Missions", href: "/missions" },
          },
          {
            title: "Build → guided + automated",
            body: "Setup checklists you can verify against your real org, ready-to-paste prompts for coding agents, and an embedded specialist that can use the Salesforce CLI to do the work for you.",
            chip: { label: "Open Agent", href: "/agent" },
          },
          {
            title: "Value → Analytics + Progress",
            body: "A real-time read on who's using the agent, where, when, and how well — plus org readiness scoring per chapter so you can see ROI building.",
            chip: { label: "Open Analytics", href: "/analytics" },
          },
        ]}
      />
    </SlideShell>
  );
}
