import type { Count } from "@/lib/admin/analytics";
import { EmptyState } from "./shell";

export function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Panel({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <h2 className="text-base font-bold">{title}</h2>
      {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Accessible horizontal bar list — values are always visible as text. */
export function BarList({ data, denominator, label = (k: string) => k, limit = 8 }: { data: Count[]; denominator?: number; label?: (k: string) => string; limit?: number }) {
  if (!data.length) return <EmptyState title="No data yet" body="This fills in as leads arrive." />;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <ul className="space-y-2.5">
      {data.slice(0, limit).map((d) => (
        <li key={d.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{label(d.key)}</span>
            <span className="shrink-0 font-semibold tabular-nums">
              {d.count}
              {denominator ? <span className="ml-1 font-normal text-muted">({Math.round((d.count / denominator) * 100)}%)</span> : null}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-lavender" aria-hidden>
            <div className="h-2 rounded-full bg-gradient-to-r from-purple to-lilac" style={{ width: `${(d.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
