import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAllProblems } from "../lib/api";
import { DifficultyBadge, Spinner } from "./ui";

type Diff = "all" | "easy" | "medium" | "hard";

function Seg({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map(([v, l]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
            value === v
              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { data: problems, isLoading } = useAllProblems(open);
  const [q, setQ] = useState("");
  const [diff, setDiff] = useState<Diff>("all");
  const [sheet, setSheet] = useState<string>("all");
  const [hi, setHi] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setHi(0);
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);
  useEffect(() => setHi(0), [q, diff, sheet]);

  const sheets = useMemo(() => {
    const m = new Map<string, string>();
    problems?.forEach((p) => m.set(p.sheetId, p.sheetLabel));
    return [...m.entries()];
  }, [problems]);

  const results = useMemo(() => {
    if (!problems) return [];
    const ql = q.trim().toLowerCase();
    return problems
      .filter((p) => {
        if (diff !== "all" && p.difficulty.toLowerCase() !== diff) return false;
        if (sheet !== "all" && p.sheetId !== sheet) return false;
        if (
          ql &&
          !p.title.toLowerCase().includes(ql) &&
          !p.unit.toLowerCase().includes(ql) &&
          !p.chapter.toLowerCase().includes(ql)
        )
          return false;
        return true;
      })
      .slice(0, 60);
  }, [problems, q, diff, sheet]);

  if (!open) return null;

  const go = (id: string) => {
    onClose();
    navigate(`/problem/${id}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((h) => Math.min(results.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[hi];
      if (r) go(r.id);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[10vh]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="border-b border-slate-200 p-3 dark:border-slate-800">
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search problems & topics…"
            className="w-full bg-transparent px-2 py-1.5 text-base outline-none"
          />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Seg
              value={diff}
              onChange={(v) => setDiff(v as Diff)}
              options={[
                ["all", "Any"],
                ["easy", "Easy"],
                ["medium", "Med"],
                ["hard", "Hard"],
              ]}
            />
            {sheets.length > 1 && (
              <Seg
                value={sheet}
                onChange={setSheet}
                options={[["all", "All sheets"], ...sheets.map(([id, label]) => [id, label] as [string, string])]}
              />
            )}
          </div>
        </div>

        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-1">
          {isLoading ? (
            <div className="grid place-items-center py-10">
              <Spinner />
            </div>
          ) : results.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">No matches</p>
          ) : (
            results.map((r, i) => (
              <button
                key={r.id}
                onMouseEnter={() => setHi(i)}
                onClick={() => go(r.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${
                  i === hi ? "bg-indigo-50 dark:bg-indigo-500/15" : ""
                }`}
              >
                <span className={`text-sm ${r.done ? "text-emerald-500" : "text-slate-300 dark:text-slate-600"}`}>
                  {r.done ? "✓" : "○"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r.title}</span>
                  <span className="block truncate text-xs text-slate-400">
                    {r.sheetLabel} · {r.unit}
                  </span>
                </span>
                <DifficultyBadge value={r.difficulty} />
              </button>
            ))
          )}
        </div>

        <div className="border-t border-slate-200 px-3 py-2 text-xs text-slate-400 dark:border-slate-800">
          ↑↓ navigate · ↵ open · esc close
        </div>
      </div>
    </div>
  );
}
