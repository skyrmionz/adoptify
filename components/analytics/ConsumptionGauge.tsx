// Half-moon gauge for consumption with an MTD/forecast pair underneath. Designed to
// answer "am I burning my Agentforce Conversations capacity faster than budgeted?"
export function ConsumptionGauge({
  used,
  capacity,
  forecast,
  series,
}: {
  used: number;
  capacity: number;
  forecast?: number;
  series?: number[]; // last 14 days for the spark
}) {
  const ratio = capacity > 0 ? Math.min(1, used / capacity) : 0;
  const forecastRatio = capacity > 0 && forecast ? Math.min(1, forecast / capacity) : 0;

  const r = 60;
  const cx = 80;
  const cy = 80;
  // Gauge is a 180° arc from (cx-r, cy) to (cx+r, cy).
  function arcPath(fromAngle: number, toAngle: number) {
    const fx = cx + r * Math.cos(Math.PI - Math.PI * fromAngle);
    const fy = cy - r * Math.sin(Math.PI - Math.PI * fromAngle);
    const tx = cx + r * Math.cos(Math.PI - Math.PI * toAngle);
    const ty = cy - r * Math.sin(Math.PI - Math.PI * toAngle);
    const large = toAngle - fromAngle > 0.5 ? 1 : 0;
    return `M ${fx.toFixed(2)} ${fy.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${tx.toFixed(2)} ${ty.toFixed(2)}`;
  }

  const usedColor = ratio > 0.9 ? "var(--color-danger)" : ratio > 0.7 ? "var(--color-warning)" : "var(--color-glow)";

  // 14-day spark.
  const sparkPath = (() => {
    if (!series || series.length < 2) return "";
    const w = 220;
    const h = 36;
    const max = Math.max(...series);
    const min = Math.min(...series);
    const span = max - min || 1;
    return series
      .map((v, i) => {
        const x = (i / (series.length - 1)) * w;
        const y = h - ((v - min) / span) * h;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  })();

  return (
    <div className="surface-card p-5">
      <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-text-muted)]">Capacity</div>
      <div className="text-base font-semibold mt-1 mb-4">Agentforce Conversations · this month</div>

      <div className="flex items-end gap-6 flex-wrap">
        <div className="relative shrink-0">
          <svg viewBox="0 0 160 96" className="w-44 h-28">
            <path d={arcPath(0, 1)} fill="none" stroke="var(--color-surface-2)" strokeWidth="10" strokeLinecap="round" />
            {forecastRatio > 0 && (
              <path d={arcPath(0, forecastRatio)} fill="none" stroke="var(--color-warning)" strokeOpacity="0.3" strokeWidth="10" strokeLinecap="round" />
            )}
            <path d={arcPath(0, ratio)} fill="none" stroke={usedColor} strokeWidth="10" strokeLinecap="round" />
            <text x="80" y="78" textAnchor="middle" fontSize="22" fontWeight="600" fill="var(--color-text)">
              {capacity > 0 ? `${Math.round(ratio * 100)}%` : "—"}
            </text>
          </svg>
        </div>

        <div className="flex-1 min-w-[180px] space-y-2">
          <Row label="Used (MTD)" value={used.toLocaleString()} />
          <Row label="Capacity" value={capacity > 0 ? capacity.toLocaleString() : "—"} />
          {forecast != null && (
            <Row
              label="Forecast (month-end)"
              value={forecast.toLocaleString()}
              hint={capacity > 0 && forecast > capacity ? `over by ${(forecast - capacity).toLocaleString()}` : capacity > 0 ? `${Math.round((forecast / capacity) * 100)}% of capacity` : undefined}
              hintTone={capacity > 0 && forecast > capacity ? "danger" : "muted"}
            />
          )}
        </div>
      </div>

      {series && series.length > 1 && (
        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-1">14-day trend</div>
          <svg viewBox="0 0 220 36" className="w-full h-9" preserveAspectRatio="none">
            <path d={sparkPath} fill="none" stroke="url(#cg)" strokeWidth="1.5" />
            <defs>
              <linearGradient id="cg" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="var(--color-accent)" />
                <stop offset="100%" stopColor="var(--color-glow)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, hint, hintTone }: { label: string; value: string; hint?: string; hintTone?: "danger" | "muted" }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
      <span className="text-sm tabular-nums whitespace-nowrap">
        <span className="text-[var(--color-text)] font-medium">{value}</span>
        {hint && (
          <span className={"ml-2 text-[11px] " + (hintTone === "danger" ? "text-[var(--color-danger)]" : "text-[var(--color-text-subtle)]")}>{hint}</span>
        )}
      </span>
    </div>
  );
}
