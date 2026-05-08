"use client";

import { SlideShell } from "../SlideShell";
import { CardGrid } from "../CardGrid";

export function SlideValue() {
  return (
    <SlideShell
      eyebrow="Challenge 3 of 3"
      headline="Justifying and tracking value"
    >
      <CardGrid
        cards={[
          {
            title: "Justifying ROI",
            body: "Hard to commit budget when you can't quantify the upside before the build.",
          },
          {
            title: "Tracking value",
            body: "Once the agent is live, what actually counts as a win — deflection rate, CSAT, time saved, reps coached?",
          },
          {
            title: "Driving more value",
            body: "No clear playbook for the second, third, fourth use case once the first is live.",
          },
        ]}
      />
    </SlideShell>
  );
}
