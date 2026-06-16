import type { ReactNode } from "react";

export function DifficultyBadge({ value }: { value: string }) {
  const key = value.trim().toLowerCase();
  const styles: Record<string, string> = {
    easy: "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/15",
    medium: "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-500/15",
    hard: "text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-500/15",
  };
  const cls = styles[key] || "text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800";
  const label = value ? value[0].toUpperCase() + value.slice(1).toLowerCase() : "—";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

export function ProgressRing({
  value,
  size = 76,
  stroke = 8,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="fill-none stroke-slate-200 dark:stroke-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="fill-none stroke-indigo-500 transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label ?? `${Math.round(pct)}%`}
      </span>
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block size-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500 dark:border-slate-700 dark:border-t-indigo-400 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function CenteredMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
      {children}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <CenteredMessage>
      <p className="text-base font-medium text-slate-600 dark:text-slate-300">{title}</p>
      {hint && <p className="text-sm">{hint}</p>}
    </CenteredMessage>
  );
}
