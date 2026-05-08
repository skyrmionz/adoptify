// Hour x Day-of-Week heatmap. Standard visualization for showing when activity peaks
// across a typical week. 7 rows (Sun..Sat), 24 columns (00..23).
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function Heatmap({
  title,
  subtitle,
  data, // [day][hour]
}: {
  title: string;
  subtitle?: string;
  data: number[][];
}) {
  const max = Math.max(1, ...data.flat());

  function intensity(v: number): string {
    if (v === 0) return "rgba(255,255,255,0.04)";
    const ratio = Math.min(1, v / max);
    // Interpolate from a faint surface to the brand cyan.
    const a = 0.12 + 0.78 * ratio;
    return `rgba(31, 224, 255, ${a.toFixed(3)})`;
  }

  return (
    <div className="surface-card p-5">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-text-muted)]">{title}</div>
          {subtitle && <div className="text-base font-semibold mt-1">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-muted)]">
          <span>Less</span>
          <div className="flex gap-0.5">
            {[0.15, 0.35, 0.55, 0.75, 0.95].map((a) => (
              <span key={a} className="h-3 w-3 rounded-sm" style={{ background: `rgba(31, 224, 255, ${a})` }} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[36px_repeat(24,1fr)] gap-0.5 text-[10px] text-[var(--color-text-subtle)] mb-1">
            <div />
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="text-center">{h % 3 === 0 ? `${h}` : ""}</div>
            ))}
          </div>
          {data.map((row, dow) => (
            <div key={dow} className="grid grid-cols-[36px_repeat(24,1fr)] gap-0.5 mb-0.5">
              <div className="text-[10px] text-[var(--color-text-subtle)] flex items-center">{DAYS[dow]}</div>
              {row.map((v, h) => (
                <div
                  key={h}
                  title={`${DAYS[dow]} ${String(h).padStart(2, "0")}:00 — ${v} session${v === 1 ? "" : "s"}`}
                  className="h-5 rounded-sm"
                  style={{ background: intensity(v) }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
