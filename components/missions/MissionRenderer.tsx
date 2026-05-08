"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import type { Mission, Step } from "@/content/types";
import { FrameworkStep } from "./steps/Framework";
import { EmbedStep } from "./steps/Embed";
import { ChecklistStep } from "./steps/Checklist";
import { WhiteboardStep } from "./steps/Whiteboard";
import { UseCaseCaptureStep } from "./steps/UseCaseCapture";
import { KnowledgeAuditStep } from "./steps/KnowledgeAudit";
import { OrgScanReportStep } from "./steps/OrgScanReport";
import { RichContentStep } from "./steps/RichContent";
import { SetupChecklistStep } from "./steps/SetupChecklist";
import { ActionInventoryStep } from "./steps/ActionInventory";
import { ChannelPlannerStep } from "./steps/ChannelPlanner";
import { PromptDesignerStep } from "./steps/PromptDesigner";
import { CoderPromptStep } from "./steps/CoderPrompt";
import { cn } from "@/lib/utils";

type Props = {
  mission: Mission;
  initialEvidence: Record<string, unknown>;
  initialStatus: string;
  connected: boolean;
};

type StepDoneMap = Record<number, boolean>;

export function MissionRenderer({ mission, initialEvidence, initialStatus, connected }: Props) {
  const router = useRouter();
  const [evidence, setEvidence] = useState<Record<string, unknown>>(initialEvidence);
  const [status, setStatus] = useState<string>(initialStatus);
  const [savingComplete, setSavingComplete] = useState(false);

  const initialStepsDone: StepDoneMap = {};
  const stored = (initialEvidence.stepsDone as StepDoneMap) ?? {};
  for (const k of Object.keys(stored)) initialStepsDone[Number(k)] = !!stored[Number(k)];
  const [stepsDone, setStepsDone] = useState<StepDoneMap>(initialStepsDone);

  const persistEvidence = useCallback(async (patch: Record<string, unknown>) => {
    setEvidence((cur) => ({ ...cur, ...patch }));
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionId: mission.id, evidence: patch }),
    });
  }, [mission.id]);

  async function toggleStepDone(idx: number) {
    const next = { ...stepsDone, [idx]: !stepsDone[idx] };
    setStepsDone(next);
    await persistEvidence({ stepsDone: next });
  }

  async function completeMission() {
    setSavingComplete(true);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId: mission.id,
          completed: true,
          evidence: { reviewed_at: new Date().toISOString() },
        }),
      });
      if (res.ok) {
        setStatus("completed");
        router.refresh();
      }
    } finally {
      setSavingComplete(false);
    }
  }

  async function reopenMission() {
    setSavingComplete(true);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId: mission.id,
          completed: false,
          evidence: { reopened_at: new Date().toISOString() },
        }),
      });
      if (res.ok) {
        setStatus("in_progress");
        router.refresh();
      }
    } finally {
      setSavingComplete(false);
    }
  }

  const completed = status === "completed";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-10">
      <article className="min-w-0 max-w-3xl">
        {mission.steps.map((step, i) => {
          const isDone = !!stepsDone[i];
          const isOptional = step.kind === "coderPrompt";
          return (
            <section
              key={i}
              id={`section-${i + 1}`}
              className="border-t border-[var(--color-border)] py-10 first:border-t-0 first:pt-0"
            >
              {!isOptional && (
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-text-subtle)] whitespace-nowrap">
                    Section {i + 1} of {mission.steps.length}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleStepDone(i)}
                    className={cn(
                      "h-8 px-3 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition shrink-0",
                      isDone
                        ? "bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/30 hover:bg-[var(--color-success)]/20"
                        : "bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
                    )}
                  >
                    {isDone ? <><CheckCircle2 size={12} /> Done</> : <><Circle size={12} /> Mark done</>}
                  </button>
                </div>
              )}

              <StepBody
                step={step}
                missionId={mission.id}
                evidence={evidence}
                onEvidence={persistEvidence}
                connected={connected}
              />
            </section>
          );
        })}
      </article>

      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-6">
          <nav>
            <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-3">In this mission</div>
            <ol className="flex flex-col gap-1.5">
              {mission.steps.map((s, i) => {
                if (s.kind === "coderPrompt") return null;
                const isDone = !!stepsDone[i];
                return (
                  <li key={i}>
                    <a
                      href={`#section-${i + 1}`}
                      className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                    >
                      <span className={cn(
                        "h-4 w-4 rounded-full text-[9px] flex items-center justify-center border shrink-0",
                        isDone
                          ? "bg-[var(--color-success)]/15 border-[var(--color-success)]/40 text-[var(--color-success)]"
                          : "border-[var(--color-border)]",
                      )}>
                        {isDone ? "✓" : i + 1}
                      </span>
                      <span className="truncate">{s.title}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="border-t border-[var(--color-border)] pt-5">
            <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2">Mission</div>
            {completed ? (
              <button
                type="button"
                onClick={reopenMission}
                disabled={savingComplete}
                className="w-full h-10 rounded-md bg-[var(--color-success)]/15 border border-[var(--color-success)]/30 text-[var(--color-success)] hover:bg-[var(--color-success)]/20 text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {savingComplete ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Mission complete
              </button>
            ) : (
              <button
                type="button"
                onClick={completeMission}
                disabled={savingComplete}
                className="w-full h-10 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {savingComplete ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Mark mission done
              </button>
            )}
            <p className="text-[11px] text-[var(--color-text-subtle)] mt-2 leading-relaxed">{mission.verify.explain}</p>
          </div>
        </div>
      </aside>

      {/* Mobile sticky bar */}
      <div className="lg:hidden -mx-8 mt-6 px-8 py-3 sticky bottom-0 bg-[var(--color-bg)]/85 backdrop-blur-md border-t border-[var(--color-border)]">
        {completed ? (
          <button
            type="button"
            onClick={reopenMission}
            disabled={savingComplete}
            className="w-full h-10 rounded-md bg-[var(--color-success)]/15 border border-[var(--color-success)]/30 text-[var(--color-success)] text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <CheckCircle2 size={14} /> Mission complete
          </button>
        ) : (
          <button
            type="button"
            onClick={completeMission}
            disabled={savingComplete}
            className="w-full h-10 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <CheckCircle2 size={14} /> Mark mission done
          </button>
        )}
      </div>
    </div>
  );
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
        <div>
          <h3 className="text-2xl font-semibold tracking-tight">{step.title}</h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">{step.description}</p>
        </div>
      );
    case "richContent":
      return <RichContentStep step={step} />;
    case "setupChecklist":
      return <SetupChecklistStep step={step} evidence={evidence} onEvidence={onEvidence} />;
    case "actionInventory":
      return <ActionInventoryStep step={step} evidence={evidence} onEvidence={onEvidence} />;
    case "channelPlanner":
      return <ChannelPlannerStep step={step} evidence={evidence} onEvidence={onEvidence} />;
    case "promptDesigner":
      return <PromptDesignerStep step={step} evidence={evidence} onEvidence={onEvidence} />;
    case "coderPrompt":
      return <CoderPromptStep step={step} />;
  }
}
