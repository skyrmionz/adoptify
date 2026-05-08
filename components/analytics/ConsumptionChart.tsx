"use client";

// Self-contained stacked-area chart in pure SVG. No chart library — keeps the bundle small
// and the styling fully under our control.

type Series = { name: string; color: string; data: number[] };

export function ConsumptionChart({ labels, series }: { labels: string[]; series: Series[] }) {
  const w = 720;
  const h = 220;
  const pad = { l: 40, r: 12, t: 12, b: 24 };

  const stacked: number[][] = [];
  for (let i = 0; i < labels.length; i++) {
    let acc = 0;
    const col: number[] = [];
    for (const s of series) {
      acc += s.data[i] ?? 0;
      col.push(acc);
    }
    stacked.push(col);
  }
  const max = Math.max(1, ...stacked.flat());

  function x(i: number) {
    return pad.l + (i / (labels.length - 1)) * (w - pad.l - pad.r);
  }
  function y(v: number) {
    return pad.t + (1 - v / max) * (h - pad.t - pad.b);
  }

  const yTicks = 4;

  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-text-muted)]">Consumption</div>
          <div className="text-base font-semibold mt-1">Agent invocations · last 14 days</div>
        </div>
        <div className="flex items-center gap-3">
          {series.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.name}
            </div>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const v = (max / yTicks) * i;
          return (
            <g key={i}>
              <line x1={pad.l} y1={y(v)} x2={w - pad.r} y2={y(v)} stroke="var(--color-border)" strokeDasharray="2 4" />
              <text x={pad.l - 6} y={y(v) + 3} textAnchor="end" fontSize="10" fill="var(--color-text-subtle)">{Math.round(v)}</text>
            </g>
          );
        })}

        {[...series].reverse().map((s, idx) => {
          const seriesIdx = series.length - 1 - idx;
          const upper = stacked.map((col) => col[seriesIdx]);
          const lower = stacked.map((col, i) => (seriesIdx > 0 ? col[seriesIdx - 1] : 0) ?? 0);
          const top = upper.map((v, i) => `${x(i)},${y(v)}`).join(" ");
          const bot = [...lower].map((v, i) => `${x(i)},${y(v)}`).reverse().join(" ");
          return (
            <polygon key={s.name} fill={s.color} fillOpacity="0.18" stroke={s.color} strokeWidth="1" points={`${top} ${bot}`} />
          );
        })}

        {labels.map((l, i) =>
          i % 2 === 0 ? (
            <text key={i} x={x(i)} y={h - 6} textAnchor="middle" fontSize="10" fill="var(--color-text-subtle)">
              {l}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  );
}
