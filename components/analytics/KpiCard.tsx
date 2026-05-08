import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function KpiCard({
  label,
  value,
  delta,
  spark,
}: {
  label: string;
  value: string;
  delta?: { value: string; positive: boolean };
  spark?: number[];
}) {
  return (
    <div className="surface-card p-5">
      <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-text-muted)]">{label}</div>
      <div className="mt-2 flex items-baseline gap-3">
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        {delta && (
          <span className={"inline-flex items-center text-xs " + (delta.positive ? "text-[var(--color-success)]" : "text-[var(--color-danger)]")}>
            {delta.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {delta.value}
          </span>
        )}
      </div>
      {spark && spark.length > 1 && <Sparkline data={spark} />}
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const w = 120;
  const h = 28;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 w-full h-7" preserveAspectRatio="none">
      <polyline fill="none" stroke="url(#sg)" strokeWidth="1.5" points={pts} />
      <defs>
        <linearGradient id="sg" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="var(--color-accent)" />
          <stop offset="100%" stopColor="var(--color-glow)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
