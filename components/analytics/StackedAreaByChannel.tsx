"use client";

// Stacked area chart of daily conversation counts colored by channel. The single
// most important chart on the dashboard — answers "are people using my agent?".
type Daily = { date: string; values: Record<string, number> };

export function StackedAreaByChannel({
  data,
  channels,
  title = "Conversation volume",
  subtitle = "Daily, by channel · last 30 days",
}: {
  data: Daily[];
  channels: { name: string; color: string }[];
  title?: string;
  subtitle?: string;
}) {
  const w = 720;
  const h = 220;
  const pad = { l: 36, r: 12, t: 12, b: 24 };

  const stacked: number[][] = [];
  for (const d of data) {
    let acc = 0;
    const col: number[] = [];
    for (const c of channels) {
      acc += d.values[c.name] ?? 0;
      col.push(acc);
    }
    stacked.push(col);
  }
  const max = Math.max(1, ...stacked.flat());
  const x = (i: number) => pad.l + (i / Math.max(1, data.length - 1)) * (w - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / max) * (h - pad.t - pad.b);
  const yTicks = 4;

  const formatDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="surface-card p-5">
      <div className="flex items-baseline justify-between mb-4 gap-4">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-text-muted)]">{title}</div>
          <div className="text-base font-semibold mt-1">{subtitle}</div>
        </div>
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          {channels.map((c) => (
            <div key={c.name} className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] whitespace-nowrap">
              <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
              {c.name}
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
              <text x={pad.l - 6} y={y(v) + 3} textAnchor="end" fontSize="10" fill="var(--color-text-subtle)">{Math.round(v).toLocaleString()}</text>
            </g>
          );
        })}

        {[...channels].reverse().map((c, idx) => {
          const seriesIdx = channels.length - 1 - idx;
          const upper = stacked.map((col) => col[seriesIdx]);
          const lower = stacked.map((col) => (seriesIdx > 0 ? col[seriesIdx - 1] : 0) ?? 0);
          const top = upper.map((v, i) => `${x(i)},${y(v)}`).join(" ");
          const bot = [...lower].map((v, i) => `${x(i)},${y(v)}`).reverse().join(" ");
          return (
            <polygon key={c.name} fill={c.color} fillOpacity="0.22" stroke={c.color} strokeWidth="1" points={`${top} ${bot}`} />
          );
        })}

        {data.map((d, i) => {
          const total = data.length;
          const showEvery = Math.max(1, Math.round(total / 6));
          if (i % showEvery !== 0 && i !== total - 1) return null;
          return (
            <text key={d.date} x={x(i)} y={h - 6} textAnchor="middle" fontSize="10" fill="var(--color-text-subtle)">
              {formatDate(d.date)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
