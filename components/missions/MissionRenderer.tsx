"use client";

import { useState, useCallback } from "react";
import type { Mission, Step } from "@/content/types";
import { FrameworkStep } from "./steps/Framework";
import { EmbedStep } from "./steps/Embed";
import { ChecklistStep } from "./steps/Checklist";
import { WhiteboardStep } from "./steps/Whiteboard";
import { UseCaseCaptureStep } from "./steps/UseCaseCapture";
import { KnowledgeAuditStep } from "./steps/KnowledgeAudit";
import { OrgScanReportStep } from "./steps/OrgScanReport";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  mission: Mission;
  initialEvidence: Record<string, unknown>;
  initialStatus: string;
  connected: boolean;
};

export function MissionRenderer({ mission, initialEvidence, initialStatus, connected }: Props) {
  const [evidence, setEvidence] = useState<Record<string, unknown>>(initialEvidence);
  const [status, setStatus] = useState<string>(initialStatus);
  const [activeStep, setActiveStep] = useState(0);
  const [savingComplete, setSavingComplete] = useState(false);

  const persistEvidence = useCallback(async (patch: Record<string, unknown>) => {
    const next = { ...evidence, ...patch };
    setEvidence(next);
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionId: mission.id, evidence: patch }),
    });
  }, [evidence, mission.id]);

  const completeMission = useCallback(async () => {
    setSavingComplete(true);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId: mission.id, completed: true, evidence: { reviewed_at: new Date().toISOString() } }),
      });
      if (res.ok) setStatus("completed");
    } finally {
      setSavingComplete(false);
    }
  }, [mission.id]);

  const canComplete = canMissionComplete(mission, evidence, connected);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
      <nav className="lg:sticky lg:top-20 self-start">
        <ol className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2">
          {mission.steps.map((s, i) => (
            <li key={i}>
              <button
                onClick={() => setActiveStep(i)}
                className={cn(
                  "w-full flex items-center gap-3 text-left px-3 h-10 rounded-md text-sm transition-colors whitespace-nowrap",
                  i === activeStep
                    ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
                )}
              >
                <span className={cn(
                  "h-5 w-5 rounded-full text-[11px] flex items-center justify-center border",
                  i === activeStep ? "border-[var(--color-glow)] text-[var(--color-glow)]" : "border-[var(--color-border)]",
                )}>{i + 1}</span>
                <span className="font-medium truncate">{stepLabel(s)}</span>
              </button>
            </li>
          ))}
        </ol>

        <div className="hidden lg:block mt-6 pt-6 border-t border-[var(--color-border)]">
          <button
            onClick={completeMission}
            disabled={!canComplete || savingComplete || status === "completed"}
            className={cn(
              "w-full h-10 rounded-md font-semibold text-sm transition",
              status === "completed"
                ? "bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/30"
                : canComplete
                  ? "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white"
                  : "bg-[var(--color-surface-2)] text-[var(--color-text-subtle)] cursor-not-allowed border border-[var(--color-border)]",
            )}
          >
            {status === "completed" ? (
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} /> Mission complete</span>
            ) : savingComplete ? "Saving…" : canComplete ? "Mark mission complete" : <span className="inline-flex items-center gap-1.5"><Circle size={14} /> Steps remaining</span>}
          </button>
          <p className="text-[11px] text-[var(--color-text-subtle)] mt-2 leading-relaxed">{mission.verify.explain}</p>
        </div>
      </nav>

      <section>
        {mission.steps.map((step, i) => (
          <div key={i} className={i === activeStep ? "block" : "hidden"}>
            <StepBody
              step={step}
              missionId={mission.id}
              evidence={evidence}
              onEvidence={persistEvidence}
              connected={connected}
            />
          </div>
        ))}

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => setActiveStep((i) => Math.max(0, i - 1))}
            disabled={activeStep === 0}
            className="h-10 px-4 rounded-md text-sm border border-[var(--color-border)] text-[var(--color-text-muted)] disabled:opacity-40 hover:text-[var(--color-text)] hover:border-[var(--color-border-strong)]"
          >
            Previous
          </button>
          {activeStep < mission.steps.length - 1 ? (
            <button
              onClick={() => setActiveStep((i) => Math.min(mission.steps.length - 1, i + 1))}
              className="h-10 px-5 rounded-md text-sm font-semibold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white"
            >
              Next step
            </button>
          ) : (
            <button
              onClick={completeMission}
              disabled={!canComplete || savingComplete || status === "completed"}
              className={cn(
                "h-10 px-5 rounded-md text-sm font-semibold transition",
                status === "completed"
                  ? "bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/30"
                  : canComplete
                    ? "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white"
                    : "bg-[var(--color-surface-2)] text-[var(--color-text-subtle)] cursor-not-allowed border border-[var(--color-border)]",
              )}
            >
              {status === "completed" ? "Completed" : savingComplete ? "Saving…" : "Complete mission"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function stepLabel(s: Step): string {
  return s.title;
}

function StepBody({
  step,
  missionId,
  evidence,
  onEvidence,
  connected,
}: {
  step: Step;
  missionId: string;
  evidence: Record<string, unknown>;
  onEvidence: (patch: Record<string, unknown>) => Promise<void>;
  connected: boolean;
}) {
  switch (step.kind) {
    case "framework":
      return <FrameworkStep step={step} />;
    case "embed":
      return <EmbedStep step={step} />;
    case "checklist":
      return <ChecklistStep step={step} evidence={evidence} onEvidence={onEvidence} />;
    case "whiteboard":
      return <WhiteboardStep step={step} evidence={evidence} onEvidence={onEvidence} />;
    case "useCaseCapture":
      return <UseCaseCaptureStep step={step} evidence={evidence} onEvidence={onEvidence} />;
    case "knowledgeAudit":
      return <KnowledgeAuditStep step={step} evidence={evidence} onEvidence={onEvidence} connected={connected} />;
    case "orgScanReport":
      return <OrgScanReportStep step={step} connected={connected} missionId={missionId} onEvidence={onEvidence} />;
    case "verifyInOrg":
      return (
        <div className="surface-card p-6">
          <h3 className="text-lg font-semibold">{step.title}</h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">{step.description}</p>
        </div>
      );
  }
}

function canMissionComplete(mission: Mission, evidence: Record<string, unknown>, connected: boolean): boolean {
  // Lightweight client-side checks. Server is source of truth for what gets stored;
  // this just decides whether to enable the "complete" button.
  for (const step of mission.steps) {
    if (step.kind === "useCaseCapture") {
      const list = (evidence.useCases as Array<unknown>) ?? [];
      if (list.length < (step.minCount ?? 1)) return false;
    }
    if (step.kind === "knowledgeAudit") {
      const sources = (evidence.knowledgeSources as Array<unknown>) ?? [];
      if (sources.length < 1) return false;
    }
    if (step.kind === "orgScanReport") {
      if (!connected) return false;
      const scan = evidence.orgScan as { scanned_at?: string } | undefined;
      if (!scan?.scanned_at) return false;
    }
  }
  return true;
}
