"use client";

import { SlideShell } from "../SlideShell";
import { CardGrid } from "../CardGrid";

export function SlideStructure() {
  return (
    <SlideShell
      eyebrow="Challenge 1 of 3"
      headline="Structure is missing in three places"
    >
      <CardGrid
        cards={[
          {
            title: "Approach",
            body: "Customers don't know what order to do things in. Build first? Pick a use case first? Set up Data Cloud first? Without a path, projects stall.",
          },
          {
            title: "Success",
            body: "Most agentic programs don't have a single agreed-on success metric. Without that, you can't tell if it's working.",
          },
          {
            title: "Use cases",
            body: "Not every workflow is a fit for an agent. Picking the wrong first one is the most common reason a pilot fails.",
          },
        ]}
      />
    </SlideShell>
  );
}
