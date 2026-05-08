"use client";

import { SlideShell } from "../SlideShell";
import { CardGrid } from "../CardGrid";

export function SlideBuild() {
  return (
    <SlideShell
      eyebrow="Challenge 2 of 3"
      headline="Why building feels harder than it should"
    >
      <CardGrid
        cards={[
          {
            title: "Sprawling Setup",
            body: "Licensing, permission sets, Trust Layer, My Domain, Default Agent — dozens of toggles spread across Setup.",
          },
          {
            title: "Documentation overload",
            body: "The docs are excellent and exhaustive — which is exactly the problem. New builders don't know where to start reading.",
          },
          {
            title: "From docs to working agent",
            body: "Even after reading, there's a gap. Topics, actions, prompts, and channels each have their own learning curve.",
          },
        ]}
      />
    </SlideShell>
  );
}
