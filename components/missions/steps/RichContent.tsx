"use client";

import type { Step, RichBlock } from "@/content/types";
import { Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export function RichContentStep({ step }: { step: Extract<Step, { kind: "richContent" }> }) {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">{step.title}</h2>
        {step.subtitle && <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">{step.subtitle}</p>}
      </div>
      <div className="space-y-5 max-w-2xl">
        {step.blocks.map((block, i) => (
          <BlockRenderer key={i} block={block} />
        ))}
      </div>
    </div>
  );
}

function BlockRenderer({ block }: { block: RichBlock }) {
  switch (block.kind) {
    case "h": {
      const className = block.level === 2
        ? "text-lg font-semibold tracking-tight mt-4"
        : "text-base font-semibold tracking-tight mt-3";
      return block.level === 2
        ? <h3 className={className}>{block.text}</h3>
        : <h4 className={className}>{block.text}</h4>;
    }
    case "p":
      return <p className="text-[15px] leading-relaxed text-[var(--color-text-muted)]">{block.text}</p>;
    case "ul":
      return (
        <ul className="space-y-1.5">
          {block.items.map((it, i) => (
            <li key={i} className="text-[14px] leading-relaxed text-[var(--color-text-muted)] flex items-start gap-2">
              <span className="mt-2 h-1 w-1 rounded-full bg-[var(--color-glow)] shrink-0" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="space-y-1.5 list-decimal pl-5">
          {block.items.map((it, i) => (
            <li key={i} className="text-[14px] leading-relaxed text-[var(--color-text-muted)]">{it}</li>
          ))}
        </ol>
      );
    case "callout": {
      const Icon = block.tone === "warn" ? AlertTriangle : block.tone === "success" ? CheckCircle2 : Info;
      const colors = block.tone === "warn"
        ? "border-[var(--color-warning)]/30 text-[var(--color-warning)]"
        : block.tone === "success"
          ? "border-[var(--color-success)]/30 text-[var(--color-success)]"
          : "border-[var(--color-accent)]/30 text-[var(--color-glow)]";
      return (
        <div className={`flex items-start gap-3 rounded-md border ${colors} bg-[var(--color-surface)]/40 p-4`}>
          <Icon size={16} className="shrink-0 mt-0.5" />
          <div className="text-[14px] leading-relaxed text-[var(--color-text)]/90">{block.text}</div>
        </div>
      );
    }
    case "code":
      return (
        <pre className="rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] p-3 overflow-x-auto text-xs leading-relaxed">
          <code>{block.code}</code>
        </pre>
      );
    case "image":
      return (
        <div className="rounded-md border border-[var(--color-border)] overflow-hidden">
          <Image src={block.src} alt={block.alt} width={1200} height={600} className="w-full h-auto" />
        </div>
      );
    case "kv":
      return (
        <div className="rounded-md border border-[var(--color-border)] overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {block.rows.map((r, i) => (
                <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="bg-[var(--color-surface-2)]/60 px-3 py-2 text-[var(--color-text-muted)] w-1/3 align-top">{r.k}</td>
                  <td className="px-3 py-2 text-[var(--color-text)]">{r.v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}
