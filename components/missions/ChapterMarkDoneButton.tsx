"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChapterMarkDoneButton({
  missionIds,
  initiallyDone,
}: {
  missionIds: string[];
  initiallyDone: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(initiallyDone);

  async function markAll() {
    setBusy(true);
    try {
      await Promise.all(
        missionIds.map((id) =>
          fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              missionId: id,
              completed: true,
              evidence: { marked_done_manually_at: new Date().toISOString() },
            }),
          }),
        ),
      );
      setDone(true);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={markAll}
      disabled={busy || done}
      className={cn(
        "h-9 px-3 rounded-md text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap transition",
        done
          ? "bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/30"
          : "bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
      )}
    >
      {busy ? (
        <><Loader2 size={12} className="animate-spin" /> Saving</>
      ) : done ? (
        <><CheckCircle2 size={12} /> Chapter done</>
      ) : (
        <><CheckCircle2 size={12} /> Mark chapter done</>
      )}
    </button>
  );
}
