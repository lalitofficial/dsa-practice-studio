import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useProblems, useSheets, useUpdateProgress } from "../lib/api";
import { CenteredMessage, DifficultyBadge, EmptyState, Spinner } from "../components/ui";
import type { Problem } from "../lib/types";

type StatusFilter = "all" | "todo" | "done";
type DiffFilter = "all" | "easy" | "medium" | "hard";

export default function SheetView() {
  const { sheetId } = useParams();
  const { data: problems, isLoading, isError } = useProblems(sheetId);
  const { data: sheets } = useSheets();
  const sheet = sheets?.find((s) => s.id === sheetId);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [diff, setDiff] = useState<DiffFilter>("all");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!problems) return [];
    const q = query.trim().toLowerCase();
    return problems.filter((p) => {
      if (status === "done" && !p.done) return false;
      if (status === "todo" && p.done) return false;
      if (diff !== "all" && p.difficulty.toLowerCase() !== diff) return false;
      if (q && !p.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [problems, query, status, diff]);

  const grouped = useMemo(() => {
    const units = new Map<string, Map<string, Problem[]>>();
    for (const p of filtered) {
      if (!units.has(p.unit)) units.set(p.unit, new Map());
      const chapters = units.get(p.unit)!;
      if (!chapters.has(p.chapter)) chapters.set(p.chapter, []);
      chapters.get(p.chapter)!.push(p);
    }
    return units;
  }, [filtered]);

  if (isLoading) {
    return (
      <CenteredMessage>
        <Spinner />
      </CenteredMessage>
    );
  }
  if (isError || !problems) {
    return <EmptyState title="Couldn't load problems" hint="Try refreshing the page." />;
  }

  const done = problems.filter((p) => p.done).length;
  const pct = problems.length ? Math.round((done / problems.length) * 100) : 0;

  const toggleUnit = (unit: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(unit) ? next.delete(unit) : next.add(unit);
      return next;
    });

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <Link to="/" className="text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400">
          ← All tracks
        </Link>
        <div className="mt-2 flex items-end justify-between gap-4">
          <h1 className="text-2xl font-bold">{sheet?.label ?? sheetId}</h1>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {done}/{problems.length} · {pct}%
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-14 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white/90 p-2 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search problems…"
          className="min-w-[8rem] flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-indigo-400 dark:border-slate-700"
        />
        <Segmented
          value={status}
          onChange={(v) => setStatus(v as StatusFilter)}
          options={[
            ["all", "All"],
            ["todo", "Todo"],
            ["done", "Done"],
          ]}
        />
        <Segmented
          value={diff}
          onChange={(v) => setDiff(v as DiffFilter)}
          options={[
            ["all", "Any"],
            ["easy", "Easy"],
            ["medium", "Med"],
            ["hard", "Hard"],
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No problems match" hint="Adjust your search or filters." />
      ) : (
        <div className="space-y-4">
          {[...grouped.entries()].map(([unit, chapters]) => {
            const unitProblems = [...chapters.values()].flat();
            const unitDone = unitProblems.filter((p) => p.done).length;
            const isCollapsed = collapsed.has(unit);
            return (
              <section
                key={unit}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <button
                  onClick={() => toggleUnit(unit)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <span className={`text-slate-400 transition-transform ${isCollapsed ? "" : "rotate-90"}`}>
                    ▶
                  </span>
                  <span className="font-semibold">{unit}</span>
                  <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                    {unitDone}/{unitProblems.length}
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="border-t border-slate-100 dark:border-slate-800">
                    {[...chapters.entries()].map(([chapter, items]) => (
                      <div key={chapter}>
                        <p className="bg-slate-50 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-400 dark:bg-slate-800/40">
                          {chapter}
                        </p>
                        <ul>
                          {items.map((p) => (
                            <ProblemRow key={p.id} problem={p} sheetId={sheetId!} />
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
      {options.map(([val, label]) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            value === val
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ProblemRow({ problem, sheetId }: { problem: Problem; sheetId: string }) {
  const update = useUpdateProgress();
  return (
    <li className="flex items-center gap-3 border-t border-slate-100 px-4 py-2.5 first:border-t-0 dark:border-slate-800">
      <input
        type="checkbox"
        checked={problem.done}
        onChange={() => update.mutate({ problemId: problem.id, sheetId, patch: { done: !problem.done } })}
        className="size-4 shrink-0 cursor-pointer accent-indigo-500"
        aria-label={problem.done ? "Mark as not done" : "Mark as done"}
      />
      <Link
        to={`/problem/${problem.id}`}
        className={`min-w-0 flex-1 truncate text-sm hover:text-indigo-600 dark:hover:text-indigo-400 ${
          problem.done ? "text-slate-400 line-through" : ""
        }`}
      >
        {problem.title}
      </Link>
      <DifficultyBadge value={problem.difficulty} />
      <button
        onClick={() => update.mutate({ problemId: problem.id, sheetId, patch: { starred: !problem.starred } })}
        className={`shrink-0 text-lg leading-none ${
          problem.starred ? "text-amber-400" : "text-slate-300 hover:text-amber-400 dark:text-slate-600"
        }`}
        aria-label={problem.starred ? "Unstar" : "Star"}
        title={problem.starred ? "Unstar" : "Star"}
      >
        {problem.starred ? "★" : "☆"}
      </button>
    </li>
  );
}
