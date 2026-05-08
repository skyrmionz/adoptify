type Row = {
  label: string;
  value: number;
  // Optional split for "calls" charts: success vs error.
  split?: { success: number; error: number };
  meta?: string; // small right-aligned label (e.g. "12% errors")
};

export function HBarList({
  title,
  subtitle,
  rows,
  rightHeader,
}: {
  title: string;
  subtitle?: string;
  rows: Row[];
  rightHeader?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <div className="surface-card p-5">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-text-muted)]">{title}</div>
          {subtitle && <div className="text-base font-semibold mt-1">{subtitle}</div>}
        </div>
        {rightHeader && (
          <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-text-subtle)]">{rightHeader}</div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="text-sm text-[var(--color-text-muted)]">No data yet.</div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const pct = (r.value / max) * 100;
            const splitTotal = r.split ? r.split.success + r.split.error : 0;
            const successPct = splitTotal > 0 ? (r.split!.success / splitTotal) * pct : pct;
            const errorPct = splitTotal > 0 ? (r.split!.error / splitTotal) * pct : 0;
            return (
              <li key={r.label}>
                <div className="flex items-baseline justify-between text-xs mb-1.5 gap-3">
                  <span className="text-[var(--color-text)] truncate">{r.label}</span>
                  <span className="text-[var(--color-text-muted)] tabular-nums whitespace-nowrap">
                    {r.value.toLocaleString()}{r.meta ? ` · ${r.meta}` : ""}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--color-surface-2)] overflow-hidden flex">
                  {r.split ? (
                    <>
                      <div className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-glow)]" style={{ width: `${successPct}%` }} />
                      <div className="h-full bg-[var(--color-danger)]" style={{ width: `${errorPct}%` }} />
                    </>
                  ) : (
                    <div className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-glow)]" style={{ width: `${pct}%` }} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
