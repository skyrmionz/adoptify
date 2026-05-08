// Donut for the {resolved | escalated | active | abandoned} mix with a center "resolution rate".
type Slice = { label: string; value: number; color: string };

export function ResolutionDonut({
  resolved,
  escalated,
  active,
  abandoned,
}: {
  resolved: number;
  escalated: number;
  active: number;
  abandoned: number;
}) {
  const total = resolved + escalated + active + abandoned;
  const slices: Slice[] = [
    { label: "Resolved", value: resolved, color: "#22C55E" },
    { label: "Escalated", value: escalated, color: "#F5B83D" },
    { label: "Active", value: active, color: "#00A1E0" },
    { label: "Abandoned", value: abandoned, color: "#5C6A85" },
  ];
  const r = 38;
  const c = 2 * Math.PI * r;
  let acc = 0;
  const segs = slices.map((s) => {
    const len = total === 0 ? 0 : (s.value / total) * c;
    const seg = { color: s.color, length: len, offset: -acc };
    acc += len;
    return seg;
  });
  const resolutionPct = total === 0 ? 0 : Math.round((resolved / total) * 100);

  return (
    <div className="surface-card p-5">
      <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-text-muted)]">Conversation outcomes</div>
      <div className="text-base font-semibold mt-1 mb-4">Resolution mix · last 30 days</div>

      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          <svg viewBox="0 0 100 100" className="w-32 h-32" aria-hidden>
            <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth="10" />
            {segs.map((s, i) => (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="10"
                strokeDasharray={`${s.length} ${c}`}
                strokeDashoffset={s.offset}
                transform="rotate(-90 50 50)"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-2xl font-semibold tracking-tight tabular-nums">{resolutionPct}%</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Resolved</div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {slices.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="text-sm text-[var(--color-text)] flex-1 truncate">{s.label}</span>
              <span className="text-xs text-[var(--color-text-muted)] tabular-nums whitespace-nowrap">{s.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
