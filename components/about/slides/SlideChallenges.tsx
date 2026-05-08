"use client";

import { SlideShell } from "../SlideShell";
import { CardGrid } from "../CardGrid";

export function SlideChallenges() {
  return (
    <SlideShell
      eyebrow="The three things that stall adoption"
      headline="Where teams get stuck"
    >
      <CardGrid
        cards={[
          {
            title: "Lack of structure",
            body: "No shared way to approach the build, define success, or choose use cases.",
          },
          {
            title: "Building feels hard",
            body: "Sprawling Setup steps, dense docs, and a long gap before something actually runs.",
          },
          {
            title: "Value is murky",
            body: "No common framing to justify investment up front or track value once live.",
          },
        ]}
      />
    </SlideShell>
  );
}
